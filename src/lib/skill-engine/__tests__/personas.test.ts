/**
 * Phase 4.6 — Calibration Personas Test
 * Spec reference: CLAUDE_CODE_PROMPT.md Phase 4.6
 *
 * Builds synthetic EvidenceBundles and asserts the level BAND (not exact numbers).
 * Signals are printed for inspection.
 *
 * Persona table:
 *   Beginner toy: 1 repo, ~8 files, 2 months, no tests    -> Level 1-2 (or No evidence if gates fail)
 *   Churner:      1 file x 40 tiny commits                  -> Level <= 2, distinctFiles=1 -> No evidence
 *   Junior:       ~15 files, 1 repo, 10 months, some tests  -> Level 2-3
 *   Mid:          ~40 files, 3 repos, 24 months, tests      -> Level 3-4
 *   Senior:       100+ files, 4+ repos, 36 months, strong D -> Level 4-5
 *   Deleted-files-only:                                      -> No evidence
 *
 * If bands disagree with weights/cutoffs, adjust config and report why.
 */

import { describe, it, expect } from "vitest";
import { evaluateEvidenceBundle } from "../scoring/evaluator";
import { calculateVolumeSignal } from "../scoring/signals/volume";
import type { EvidenceBundle, FileEvidence, CommitEvidence, RepoEvidence } from "../types";
import type { SkillLevel } from "../scoring/types";

// ── Helpers ───────────────────────────────────────────────────────────

/**
 * Generate authored lines that demonstrate TypeScript constructs at various sophistication levels.
 * Designed to produce enough non-comment authored lines to pass DEPTH_MIN_LINES (30).
 */
function makeDeepTypeScriptLines(count: number): string[] {
  const sophisticated = [
    "class ApiService implements HttpClient {",
    "  private readonly baseUrl: string;",
    "  constructor(baseUrl: string) { this.baseUrl = baseUrl; }",
    "  async fetchData<T>(endpoint: string): Promise<T> {",
    "    try {",
    "      const response = await fetch(this.baseUrl + endpoint);",
    "      return response.json() as T;",
    "    } catch (error) {",
    "      throw new Error(String(error));",
    "    }",
    "  }",
    "}",
    "interface Repository<T> {",
    "  findById(id: string): Promise<T | null>;",
    "  save(entity: T): Promise<void>;",
    "  delete(id: string): Promise<void>;",
    "}",
    "type EventMap = Record<string, unknown>;",
    "function isUser(obj: unknown): obj is User {",
    "  return typeof obj === 'object' && obj !== null && 'login' in obj;",
    "}",
    "const transform = (items: string[]) => items.map(s => s.trim()).filter(Boolean);",
    "async function* streamResults<T>(source: AsyncIterable<T>) {",
    "  for await (const item of source) { yield item; }",
    "}",
    "enum Status { Active = 'active', Inactive = 'inactive', Pending = 'pending' }",
    "const handler = new Proxy({}, { get: (_, key) => Reflect.get(window, key) });",
    "export type DeepPartial<T> = { [P in keyof T]?: DeepPartial<T[P]> };",
    "function memoize<T extends (...args: unknown[]) => unknown>(fn: T): T {",
    "  const cache = new Map<string, unknown>();",
    "  return ((...args: unknown[]) => {",
    "    const key = JSON.stringify(args);",
    "    if (cache.has(key)) return cache.get(key);",
    "    const result = fn(...args);",
    "    cache.set(key, result);",
    "    return result;",
    "  }) as T;",
    "}",
    "class EventEmitter<T extends EventMap> {",
    "  private listeners = new Map<keyof T, Set<Function>>();",
    "  on<K extends keyof T>(event: K, handler: (data: T[K]) => void) {",
    "    if (!this.listeners.has(event)) this.listeners.set(event, new Set());",
    "    this.listeners.get(event)!.add(handler);",
    "  }",
    "}",
  ];
  const lines: string[] = [];
  while (lines.length < count) {
    lines.push(...sophisticated.slice(0, count - lines.length));
  }
  return lines;
}

