/**
 * Evaluator Tests — Phase 2 updated
 * Uses FileEvidence.skills[] and EvidenceBundle.schemaVersion:2
 */
import { describe, it, expect } from "vitest";
import {
  evaluateEvidenceBundle,
  calculateEvidenceStrength,
  mapScoreToPreliminaryLevel,
} from "../../src/lib/skill-engine/scoring/evaluator";
import type { EvidenceBundle } from "../../src/lib/skill-engine/types";

describe("Scoring Evaluator & Gating Engine", () => {
  describe("Evidence Strength Formula", () => {
    it("computes Low, Medium, and High ratings accurately", () => {
      // Very low coverage: 2 files, 1 repo, 1 month → Low
      expect(calculateEvidenceStrength(2, 1, 1).strength).toBe("Low");

      // Moderate coverage: 15 files, 2 repos, 6 months → Medium
      expect(calculateEvidenceStrength(15, 2, 6).strength).toBe("Medium");

      // High coverage: 50 files, 3 repos, 12 months → High
      expect(calculateEvidenceStrength(50, 3, 12).strength).toBe("High");
    });
  });

  describe("Score to Level Mapping", () => {
    it("maps scores according to Phase 2 cutoffs (<0.20→1, <0.40→2, <0.60→3, <0.80→4, ≥0.80→5)", () => {
      expect(mapScoreToPreliminaryLevel(0.10)).toBe(1);
      expect(mapScoreToPreliminaryLevel(0.30)).toBe(2);
      expect(mapScoreToPreliminaryLevel(0.50)).toBe(3);
      expect(mapScoreToPreliminaryLevel(0.70)).toBe(4);
      expect(mapScoreToPreliminaryLevel(0.85)).toBe(5);
    });
  });

  describe("Hard Gating Rules", () => {
    it("Gate 1: Outputs 'No evidence' when file count is under 3 (never Level 1)", () => {
      const bundle: EvidenceBundle = {
        schemaVersion: 2,
        target: { login: "alice", id: 101, mode: "public" },
        fetchedAt: new Date().toISOString(),
        coverage: {
          reposDiscovered: 1,
          reposAnalyzed: 1,
          commitsListed: 1,
          commitsDetailed: 1,
          truncated: false,
          notes: [],
        },
        repos: [
          {
            fullName: "alice/repo1",
            isPrivate: false,
            isFork: false,
            stack: [],
            commitDates: ["2024-01-01T00:00:00Z"],
            commits: [
              {
                sha: "sha1",
                date: "2024-01-01T00:00:00Z",
                files: [
                  // Only 2 files — Gate 1 should fire
                  { path: "src/a.ts", status: "added", additions: 50, deletions: 0, skills: ["TypeScript"] },
                  { path: "src/b.ts", status: "added", additions: 50, deletions: 0, skills: ["TypeScript"] },
                ],
              },
            ],
          },
        ],
        collaboration: { prsOpened: 0, prsMerged: null, reviewsGiven: 0, issuesOpened: 0, comments: null, windowMonths: 36 },
      };

      const profile = evaluateEvidenceBundle(bundle);
      const tsRating = profile.skills.find((s) => s.skill === "TypeScript");
      expect(tsRating).toBeDefined();
      expect(tsRating!.level).toBe("No evidence");
      expect(tsRating!.gatingNotes[0]).toContain("Insufficient evidence");
    });

    it("Gate 2: Clamps Level >= 3 down to Level 2 if active months < 6 AND (repos < 2 AND distinctFiles < 15)", () => {
      // User with lots of volume in only 1 repository with < 15 distinct files and 2 months
      const bundle: EvidenceBundle = {
        schemaVersion: 2,
        target: { login: "bob", id: 102, mode: "public" },
        fetchedAt: new Date().toISOString(),
        coverage: {
          reposDiscovered: 1,
          reposAnalyzed: 1,
          commitsListed: 2,
          commitsDetailed: 2,
          truncated: false,
          notes: [],
        },
        repos: [
          {
            fullName: "bob/solo-repo",
            isPrivate: false,
            isFork: false,
            stack: ["React"],
            commitDates: ["2024-01-01T00:00:00Z", "2024-02-01T00:00:00Z"],
            commits: [
              {
                sha: "c1",
                date: "2024-01-01T00:00:00Z",
                files: [
                  {
                    path: "src/main.ts",
                    status: "added",
                    additions: 2000,
                    deletions: 10,
                    skills: ["TypeScript"],
                    authoredAddedLines: [
                      "export interface User<T> { id: string; data: T; }",
                      "export interface Admin<T> { id: string; role: T; }",
                      "export async function fetchUser<T>(id: string): Promise<User<T>> {",
                      "  try {",
                      "    const res = await Promise.resolve({ id, data: {} as T });",
                      "    return res;",
                      "  } catch (err) {",
                      "    throw new Error('Failed');",
                      "  }",
                      "}",
                      "export async function processUsers<T>(users: User<T>[]): Promise<T[]> {",
                      "  try {",
                      "    return users.map(u => u.data);",
                      "  } catch (err) {",
                      "    throw new Error('Process error');",
                      "  }",
                      "}",
                      "export class Service<T> {",
                      "  private items: T[] = [];",
                      "  public async add(item: T): Promise<void> {",
                      "    this.items.push(item);",
                      "  }",
                      "}",
                      "export class Manager<T> {",
                      "  private list: T[] = [];",
                      "  public async save(x: T): Promise<void> {",
                      "    this.list.push(x);",
                      "  }",
                      "}",
                      "const list1 = [1, 2, 3].map(x => x * 2);",
                      "const list2 = [4, 5, 6].filter(x => x > 4);",
                      "const val = list1.reduce((a, b) => a + b, 0);",
                    ],
                  },
                  {
                    path: "src/app.ts",
                    status: "added",
                    additions: 1500,
                    deletions: 0,
                    skills: ["TypeScript"],
                  },
                  {
                    path: "tests/main.test.ts",
                    status: "added",
                    additions: 50,
                    deletions: 0,
                    skills: ["TypeScript"],
                  },
                ],
              },
              {
                sha: "c2",
                date: "2024-02-01T00:00:00Z",
                files: [
                  {
                    path: "src/utils.ts",
                    status: "added",
                    additions: 1000,
                    deletions: 0,
                    skills: ["TypeScript"],
                  },
                ],
              },
            ],
          },
        ],
        collaboration: { prsOpened: 0, prsMerged: null, reviewsGiven: 0, issuesOpened: 0, comments: null, windowMonths: 36 },
      };

      const profile = evaluateEvidenceBundle(bundle);
      const tsRating = profile.skills.find((s) => s.skill === "TypeScript");
      expect(tsRating).toBeDefined();
      // Should be clamped to Level 2: reposCount is 1 AND distinctFiles is 3 (both < threshold)
      // and active months is 2 (< 6)
      expect(tsRating!.level).toBe(2);
      expect(tsRating!.gatingNotes[0]).toContain("Capped at Level 2");
    });

    it("Gate 3: Clamps Level 5 down to Level 4 if Depth score is null or below 0.70", () => {
      // Massive volume, 12+ months, 3+ repos, but shallow/no authored code (no depth)
      const bundle: EvidenceBundle = {
        schemaVersion: 2,
        target: { login: "charlie", id: 103, mode: "public" },
        fetchedAt: new Date().toISOString(),
        coverage: {
          reposDiscovered: 3,
          reposAnalyzed: 3,
          commitsListed: 12,
          commitsDetailed: 12,
          truncated: false,
          notes: [],
        },
        repos: [
          {
            fullName: "charlie/repo1",
            isPrivate: false,
            isFork: false,
            stack: ["React"],
            commitDates: ["2024-01-01T00:00:00Z"],
            commits: [
              {
                sha: "r1c1",
                date: "2024-01-01T00:00:00Z",
                files: [
                  {
                    path: "src/a.ts",
                    status: "added",
                    additions: 10000,
                    deletions: 10,
                    skills: ["TypeScript"],
                    // No authored lines → D = null
                  },
                ],
              },
            ],
          },
          {
            fullName: "charlie/repo2",
            isPrivate: false,
            isFork: false,
            stack: [],
            commitDates: ["2024-06-01T00:00:00Z"],
            commits: [
              {
                sha: "r2c1",
                date: "2024-06-01T00:00:00Z",
                files: [
                  {
                    path: "src/b.ts",
                    status: "added",
                    additions: 10000,
                    deletions: 0,
                    skills: ["TypeScript"],
                  },
                ],
              },
            ],
          },
          {
            fullName: "charlie/repo3",
            isPrivate: false,
            isFork: false,
            stack: [],
            commitDates: ["2024-11-01T00:00:00Z"],
            commits: [
              {
                sha: "r3c1",
                date: "2024-11-01T00:00:00Z",
                files: [
                  {
                    path: "src/c.ts",
                    status: "added",
                    additions: 10000,
                    deletions: 0,
                    skills: ["TypeScript"],
                  },
                ],
              },
            ],
          },
        ],
        collaboration: { prsOpened: 5, prsMerged: null, reviewsGiven: 5, issuesOpened: 0, comments: null, windowMonths: 36 },
      };

      const profile = evaluateEvidenceBundle(bundle);
      const tsRating = profile.skills.find((s) => s.skill === "TypeScript");
      expect(tsRating).toBeDefined();
      // Depth is null (no authored lines) → capped at Level 4 by Gate 3
      expect(tsRating!.signals.depth).toBeNull();
      expect(tsRating!.level).toBeLessThanOrEqual(4);
    });
  });
});
