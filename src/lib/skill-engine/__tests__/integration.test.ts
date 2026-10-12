/**
 * Phase 0 Regression Tests — Tests 0.11, 0.12, 0.14, 0.15, 0.16
 * Tests for repo discovery merging, commit listing truncation,
 * collaboration null fields, store encryption key safety, and gap analysis evidence coverage.
 */
import { describe, it, expect } from "vitest";
import { mergeAndRankRepos } from "../github/discoverRepos";
import { listCommitsForRepo } from "../github/listCommits";
import { fetchCollaboration } from "../pipeline";
import { createGitHubClient } from "../github/client";
import { analyzeRoleGap } from "../scoring/gapAnalysis";
import { storeGitHubToken } from "../store";
import type { DiscoveredRepo, CoverageInfo } from "../types";
import type { SkillProfile, RoleBenchmark } from "../scoring/types";

// ── Test 0.11: Repo discovery — owned + GraphQL merge ────────────────

describe("0.11 — Owned repo merges with GraphQL contributions", () => {
  it("should merge GraphQL contributed counts into owned repo entries and rank above drive-bys", () => {
    // Owned repo discovered via REST has 0 authored commits initially
    const ownedRepos: DiscoveredRepo[] = [
      {
        fullName: "user/main-project",
        owner: "user",
        repo: "main-project",
        isPrivate: false,
        isFork: false,
        defaultBranch: "main",
        authoredCommitCount: 0, // REST listing didn't have commit count
        lastAuthoredCommitDate: "2024-03-01T00:00:00Z",
      },
    ];

    // GraphQL contributions show 50 commits to main-project, and 3 commits to drive-by repo
    const contributedRepos: DiscoveredRepo[] = [
      {
        fullName: "user/main-project",
        owner: "user",
        repo: "main-project",
        isPrivate: false,
        isFork: false,
        defaultBranch: "main",
        authoredCommitCount: 50,
        lastAuthoredCommitDate: "2024-03-01T00:00:00Z",
      },
      {
        fullName: "other/drive-by-repo",
        owner: "other",
        repo: "drive-by-repo",
        isPrivate: false,
        isFork: false,
        defaultBranch: "main",
        authoredCommitCount: 3,
        lastAuthoredCommitDate: "2024-02-01T00:00:00Z",
      },
    ];

    const merged = mergeAndRankRepos(ownedRepos, contributedRepos);

    // BUG in current code: if repos.has(repo.fullName) was true, contributed commit count was discarded.
    // The owned repo stayed at 0 commits, and drive-by (3 commits) ranked first!
    // Expected after fix: counts merged (0 + 50 = 50), and owned repo ranks top.
    const mainRepo = merged.find((r) => r.fullName === "user/main-project");
    expect(mainRepo?.authoredCommitCount).toBe(50);
    expect(merged[0].fullName).toBe("user/main-project");
  });
});

// ── Test 0.12: LIST_PAGES_MAX reached → truncated ────────────────────

describe("0.12 — Commit list hits LIST_PAGES_MAX", () => {
  it("should set coverage.truncated when max pages reached", async () => {
    // Stub fetch that returns a full page of 100 commits on every request
    const fullPageCommits = Array.from({ length: 100 }, (_, i) => ({
      sha: `sha_${i}`,
      commit: {
        author: { date: "2024-01-01T00:00:00Z" },
        committer: { date: "2024-01-01T00:00:00Z" },
      },
      author: { login: "testuser" },
      parents: [{ sha: "parent" }],
    }));

    let stubCallCount = 0;
    const stubFetch: typeof globalThis.fetch = async (input) => {
      stubCallCount++;
      return new Response(JSON.stringify(fullPageCommits), {
        status: 200,
        headers: new Headers({
          "content-type": "application/json",
          "x-ratelimit-remaining": "4900",
        }),
      });
    };

    const client = createGitHubClient({ token: "ghp_test", fetch: stubFetch });
    const repo: DiscoveredRepo = {
      fullName: "testuser/large-repo",
      owner: "testuser",
      repo: "large-repo",
      isPrivate: false,
      isFork: false,
      defaultBranch: "main",
      authoredCommitCount: 500,
      lastAuthoredCommitDate: "2024-01-01T00:00:00Z",
    };

    const coverage: CoverageInfo = {
      reposDiscovered: 1,
      reposAnalyzed: 1,
      commitsListed: 0,
      commitsDetailed: 0,
      truncated: false,
      notes: [],
    };

    await listCommitsForRepo(client, repo, "testuser", coverage);

    // BUG in current code: hitting LIST_PAGES_MAX quietly breaks without setting coverage.truncated = true
    // After fix: coverage.truncated must be true with an explanatory note.
    expect(coverage.truncated).toBe(true);
    expect(coverage.notes.some((n) => n.toLowerCase().includes("truncated"))).toBe(true);
  }, 15000);
});

// ── Test 0.14: Collaboration fields null when unavailable ────────────