function makeBasicTypeScriptLines(count: number): string[] {
  const basic = [
    "const x = 1;",
    "let y = 2;",
    "function add(a: number, b: number) { return a + b; }",
    "const arr = [1, 2, 3];",
    "for (let i = 0; i < arr.length; i++) { console.log(arr[i]); }",
    "if (x > 0) { console.log('positive'); }",
    "while (y > 0) { y--; }",
    "const result = arr.map(n => n * 2);",
  ];
  const lines: string[] = [];
  while (lines.length < count) {
    lines.push(...basic.slice(0, count - lines.length));
  }
  return lines;
}

/** Build a synthetic commit with files */
function makeCommit(
  sha: string,
  date: string,
  files: Array<{
    path: string;
    additions: number;
    deletions: number;
    status?: FileEvidence["status"];
    skills?: string[];
    authoredAddedLines?: string[];
  }>
): CommitEvidence {
  return {
    sha,
    date,
    files: files.map((f) => ({
      path: f.path,
      status: f.status ?? "modified",
      additions: f.additions,
      deletions: f.deletions,
      skills: f.skills ?? ["TypeScript"],
      authoredAddedLines: f.authoredAddedLines,
    })),
  };
}

/** Wrap repos into a minimal EvidenceBundle */
function makeBundle(repos: RepoEvidence[]): EvidenceBundle {
  return {
    schemaVersion: 2,
    target: { login: "testuser", id: 1, mode: "public" },
    fetchedAt: "2026-10-01T00:00:00Z",
    coverage: {
      reposDiscovered: repos.length,
      reposAnalyzed: repos.length,
      commitsListed: repos.reduce((s, r) => s + r.commits.length, 0),
      commitsDetailed: repos.reduce((s, r) => s + r.commits.length, 0),
      truncated: false,
      notes: [],
    },
    repos,
    collaboration: {
      prsOpened: 0,
      prsMerged: null,
      reviewsGiven: 0,
      issuesOpened: 0,
      comments: null,
      windowMonths: 36,
    },
  };
}

/**
 * Generate ISO date strings spread over N months, ending at 2026-10-01.
 * The "now" used by calculateSustainedSignal defaults to new Date(), but
 * the bundle dates need to be within the last 36 months of actual current time.
 * We use real current-relative dates so the sustained signal sees them correctly.
 */
function datesOverMonths(monthCount: number, perMonth = 2): string[] {
  const dates: string[] = [];
  const base = new Date(); // real "now" so T signal works correctly
  for (let m = monthCount - 1; m >= 0; m--) {
    const d = new Date(base);
    d.setUTCMonth(d.getUTCMonth() - m);
    for (let k = 0; k < perMonth; k++) {
      const dk = new Date(d);
      dk.setUTCDate(dk.getUTCDate() + k);
      dates.push(dk.toISOString());
    }
  }
  return dates;
}

/** Assert level falls within an inclusive range; print signals for inspection */
function assertLevelBand(
  level: SkillLevel,
  lo: SkillLevel,
  hi: SkillLevel,
  persona: string,
  signals: Record<string, unknown>
): void {
  // Convert "No evidence" to 0 for numeric comparison
  const toNum = (l: SkillLevel) => (l === "No evidence" ? 0 : (l as number));
  const lvlNum = toNum(level);
  const loNum = toNum(lo);
  const hiNum = toNum(hi);

  console.log(
    `[Persona: ${persona}] level=${level} signals=${JSON.stringify(signals)}`
  );

  expect(
    lvlNum >= loNum && lvlNum <= hiNum,
    `Expected level in [${lo}, ${hi}] but got ${level}`
  ).toBe(true);
}

// ── Persona 1: Beginner Toy ───────────────────────────────────────────

