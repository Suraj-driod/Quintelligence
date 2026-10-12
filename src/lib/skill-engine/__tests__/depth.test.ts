/**
 * Phase 0 Regression Tests — Tests 0.6, 0.7
 * Tests for depth signal: comment lines should not trigger features,
 * null D when evidence is insufficient.
 */
import { describe, it, expect } from "vitest";
import { calculateDepthSignal } from "../scoring/signals/depth";
import type { FileEvidence } from "../types";

// ── Test 0.6: Comments must not be detected as features ──────────────

describe("0.6 — Depth on comment/directive lines", () => {
  it("should detect NO features from '// This is Important'", () => {
    const files: FileEvidence[] = [
      {
        path: "src/app.ts",
        status: "modified",
        additions: 1,
        deletions: 0,
        skills: ["TypeScript"],
        authoredAddedLines: ["// This is Important"],
      },
    ];

    const result = calculateDepthSignal(files);
    // "// This is Important" is a comment — no constructs should be detected
    expect(result.detectedFeatures).toHaveLength(0);
  });

  it("should detect NO features from '// @ts-ignore'", () => {
    const files: FileEvidence[] = [
      {
        path: "src/app.ts",
        status: "modified",
        additions: 1,
        deletions: 0,
        skills: ["TypeScript"],
        authoredAddedLines: ["// @ts-ignore"],
      },
    ];

    const result = calculateDepthSignal(files);
    // @ts-ignore is a directive comment, NOT a decorator
    expect(result.detectedFeatures).toHaveLength(0);
  });

  it("should detect NO features from '# This is Fine'", () => {
    const files: FileEvidence[] = [
      {
        path: "src/app.py",
        status: "modified",
        additions: 1,
        deletions: 0,
        skills: ["Python"],
        authoredAddedLines: ["# This is Fine"],
      },
    ];

    const result = calculateDepthSignal(files);
    expect(result.detectedFeatures).toHaveLength(0);
  });
});

// ── Test 0.7: Depth when no authored lines or below min-lines ────────

describe("0.7 — Depth with no or insufficient authored lines", () => {
  it("should return D === null when no authored lines exist", () => {
    const files: FileEvidence[] = [
      {
        path: "src/app.ts",
        status: "modified",
        additions: 5,
        deletions: 0,
        skills: ["TypeScript"],
        // No authoredAddedLines
      },
    ];

    const result = calculateDepthSignal(files);
    // D should be null (unavailable), NOT 0.1
    expect(result.score).toBeNull();
  });

  it("should return D === null when fewer than DEPTH_MIN_LINES authored lines", () => {
    // Less than 30 non-comment authored lines
    const files: FileEvidence[] = [
      {
        path: "src/app.ts",
        status: "modified",
        additions: 10,
        deletions: 0,
        skills: ["TypeScript"],
        authoredAddedLines: Array.from({ length: 10 }, (_, i) => `const x${i} = ${i};`),
      },
    ];

    const result = calculateDepthSignal(files);
    // 10 lines < DEPTH_MIN_LINES (30) → D should be null
    expect(result.score).toBeNull();
  });
});
