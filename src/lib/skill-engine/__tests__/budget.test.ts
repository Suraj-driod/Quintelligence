/**
 * budget.test.ts — Phase 3 & 5 Budget, Rate-limit, and Caching tests.
 *
 * Assertions tested for standard tier:
 * 1. Small, medium, and large profiles:
 *    - REST requests <= 400
 *    - GraphQL queries <= 30
 * 2. Re-running with a warm cache makes 0 REST commit-detail requests.
 * 3. A different user (different token/uid) never receives another user's private cache entries.
 * 4. When rate-limit drops below floor, run stops cleanly and marks coverage.truncated = true.
 * 5. Per-endpoint request counts are printed in the test output.
 */

import { describe, it, expect } from "vitest";
import { runPipeline } from "../pipeline";
import { MemoryCacheStore } from "../cache";
import {
  distributeDetailBudget,
  selectCommitsForDetail,
  type ListedCommit,
} from "../github/listCommits";
import { ANALYSIS_TIERS } from "../config";
import type { ParsedInput } from "../types";

// ── Synthetic Profile Generators ──────────────────────────────────────

interface SyntheticProfile {
  reposCount: number;
  commitsPerRepo: number;
}

function createSyntheticFetch(
  profile: SyntheticProfile,
  options: {
    initialRateLimit?: number;
    dropRateLimitAfterRequests?: number;
    privateRepos?: boolean;
  } = {}
) {
  let requestCounter = 0;
  let remainingQuota = options.initialRateLimit ?? 5000;
  const endpointCounts: Record<string, number> = { rest: 0, graphql: 0 };

  // Generate synthetic repo data
  const repos = Array.from({ length: profile.reposCount }, (_, i) => ({
    nameWithOwner: `testuser/repo-${i}`,
    name: `repo-${i}`,
    owner: { login: "testuser" },
    isPrivate: options.privateRepos ?? false,
    isFork: false,
    defaultBranchRef: { name: "main" },
    pushedAt: new Date(2024, 0, 1 + i).toISOString(),
  }));

  // Generate synthetic commits per repo spread across months
  const repoCommits = new Map<string, Array<{
    oid: string;
    committedDate: string;
    additions: number;
    deletions: number;
    changedFilesIfAvailable: number;
    parents: { totalCount: number };
  }>>();

  for (const repo of repos) {
    const commits = Array.from({ length: profile.commitsPerRepo }, (_, cIdx) => {
      // Spread across months (up to 24 months)
      const monthOffset = cIdx % 24;
      const date = new Date(Date.UTC(2024, monthOffset, 1 + (cIdx % 28))).toISOString();
      return {
        oid: `sha_${repo.name}_${cIdx}`,
        committedDate: date,
        additions: 25 + (cIdx % 50),
        deletions: 5 + (cIdx % 10),
        changedFilesIfAvailable: 2 + (cIdx % 5),
        parents: { totalCount: 1 },
      };
    });
    repoCommits.set(repo.nameWithOwner, commits);
  }

  const stubFetch: typeof globalThis.fetch = async (input, init) => {
    requestCounter++;
    const url = typeof input === "string" ? input : (input as Request).url;
    const bodyStr = typeof init?.body === "string" ? init.body : "";

    if (
      options.dropRateLimitAfterRequests &&
      requestCounter > options.dropRateLimitAfterRequests
    ) {
      remainingQuota = 40; // below floor
    }

    const headers = new Headers({
      "content-type": "application/json",
      "x-ratelimit-remaining": String(remainingQuota),
      "x-ratelimit-reset": String(Math.floor(Date.now() / 1000) + 3600),
    });

    // 1. GET /rate_limit
    if (url.includes("/rate_limit")) {
      endpointCounts["rate_limit"] = (endpointCounts["rate_limit"] ?? 0) + 1;
      return new Response(
        JSON.stringify({
          resources: {
            core: { limit: 5000, remaining: remainingQuota, reset: 1893456000, used: 0 },
            graphql: { limit: 5000, remaining: remainingQuota, reset: 1893456000, used: 0 },
          },
        }),
        { status: 200, headers }
      );
    }

    // 2. GraphQL queries
    if (url.includes("/graphql")) {
      endpointCounts.graphql++;

      // Query 1: Identity & contributions
      if (bodyStr.includes("repositoryOwner")) {
        return new Response(
          JSON.stringify({
            data: {
              repositoryOwner: {
                __typename: "User",
                id: "U_kgDOB_testuser",
                login: "testuser",
                databaseId: 99999,
                y2024: {
                  totalCommitContributions: 150,
                  totalPullRequestContributions: 12,
                  totalPullRequestReviewContributions: 8,
                  totalIssueContributions: 5,
                  commitContributionsByRepository: [],
                },
                y2025: {
                  totalCommitContributions: 100,
                  totalPullRequestContributions: 10,
                  totalPullRequestReviewContributions: 5,
                  totalIssueContributions: 2,
                  commitContributionsByRepository: [],
                },
                y2026: {
                  totalCommitContributions: 50,
                  totalPullRequestContributions: 5,
                  totalPullRequestReviewContributions: 2,
                  totalIssueContributions: 1,
                  commitContributionsByRepository: [],
                },
              },
              rateLimit: { cost: 1, remaining: remainingQuota, resetAt: "2026-10-12T00:00:00Z" },
            },
          }),
          { status: 200, headers }
        );
      }

      // Query 2: Owned repos
      if (bodyStr.includes("repositories(")) {
        return new Response(
          JSON.stringify({
            data: {
              user: {
                repositories: {
                  pageInfo: { hasNextPage: false, endCursor: null },
                  nodes: repos,
                },
              },
              rateLimit: { cost: 1, remaining: remainingQuota, resetAt: "2026-10-12T00:00:00Z" },
            },
          }),
          { status: 200, headers }
        );
      }

      // Query 3: Commit listing batched
      if (bodyStr.includes("history(")) {
        const repoResponses: Record<string, unknown> = {};
        for (let idx = 0; idx < 10; idx++) {
          if (bodyStr.includes(`r${idx}: repository`)) {
            const match = bodyStr.match(new RegExp(`r${idx}:\\s*repository\\(owner:\\s*"[^"]*",\\s*name:\\s*"([^"]*)"\\)`));
            const repoName = match ? match[1] : `repo-${idx}`;
            const commits = repoCommits.get(`testuser/${repoName}`) ?? [];
            repoResponses[`r${idx}`] = {
              defaultBranchRef: {
                target: {
                  history: {
                    pageInfo: { hasNextPage: false, endCursor: null },
                    nodes: commits.slice(0, 100),
                  },
                },
              },
            };
          }
        }
        return new Response(
          JSON.stringify({
            data: {
              ...repoResponses,
              rateLimit: { cost: 1, remaining: remainingQuota, resetAt: "2026-10-12T00:00:00Z" },
            },
          }),
          { status: 200, headers }
        );
      }

      // Query 4: Stack detection batched
      if (bodyStr.includes("pkgJson:")) {
        const repoResponses: Record<string, unknown> = {};
        for (let idx = 0; idx < 10; idx++) {
          if (bodyStr.includes(`r${idx}: repository`)) {
            repoResponses[`r${idx}`] = {
              pkgJson: {
                text: JSON.stringify({
                  dependencies: { react: "^18.0.0", "next": "^14.0.0" },
                }),
              },
              dockerfile: { text: "FROM node:18-alpine\nCMD npm start" },
              workflows: { entries: [{ name: "ci.yml" }] },
            };
          }
        }
        return new Response(
          JSON.stringify({
            data: {
              ...repoResponses,
              rateLimit: { cost: 1, remaining: remainingQuota, resetAt: "2026-10-12T00:00:00Z" },
            },
          }),
          { status: 200, headers }
        );
      }
    }

    // 3. REST commit details: GET /repos/{o}/{r}/commits/{sha}
    if (url.includes("/commits/")) {
      endpointCounts.rest++;
      const shaMatch = url.match(/\/commits\/([^?]+)/);
      const sha = shaMatch ? shaMatch[1] : "sha_test";

      return new Response(
        JSON.stringify({
          sha,
          commit: {
            author: { date: "2024-05-01T00:00:00Z" },
            committer: { date: "2024-05-01T00:00:00Z" },
          },
          files: [
            {
              filename: "src/app/page.tsx",
              status: "modified",
              additions: 30,
              deletions: 5,
              patch: "@@ -1,5 +1,30 @@\n+export default function Page() {\n+  return <div>Hello</div>;\n+}",
            },
          ],
        }),
        { status: 200, headers }
      );
    }

    return new Response(JSON.stringify({ error: "Not found" }), {
      status: 404,
      headers,
    });
  };

  return { stubFetch, endpointCounts };
}