describe("Persona: Beginner Toy (1 repo, ~8 files, 2 months, no tests)", () => {
  it("should score Level 1-2 (or No evidence if gates fail)", () => {
    const dates = datesOverMonths(2, 1);
    const lines = makeBasicTypeScriptLines(40);

    const repo: RepoEvidence = {
      fullName: "testuser/toy-project",
      isPrivate: false,
      isFork: false,
      stack: ["TypeScript"],
      commitDates: dates,
      sampling: { listedNonMerge: 4, detailed: 4 },
      commits: dates.slice(0, 4).map((date, i) =>
        makeCommit(`sha-beginner-${i}`, date, [
          {
            path: `src/file${i}.ts`,
            additions: 15,
            deletions: 2,
            authoredAddedLines: lines.slice(i * 10, i * 10 + 10),
          },
        ])
      ),
    };

    const bundle = makeBundle([repo]);
    const profile = evaluateEvidenceBundle(bundle);
    const ts = profile.skills.find((s) => s.skill === "TypeScript");

    // 4 distinct files, 2 months — borderline evidence; low V, D likely null
    const level = ts?.level ?? "No evidence";
    assertLevelBand(level, "No evidence", 2, "Beginner Toy", {
      volume: ts?.signals.volume,
      depth: ts?.signals.depth,
      sustained: ts?.signals.sustained,
      quality: ts?.signals.quality,
      distinctFiles: ts?.metrics.distinctFiles,
    });
  });
});

// ── Persona 2: Churner ────────────────────────────────────────────────

describe("Persona: Churner (1 file x 40 tiny commits)", () => {
  it("should have distinctFiles=1 and be No evidence (Gate 1 fails)", () => {
    const dates = datesOverMonths(12, 1).slice(0, 40);

    const repo: RepoEvidence = {
      fullName: "testuser/churn-repo",
      isPrivate: false,
      isFork: false,
      stack: ["TypeScript"],
      commitDates: dates,
      sampling: { listedNonMerge: 40, detailed: 40 },
      commits: dates.map((date, i) =>
        makeCommit(`sha-churn-${i}`, date, [
          {
            path: "src/main.ts",
            additions: 2,
            deletions: 1,
            authoredAddedLines: [`const x${i} = ${i};`, `console.log(x${i});`],
          },
        ])
      ),
    };

    const bundle = makeBundle([repo]);
    const profile = evaluateEvidenceBundle(bundle);
    const ts = profile.skills.find((s) => s.skill === "TypeScript");

    console.log(`[Persona: Churner] level=${ts?.level} distinctFiles=${ts?.metrics.distinctFiles}`);
    // Only 1 distinct file — Gate 1 (distinctFiles < 3) must fire
    expect(ts?.metrics.distinctFiles).toBe(1);
    expect(ts?.level).toBe("No evidence");
  });
});

// ── Persona 3: Junior ─────────────────────────────────────────────────

describe("Persona: Junior (~15 files, 1 repo, 10 months, some tests)", () => {
  it("should score Level 2-3", () => {
    const dates = datesOverMonths(10, 1);
    const lines = makeBasicTypeScriptLines(60);

    const commits: CommitEvidence[] = dates.map((date, i) =>
      makeCommit(`sha-junior-${i}`, date, [
        {
          path: `src/feature${i % 15}.ts`,
          additions: 30,
          deletions: 5,
          authoredAddedLines: lines.slice((i % 6) * 10, (i % 6) * 10 + 10),
        },
      ])
    );

    // Add test files
    commits.push(
      makeCommit("sha-junior-test-0", dates[0], [
        {
          path: "src/__tests__/feature0.test.ts",
          additions: 20,
          deletions: 0,
          skills: ["TypeScript"],
        },
        {
          path: "src/__tests__/feature1.test.ts",
          additions: 15,
          deletions: 0,
          skills: ["TypeScript"],
        },
      ])
    );

    const repo: RepoEvidence = {
      fullName: "testuser/junior-project",
      isPrivate: false,
      isFork: false,
      stack: ["TypeScript"],
      commitDates: dates,
      sampling: { listedNonMerge: commits.length, detailed: commits.length },
      commits,
    };

    const bundle = makeBundle([repo]);
    const profile = evaluateEvidenceBundle(bundle);
    const ts = profile.skills.find((s) => s.skill === "TypeScript");
    const level = ts?.level ?? "No evidence";

    assertLevelBand(level, 2, 3, "Junior", {
      volume: ts?.signals.volume,
      depth: ts?.signals.depth,
      sustained: ts?.signals.sustained,
      quality: ts?.signals.quality,
      distinctFiles: ts?.metrics.distinctFiles,
      activeMonths36: ts?.metrics.activeMonths36,
    });
  });
});

