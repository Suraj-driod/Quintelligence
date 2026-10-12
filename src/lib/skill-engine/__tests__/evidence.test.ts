/**
 * Phase 0 Regression Tests — Tests 0.4, 0.5, 0.13
 * Tests for evidence aggregation: distinct files vs repeated edits,
 * removed-only files, and the +++ line stripping bug.
 *
 * Phase 2: Updated to use FileEvidence.skills[] instead of .skill
 */
import { describe, it, expect } from "vitest";
import type { EvidenceBundle, FileEvidence } from "../types";
import { calculateVolumeSignal } from "../scoring/signals/volume";
import { evaluateEvidenceBundle } from "../scoring/evaluator";
import { extractAuthoredLines } from "../github/commitDetails";

// ── Test 0.4: Distinct files vs repeated edits ──────────────────────

describe("0.4 — One file edited in 40 commits vs 4 distinct files", () => {
  it("should score higher V for 4 distinct files than 1 file edited 40 times", () => {
    // Scenario A: 1 file edited in 40 commits (2 lines each)
    const singleFileEvidence: FileEvidence[] = Array.from({ length: 40 }, () => ({
      path: "src/main.ts",
      status: "modified" as const,
      additions: 2,
      deletions: 0,
      skills: ["TypeScript"],
    }));

    // Scenario B: 4 distinct files with substantial changes
    const multiFileEvidence: FileEvidence[] = [
      { path: "src/a.ts", status: "modified", additions: 100, deletions: 50, skills: ["TypeScript"] },
      { path: "src/b.ts", status: "added",    additions: 200, deletions: 0,  skills: ["TypeScript"] },
      { path: "src/c.ts", status: "modified", additions: 150, deletions: 30, skills: ["TypeScript"] },
      { path: "src/d.ts", status: "modified", additions: 80,  deletions: 20, skills: ["TypeScript"] },
    ];

    // Count distinct files
    const distinctA = new Set(singleFileEvidence.map(f => f.path)).size;
    const distinctB = new Set(multiFileEvidence.map(f => f.path)).size;

    expect(distinctA).toBe(1);
    expect(distinctB).toBe(4);

    // The 4-file case must score higher V.
    // New formula: V = 1 − exp(−raw/K), raw = Σ ln(1+c_f) per distinct file
    const vA = calculateVolumeSignal(singleFileEvidence).score;
    const vB = calculateVolumeSignal(multiFileEvidence).score;

    expect(vB).toBeGreaterThan(vA!);
  });
});

// ── Test 0.5: Only removed files should not count as evidence ────────

describe("0.5 — Only removed files should not count as evidence", () => {
  it("should treat removed-only files as 'No evidence'", () => {
    const bundle: EvidenceBundle = {
      schemaVersion: 2,
      target: { login: "testuser", id: 123, mode: "public" },
      fetchedAt: "2024-03-01T00:00:00Z",
      coverage: {
        reposDiscovered: 1,
        reposAnalyzed: 1,
        commitsListed: 3,
        commitsDetailed: 3,
        truncated: false,
        notes: [],
      },
      repos: [
        {
          fullName: "testuser/legacy-cleaner",
          isPrivate: false,
          isFork: false,
          stack: ["TypeScript"],
          commitDates: [
            "2024-01-15T00:00:00Z",
            "2024-02-15T00:00:00Z",
            "2024-03-15T00:00:00Z",
          ],
          commits: [
            {
              sha: "c1",
              date: "2024-01-15T00:00:00Z",
              files: [
                { path: "src/old.ts", status: "removed", additions: 0, deletions: 50, skills: ["TypeScript"] },
              ],
            },
            {
              sha: "c2",
              date: "2024-02-15T00:00:00Z",
              files: [
                { path: "src/legacy.ts", status: "removed", additions: 0, deletions: 100, skills: ["TypeScript"] },
              ],
            },
            {
              sha: "c3",
              date: "2024-03-15T00:00:00Z",
              files: [
                { path: "src/deprecated.ts", status: "removed", additions: 0, deletions: 30, skills: ["TypeScript"] },
              ],
            },
          ],
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

    const profile = evaluateEvidenceBundle(bundle);
    const rating = profile.skills.find(
      (s) => s.skill.toLowerCase() === "typescript"
    );

    // Only removed files must result in "No evidence", never Level 1 or 2
    expect(rating?.level).toBe("No evidence");
  });
});

// ── Test 0.13: Line `++count;` should not be stripped by +++ filter ──

describe("0.13 — Added line ++count; must be kept", () => {
  it("should keep ++count; in authored added lines (appears as +++count; in patch)", () => {
    // In a unified diff, an added line `++count;` appears as `+++count;`
    // GitHub's patch has no file headers (---/+++), so +++count; is real code.
    const patch = [
      "@@ -1,3 +1,4 @@",
      " let x = 0;",
      "+let y = 1;",
      "+++count;", // added code line: ++count;
      " return x;",
    ].join("\n");

    const addedLines = extractAuthoredLines(patch, 100);

    // After fix, `++count;` is preserved in authored added lines
    expect(addedLines).toContain("++count;");
  });
});