describe("0.14 — Collaboration fields unavailable", () => {
  it("should return null for unavailable collaboration fields (prsMerged, comments), not 0", async () => {
    const stubFetch: typeof globalThis.fetch = async () => {
      return new Response(
        JSON.stringify({
          data: {
            user: {
              contributionsCollection: {
                totalCommitContributions: 10,
                totalIssueContributions: 2,
                totalPullRequestContributions: 5,
                totalPullRequestReviewContributions: 3,
              },
            },
          },
        }),
        {
          status: 200,
          headers: new Headers({
            "content-type": "application/json",
            "x-ratelimit-remaining": "4900",
          }),
        }
      );
    };

    const client = createGitHubClient({ token: "ghp_test", fetch: stubFetch });
    const coverage: CoverageInfo = {
      reposDiscovered: 1,
      reposAnalyzed: 1,
      commitsListed: 0,
      commitsDetailed: 0,
      truncated: false,
      notes: [],
    };

    const collab = await fetchCollaboration(client, "testuser", coverage);

    // BUG in current code: fields not fetched by API were initialized to 0
    // After Phase 2 fix: numeric fields become number | null, and unavailable fields are null.
    expect(collab.prsMerged).toBeNull();
    expect(collab.comments).toBeNull();
  });
});

// ── Test 0.15: Store encryption key safety ──────────────────────────

describe("0.15 — Store: encryption key safety", () => {
  it("should throw when TOKEN_ENCRYPTION_KEY is missing outside dev", async () => {
    const origEnv = process.env.NODE_ENV;
    const origKey = process.env.TOKEN_ENCRYPTION_KEY;

    try {
      (process.env as Record<string, string | undefined>).NODE_ENV = "production";
      delete process.env.TOKEN_ENCRYPTION_KEY;

      // In production with missing key, storeGitHubToken must throw
      await expect(
        storeGitHubToken("user123", "ghp_secret_token", ["repo"])
      ).rejects.toThrow(/TOKEN_ENCRYPTION_KEY is required outside development/);
    } finally {
      (process.env as Record<string, string | undefined>).NODE_ENV = origEnv;
      if (origKey !== undefined) {
        process.env.TOKEN_ENCRYPTION_KEY = origKey;
      }
    }
  });

  it("should reject an encryption key that is not exactly 32 bytes", async () => {
    const origKey = process.env.TOKEN_ENCRYPTION_KEY;

    try {
      // 16-byte key (too short)
      process.env.TOKEN_ENCRYPTION_KEY = Buffer.from(new Uint8Array(16)).toString("base64");

      await expect(
        storeGitHubToken("user123", "ghp_secret_token", ["repo"])
      ).rejects.toThrow(/32 bytes/);
    } finally {
      if (origKey !== undefined) {
        process.env.TOKEN_ENCRYPTION_KEY = origKey;
      } else {
        delete process.env.TOKEN_ENCRYPTION_KEY;
      }
    }
  });
});

// ── Test 0.16: Gap analysis — missing evidence ──────────────────────

describe("0.16 — Gap analysis: required skill with no evidence", () => {
  it("should compute matchPercentage only over skills with evidence and not count missing evidence as 0", () => {
    // Candidate profile has TypeScript at Level 4, but NO evidence for Python
    const profile: SkillProfile = {
      target: { login: "testuser", id: 123, mode: "public" },
      evaluatedAt: "2024-03-01T00:00:00Z",
      coverage: {
        reposDiscovered: 1,
        reposAnalyzed: 1,
        commitsListed: 10,
        commitsDetailed: 10,
        truncated: false,
        notes: [],
      },
      skills: [
        {
          skill: "TypeScript",
          level: 4,
          rawScore: 0.75,
          evidenceStrength: "High",
          signals: {
            volume: 0.8,
            depth: 0.8,
            sustained: 0.7,
            quality: 0.6,
          },
          metrics: {
            distinctFiles: 20,
            fileChangeEvents: 20,
            totalAdditions: 500,
            totalDeletions: 100,
            reposCount: 2,
            activeMonths12: 10,
            activeMonths36: 20,
            depthFeaturesDetected: ["generics"],
            testFilesCount: 5,
            sourceFilesCount: 15,
            unavailableSignals: [],
          },
          gatingNotes: [],
        },
      ],
      collaboration: {
        prsOpened: 0,
        prsMerged: null,
        reviewsGiven: 0,
        issuesOpened: 0,
        comments: null,
        windowMonths: 36,
      },
    };

    const role: RoleBenchmark = {
      roleId: "fullstack",
      roleName: "Full Stack Engineer",
      description: "Full stack engineering benchmark",
      requirements: [
        { skill: "TypeScript", requiredLevel: 3, importance: "required" },
        { skill: "Python", requiredLevel: 4, importance: "required" },
      ],
    };

    const result = analyzeRoleGap(profile, role);

    // BUG in current code: Python (no evidence) was added to totalWeightedTarget with 0 achieved,
    // resulting in matchPercentage = 6 / 14 = 43%.
    // Expected after Phase 2 fix:
    // matchPercentage is computed ONLY over requirements with evidence (TypeScript: 6 / 6 = 100%)
    // and evidenceCoverage = 1 / 2 = 0.5.
    expect(result.matchPercentage).toBe(100);
    expect((result as unknown as { evidenceCoverage: number }).evidenceCoverage).toBe(0.5);
  });
});