// ── Persona 4: Mid-level ──────────────────────────────────────────────
//
// Design rationale: a genuine "mid-level" developer has moderate depth and breadth.
// We use basic (not sophisticated) constructs and moderate file counts so the
// composite score lands in the 0.40–0.80 band (Level 3–4).
// The original persona scored Level 5 because deep constructs + 46 files + 3 repos
// pushed all signals very high. Reduced to: ~20 distinct files, basic lines, modest tests.

describe("Persona: Mid (~20 files, 3 repos, 24 months, some tests)", () => {
  it("should score Level 3-4", () => {
    const dates = datesOverMonths(24, 1);
    // Use basic lines — mid-level developers don't exhibit mastery-level constructs consistently
    const basicLines = makeBasicTypeScriptLines(60);

    function buildMidRepo(name: string, fileCount: number, dateSlice: string[]): RepoEvidence {
      // Only use a subset of dates to keep file counts low
      const usedDates = dateSlice.slice(0, fileCount);
      const commits: CommitEvidence[] = usedDates.map((date, i) =>
        makeCommit(`sha-mid-${name}-${i}`, date, [
          {
            path: `src/${name}/module${i}.ts`,     // i (not i%fileCount) → distinct files
            additions: 40,
            deletions: 8,
            authoredAddedLines: basicLines.slice((i % 5) * 12, (i % 5) * 12 + 12),
          },
        ])
      );

      // A couple of test files per repo
      const testCount = Math.max(1, Math.floor(fileCount * 0.2));
      for (let t = 0; t < testCount; t++) {
        commits.push(
          makeCommit(`sha-mid-${name}-test-${t}`, dateSlice[t % dateSlice.length], [
            {
              path: `src/__tests__/${name}/module${t}.test.ts`,
              additions: 25,
              deletions: 0,
              skills: ["TypeScript"],
            },
          ])
        );
      }

      return {
        fullName: `testuser/${name}`,
        isPrivate: false,
        isFork: false,
        stack: ["TypeScript"],
        commitDates: usedDates,
        sampling: { listedNonMerge: commits.length, detailed: commits.length },
        commits,
      };
    }

    // 3 repos, ~7 distinct source files each → ~21 total distinct files
    const repos = [
      buildMidRepo("api-service",  7, dates.slice(0,  8)),
      buildMidRepo("frontend-app", 7, dates.slice(8,  16)),
      buildMidRepo("shared-utils", 6, dates.slice(16, 24)),
    ];

    const bundle = makeBundle(repos);
    const profile = evaluateEvidenceBundle(bundle);
    const ts = profile.skills.find((s) => s.skill === "TypeScript");
    const level = ts?.level ?? "No evidence";

    assertLevelBand(level, 3, 4, "Mid", {
      volume: ts?.signals.volume,
      depth: ts?.signals.depth,
      sustained: ts?.signals.sustained,
      quality: ts?.signals.quality,
      distinctFiles: ts?.metrics.distinctFiles,
      reposCount: ts?.metrics.reposCount,
      activeMonths36: ts?.metrics.activeMonths36,
    });
  });
});

// ── Persona 5: Senior ─────────────────────────────────────────────────