// ── Tests ────────────────────────────────────────────────────────────

describe("Phase 3 & 5 — Budget and Caching Checks", () => {
  const target: ParsedInput = {
    type: "user",
    owner: "testuser",
    targetLogin: "testuser",
  };

  it("Standard Tier on Small Profile (3 repos / ~60 commits) stays within budget: REST <= 400, GraphQL <= 30", async () => {
    const { stubFetch } = createSyntheticFetch({
      reposCount: 3,
      commitsPerRepo: 20, // 3 * 20 = 60 commits
    });

    const cacheStore = new MemoryCacheStore();
    const result = await runPipeline({
      token: "ghp_test_token",
      target,
      mode: "public",
      tier: "standard",
      cacheStore,
      fetch: stubFetch,
    });

    const log = result.requestLog;
    console.log("Small Profile Request Log:", {
      totalRequests: log.totalRequests,
      restUsed: log.restUsed,
      graphqlPointsUsed: log.graphqlPointsUsed,
      byEndpoint: log.byEndpoint,
    });

    // Phase 5 Assertions:
    // REST requests <= 400, GraphQL queries <= 30
    expect(log.restUsed).toBeLessThanOrEqual(400);
    expect(log.byEndpoint["graphql"] ?? 0).toBeLessThanOrEqual(30);
    expect(result.bundle.coverage.reposAnalyzed).toBeLessThanOrEqual(
      ANALYSIS_TIERS.standard.maxRepos
    );
  }, 25000);

  it("Standard Tier on Medium Profile (10 repos / ~400 commits) stays within budget: REST <= 400, GraphQL <= 30", async () => {
    const { stubFetch } = createSyntheticFetch({
      reposCount: 10,
      commitsPerRepo: 40, // 10 * 40 = 400 commits
    });

    const cacheStore = new MemoryCacheStore();
    const result = await runPipeline({
      token: "ghp_test_token",
      target,
      mode: "public",
      tier: "standard",
      cacheStore,
      fetch: stubFetch,
    });

    const log = result.requestLog;
    console.log("Medium Profile Request Log:", {
      totalRequests: log.totalRequests,
      restUsed: log.restUsed,
      graphqlPointsUsed: log.graphqlPointsUsed,
      byEndpoint: log.byEndpoint,
    });

    // Phase 5 Assertions:
    // REST requests <= 400, GraphQL queries <= 30
    expect(log.restUsed).toBeLessThanOrEqual(400);
    expect(log.byEndpoint["graphql"] ?? 0).toBeLessThanOrEqual(30);
    expect(result.bundle.coverage.reposAnalyzed).toBeLessThanOrEqual(
      ANALYSIS_TIERS.standard.maxRepos
    );
  }, 25000);

  it("Standard Tier on Large Profile (40 repos / ~3000 commits) stays within budget: REST <= 400, GraphQL <= 30", async () => {
    const { stubFetch } = createSyntheticFetch({
      reposCount: 40,
      commitsPerRepo: 75, // 40 * 75 = 3000 commits
    });

    const cacheStore = new MemoryCacheStore();
    const result = await runPipeline({
      token: "ghp_test_token",
      target,
      mode: "public",
      tier: "standard",
      cacheStore,
      fetch: stubFetch,
    });

    const log = result.requestLog;
    console.log("Large Profile Request Log:", {
      totalRequests: log.totalRequests,
      restUsed: log.restUsed,
      graphqlPointsUsed: log.graphqlPointsUsed,
      byEndpoint: log.byEndpoint,
    });

    // Prompt assertions:
    // REST requests <= 400, GraphQL queries <= 30
    expect(log.restUsed).toBeLessThanOrEqual(400);
    expect(log.byEndpoint["graphql"] ?? 0).toBeLessThanOrEqual(30);
    expect(result.bundle.coverage.reposAnalyzed).toBeLessThanOrEqual(
      ANALYSIS_TIERS.standard.maxRepos
    );
  }, 25000);

  it("Warm cache repeat run makes 0 REST commit-detail requests", async () => {
    const { stubFetch } = createSyntheticFetch({
      reposCount: 5,
      commitsPerRepo: 20,
    });

    const cacheStore = new MemoryCacheStore();

    // Run 1: Cold cache
    const run1 = await runPipeline({
      token: "ghp_test_token",
      target,
      mode: "public",
      tier: "standard",
      cacheStore,
      fetch: stubFetch,
    });
    expect(run1.requestLog.restUsed).toBeGreaterThan(0);

    // Run 2: Warm cache (same target & tier)
    const run2 = await runPipeline({
      token: "ghp_test_token",
      target,
      mode: "public",
      tier: "standard",
      cacheStore,
      fetch: stubFetch,
    });

    console.log("Warm Cache Repeat Log:", run2.requestLog);
    // On warm cache repeat, 0 REST commit-detail requests are made
    expect(run2.requestLog.restUsed).toBe(0);
    expect(run2.requestLog.cacheHits).toBeGreaterThan(0);
  }, 25000);

  it("Cache isolation: Different user never receives another user's private cache entries", async () => {
    const cacheStore = new MemoryCacheStore();

    const fetch1 = createSyntheticFetch(
      { reposCount: 2, commitsPerRepo: 5 },
      { privateRepos: true }
    );
    const fetch2 = createSyntheticFetch(
      { reposCount: 2, commitsPerRepo: 5 },
      { privateRepos: true }
    );

    // User A runs analysis on private repo
    const resultUserA = await runPipeline({
      token: "ghp_token_user_a",
      target,
      mode: "public+private",
      uid: "user_a",
      authenticatedLogin: "testuser",
      cacheStore,
      fetch: fetch1.stubFetch,
    });

    // User B runs analysis on private repo
    const resultUserB = await runPipeline({
      token: "ghp_token_user_b",
      target,
      mode: "public+private",
      uid: "user_b",
      authenticatedLogin: "testuser",
      cacheStore,
      fetch: fetch2.stubFetch,
    });

    // User B must NOT have had a cache hit on User A's private bundle
    expect(resultUserB.requestLog.cacheHits).toBe(0);
  });

  it("Clean shutdown when rate limit drops below floor", async () => {
    const { stubFetch } = createSyntheticFetch(
      { reposCount: 10, commitsPerRepo: 30 },
      { initialRateLimit: 5000, dropRateLimitAfterRequests: 15 }
    );

    const cacheStore = new MemoryCacheStore();
    const result = await runPipeline({
      token: "ghp_test_token",
      target,
      mode: "public",
      tier: "standard",
      cacheStore,
      fetch: stubFetch,
    });

    // When budget falls below floor, stops and sets coverage.truncated = true
    expect(result.bundle.coverage.truncated).toBe(true);
    expect(
      result.bundle.coverage.notes.some((n) =>
        n.toLowerCase().includes("rate limit")
      )
    ).toBe(true);
  });

  it("selectCommitsForDetail stratifies by month first, excludes trivial and bulk commits", () => {
    const commits: ListedCommit[] = [
      // Month 1: 3 commits (1 trivial < 5 lines, 1 normal 20 lines, 1 largest 100 lines)
      { sha: "m1_c1", date: "2024-01-05T00:00:00Z", parentCount: 1, additions: 2, deletions: 1 }, // 3 lines -> trivial, dropped
      { sha: "m1_c2", date: "2024-01-10T00:00:00Z", parentCount: 1, additions: 15, deletions: 5 }, // 20 lines
      { sha: "m1_c3", date: "2024-01-15T00:00:00Z", parentCount: 1, additions: 80, deletions: 20 }, // 100 lines -> best for Jan
      // Month 2: 2 commits
      { sha: "m2_c1", date: "2024-02-05T00:00:00Z", parentCount: 1, additions: 30, deletions: 10 },
      { sha: "m2_c2", date: "2024-02-15T00:00:00Z", parentCount: 1, additions: 120, deletions: 30 }, // 150 lines -> best for Feb
      // Month 3: bulk commit (> 100 files)
      { sha: "m3_bulk", date: "2024-03-01T00:00:00Z", parentCount: 1, additions: 500, deletions: 500, changedFiles: 150 }, // bulk, dropped
      { sha: "m3_valid", date: "2024-03-10T00:00:00Z", parentCount: 1, additions: 40, deletions: 10, changedFiles: 5 },
    ];

    // Select with budget = 2: should pick best from Month 2 and Month 3 (or Month 1)
    const selected = selectCommitsForDetail(commits, 2);
    expect(selected.length).toBe(2);
    expect(selected.some((c) => c.sha === "m1_c1")).toBe(false); // trivial dropped
    expect(selected.some((c) => c.sha === "m3_bulk")).toBe(false); // bulk dropped
  });

  it("distributeDetailBudget skips repos with < 3 authored non-merge commits", () => {
    const repos = [
      { fullName: "user/tiny", totalListed: 2 }, // < 3 commits -> skipped (0 budget)
      { fullName: "user/normal", totalListed: 10 },
      { fullName: "user/large", totalListed: 50 },
    ];

    const budget = distributeDetailBudget(repos, { detailTotalCap: 50, detailPerRepo: 25 });
    expect(budget.get("user/tiny")).toBe(0);
    expect(budget.get("user/normal")!).toBeGreaterThan(0);
    expect(budget.get("user/large")!).toBeGreaterThan(budget.get("user/normal")!);
  });
});