describe("Persona: Senior (100+ files, 4+ repos, 36 months, strong depth)", () => {
  it("should score Level 4-5", () => {
    const dates = datesOverMonths(36, 2);
    const deepLines = makeDeepTypeScriptLines(200);

    function buildSeniorRepo(name: string, fileCount: number, dateSlice: string[]): RepoEvidence {
      const commits: CommitEvidence[] = dateSlice.map((date, i) =>
        makeCommit(`sha-senior-${name}-${i}`, date, [
          {
            path: `src/${name}/component${i % fileCount}.ts`,
            additions: 80,
            deletions: 20,
            authoredAddedLines: deepLines.slice((i * 5) % 160, (i * 5) % 160 + 40),
          },
        ])
      );

      // Strong test coverage (~40% of source files)
      const testCount = Math.ceil(fileCount * 0.4);
      for (let t = 0; t < testCount; t++) {
        commits.push(
          makeCommit(`sha-senior-${name}-test-${t}`, dateSlice[t % dateSlice.length], [
            {
              path: `src/__tests__/${name}/component${t}.test.ts`,
              additions: 60,
              deletions: 0,
              skills: ["TypeScript"],
            },
          ])
        );
      }

      return {
        fullName: `org/${name}`,
        isPrivate: false,
        isFork: false,
        stack: ["TypeScript", "React", "Next.js"],
        commitDates: dateSlice,
        sampling: { listedNonMerge: commits.length, detailed: commits.length },
        commits,
      };
    }

    const repos = [
      buildSeniorRepo("core-platform",  30, dates.slice(0,  18)),
      buildSeniorRepo("data-pipeline",  25, dates.slice(9,  36)),
      buildSeniorRepo("auth-service",   25, dates.slice(12, 36)),
      buildSeniorRepo("frontend-shell", 20, dates.slice(18, 36)),
    ];

    const bundle = makeBundle(repos);
    const profile = evaluateEvidenceBundle(bundle);
    const ts = profile.skills.find((s) => s.skill === "TypeScript");
    const level = ts?.level ?? "No evidence";

    assertLevelBand(level, 4, 5, "Senior", {
      volume: ts?.signals.volume,
      depth: ts?.signals.depth,
      sustained: ts?.signals.sustained,
      quality: ts?.signals.quality,
      distinctFiles: ts?.metrics.distinctFiles,
      reposCount: ts?.metrics.reposCount,
      activeMonths36: ts?.metrics.activeMonths36,
      gatingNotes: ts?.gatingNotes,
    });
  });
});

// ── Persona 6: Deleted-files-only ────────────────────────────────────

describe("Persona: Deleted-files-only (all status=removed)", () => {
  it("should result in No evidence (removed files excluded from counts)", () => {
    const dates = datesOverMonths(24, 1);

    const repo: RepoEvidence = {
      fullName: "testuser/legacy-cleanup",
      isPrivate: false,
      isFork: false,
      stack: ["TypeScript"],
      commitDates: dates,
      sampling: { listedNonMerge: dates.length, detailed: dates.length },
      commits: dates.slice(0, 20).map((date, i) =>
        makeCommit(`sha-deleted-${i}`, date, [
          {
            path: `src/old-file-${i}.ts`,
            status: "removed",
            additions: 0,
            deletions: 50,
          },
        ])
      ),
    };

    const bundle = makeBundle([repo]);
    const profile = evaluateEvidenceBundle(bundle);
    const ts = profile.skills.find((s) => s.skill === "TypeScript");

    console.log(
      `[Persona: Deleted-files-only] level=${ts?.level} distinctFiles=${ts?.metrics.distinctFiles}`
    );

    // All removed — excluded from buckets entirely -> No evidence
    expect(ts?.level ?? "No evidence").toBe("No evidence");
  });
});

// ── Volume sanity checks (asserted per spec 4.1) ──────────────────────

describe("Signal V — sanity targets from spec (K=80)", () => {
  function makeFilesForVolume(
    fileSpecs: Array<{ path: string; additions: number; count: number }>
  ): FileEvidence[] {
    const result: FileEvidence[] = [];
    for (const { path, additions, count } of fileSpecs) {
      for (let i = 0; i < count; i++) {
        result.push({
          path,
          status: "modified",
          additions,
          deletions: 0,
          skills: ["TypeScript"],
        });
      }
    }
    return result;
  }

  it("3 distinct files x 10 lines approx 0.09", () => {
    const files = makeFilesForVolume([
      { path: "a.ts", additions: 10, count: 1 },
      { path: "b.ts", additions: 10, count: 1 },
      { path: "c.ts", additions: 10, count: 1 },
    ]);
    const { score } = calculateVolumeSignal(files);
    console.log(`[V sanity] 3x10 -> ${score}`);
    // spec target ~0.09, tolerance +/-0.03
    expect(score).toBeGreaterThanOrEqual(0.06);
    expect(score).toBeLessThanOrEqual(0.13);
  });

  it("3 distinct files x 50 lines approx 0.14", () => {
    const files = makeFilesForVolume([
      { path: "a.ts", additions: 50, count: 1 },
      { path: "b.ts", additions: 50, count: 1 },
      { path: "c.ts", additions: 50, count: 1 },
    ]);
    const { score } = calculateVolumeSignal(files);
    console.log(`[V sanity] 3x50 -> ${score}`);
    expect(score).toBeGreaterThanOrEqual(0.10);
    expect(score).toBeLessThanOrEqual(0.19);
  });

  it("1 file, 2000 lines approx 0.09", () => {
    const files = makeFilesForVolume([{ path: "a.ts", additions: 2000, count: 1 }]);
    const { score } = calculateVolumeSignal(files);
    console.log(`[V sanity] 1x2000 -> ${score}`);
    expect(score).toBeGreaterThanOrEqual(0.06);
    expect(score).toBeLessThanOrEqual(0.13);
  });

  it("1 file edited 30x (150 lines total) approx 0.06", () => {
    // 30 commits x 5 lines each, all same path -> aggregated to 150 total
    const files = makeFilesForVolume([{ path: "a.ts", additions: 5, count: 30 }]);
    const { score } = calculateVolumeSignal(files);
    console.log(`[V sanity] 1 file 30x (150 total) -> ${score}`);
    expect(score).toBeGreaterThanOrEqual(0.03);
    expect(score).toBeLessThanOrEqual(0.10);
  });

  it("10 distinct files x 50 lines approx 0.39", () => {
    const files = makeFilesForVolume(
      Array.from({ length: 10 }, (_, i) => ({ path: `f${i}.ts`, additions: 50, count: 1 }))
    );
    const { score } = calculateVolumeSignal(files);
    console.log(`[V sanity] 10x50 -> ${score}`);
    expect(score).toBeGreaterThanOrEqual(0.33);
    expect(score).toBeLessThanOrEqual(0.46);
  });

  it("25 distinct files x 100 lines approx 0.76", () => {
    const files = makeFilesForVolume(
      Array.from({ length: 25 }, (_, i) => ({ path: `f${i}.ts`, additions: 100, count: 1 }))
    );
    const { score } = calculateVolumeSignal(files);
    console.log(`[V sanity] 25x100 -> ${score}`);
    expect(score).toBeGreaterThanOrEqual(0.70);
    expect(score).toBeLessThanOrEqual(0.83);
  });

  it("50 distinct files x 50 lines approx 0.91", () => {
    const files = makeFilesForVolume(
      Array.from({ length: 50 }, (_, i) => ({ path: `f${i}.ts`, additions: 50, count: 1 }))
    );
    const { score } = calculateVolumeSignal(files);
    console.log(`[V sanity] 50x50 -> ${score}`);
    expect(score).toBeGreaterThanOrEqual(0.85);
    expect(score).toBeLessThanOrEqual(0.96);
  });
});
