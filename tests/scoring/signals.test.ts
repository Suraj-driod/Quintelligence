/**
 * Signal Extraction Tests — Phase 2 updated
 * Updated to use FileEvidence.skills[] instead of .skill
 * and to handle null signal returns.
 */
import { describe, it, expect } from "vitest";
import {
  computeRawVolume,
  normalizeVolume,
  calculateVolumeSignal,
} from "../../src/lib/skill-engine/scoring/signals/volume";
import {
  extractLibrariesFromLine,
  getObservedLibraries,
} from "../../src/lib/skill-engine/scoring/signals/breadth";
import { calculateDepthSignal } from "../../src/lib/skill-engine/scoring/signals/depth";
import { calculateSustainedSignal } from "../../src/lib/skill-engine/scoring/signals/sustained";
import {
  isTestFile,
  calculateQualitySignal,
} from "../../src/lib/skill-engine/scoring/signals/quality";
import type { FileEvidence } from "../../src/lib/skill-engine/types";

describe("Signal Extraction Engine", () => {
  describe("Signal V: Volume", () => {
    it("returns null score for empty files", () => {
      const res = calculateVolumeSignal([]);
      expect(res.score).toBeNull();
      expect(res.totalAdditions).toBe(0);
      expect(res.totalDeletions).toBe(0);
    });

    it("computes logarithmic sum and normalizes between (0, 1]", () => {
      const files: FileEvidence[] = [
        { path: "src/a.ts", status: "added", additions: 100, deletions: 10, skills: ["TypeScript"] },
        { path: "src/b.ts", status: "modified", additions: 250, deletions: 50, skills: ["TypeScript"] },
      ];
      const res = calculateVolumeSignal(files);
      expect(res.totalAdditions).toBe(350);
      expect(res.totalDeletions).toBe(60);
      expect(res.rawLogSum).toBeGreaterThan(0);
      expect(res.score).not.toBeNull();
      expect(res.score!).toBeGreaterThan(0);
      expect(res.score!).toBeLessThanOrEqual(1.0);
    });
  });

  describe("Library extraction (display-only, breadth signal removed)", () => {
    it("extracts distinct non-stdlib imports across ecosystems", () => {
      expect(extractLibrariesFromLine("import { useState } from 'react';")).toEqual(["react"]);
      expect(extractLibrariesFromLine("import axios from 'axios';")).toEqual(["axios"]);
      expect(extractLibrariesFromLine("const express = require('express');")).toEqual(["express"]);
      expect(extractLibrariesFromLine("import fs from 'fs';")).toEqual([]); // stdlib filtered
      expect(extractLibrariesFromLine("import tensorflow as tf")).toEqual(["tensorflow"]);
      expect(extractLibrariesFromLine("import os, sys")).toEqual([]); // stdlib filtered
      expect(extractLibrariesFromLine("import org.springframework.boot.SpringApplication;")).toEqual([
        "org.springframework",
      ]);
      expect(extractLibrariesFromLine("use serde::Serialize;")).toEqual(["serde"]);
    });

    it("getObservedLibraries aggregates libraries from file authored lines", () => {
      const files: FileEvidence[] = [
        {
          path: "src/api.ts",
          status: "added",
          additions: 20,
          deletions: 0,
          skills: ["TypeScript"],
          authoredAddedLines: [
            "import axios from 'axios';",
            "import { z } from 'zod';",
            "import lodash from 'lodash';",
          ],
        },
      ];
      const libs = getObservedLibraries(files);
      expect(libs).toContain("axios");
      expect(libs).toContain("zod");
      expect(libs).toContain("lodash");
    });
  });

  describe("Signal D: Depth", () => {
    it("returns null when authored lines are below minimum threshold", () => {
      const files: FileEvidence[] = [
        {
          path: "main.py",
          status: "added",
          additions: 4,
          deletions: 0,
          skills: ["Python"],
          authoredAddedLines: [
            "def calculate(a, b):",
            "    if a > b:",
            "        return a",
            "    return b",
          ],
        },
      ];
      // Only 4 lines — below DEPTH_MIN_LINES (30)
      const res = calculateDepthSignal(files, "Python");
      expect(res.score).toBeNull();
    });

    it("scores advanced constructs (async, generics, decorators) with high depth", () => {
      // Need >= 30 non-comment authored lines to pass DEPTH_MIN_LINES
      const advancedLines = [
        "export async function fetchItems<T>(url: string): Promise<T[]> {",
        "  try {",
        "    const res = await fetch(url);",
        "    const data = await res.json();",
        "    return data.map((item: any) => item.val);",
        "  } catch (err) {",
        "    throw new Error('Failed');",
        "  }",
        "}",
        "@Injectable()",
        "export class ItemService implements IService {}",
        "async function processData<T>(items: T[]): Promise<void> {",
        "  const results = await Promise.all(items.map(async (i) => fetch(i as any)));",
        "  return results.reduce((acc, r) => acc, undefined as any);",
        "}",
        "@Component({ selector: 'app' })",
        "export class AppComponent {}",
        "const x: Record<string, number> = {};",
        "async function a(): Promise<void> {}",
        "async function b(): Promise<void> {}",
        "async function c(): Promise<void> {}",
        "async function d(): Promise<void> {}",
        "async function e(): Promise<void> {}",
        "async function f(): Promise<void> {}",
        "async function g(): Promise<void> {}",
        "async function h(): Promise<void> {}",
        "try { } catch (e) { throw new Error('x'); }",
        "try { } catch (e) { throw new Error('y'); }",
        "const mapped = items.filter(x => x).map(x => x);",
        "const filtered = items.reduce((a, b) => a + b, 0);",
      ];
      const files: FileEvidence[] = [
        {
          path: "service.ts",
          status: "added",
          additions: 30,
          deletions: 0,
          skills: ["TypeScript"],
          authoredAddedLines: advancedLines,
        },
      ];
      const res = calculateDepthSignal(files, "TypeScript");
      expect(res.score).not.toBeNull();
      expect(res.score!).toBeGreaterThanOrEqual(0.5);
      expect(res.detectedFeatures).toContain("asynchronous_concurrency");
      expect(res.detectedFeatures).toContain("generics_typing");
      expect(res.detectedFeatures).toContain("error_handling");
      expect(res.detectedFeatures).toContain("decorators_annotations");
    });

    it("returns null for skill with no language profile (e.g. COBOL)", () => {
      const files: FileEvidence[] = [
        {
          path: "prog.cbl",
          status: "added",
          additions: 100,
          deletions: 0,
          skills: ["COBOL"],
          authoredAddedLines: Array(35).fill("PERFORM PROCEDURE."),
        },
      ];
      const res = calculateDepthSignal(files, "COBOL");
      expect(res.score).toBeNull();
    });
  });

  describe("Signal T: Sustained Activity", () => {
    it("computes sustained score across 12-month and 36-month windows", () => {
      const now = new Date("2025-06-01T00:00:00Z");
      const makeDate = (monthsAgo: number) => {
        const d = new Date(now);
        d.setUTCMonth(d.getUTCMonth() - monthsAgo);
        return d.toISOString();
      };

      // Commits spanning 12 distinct months
      const dates = Array.from({ length: 12 }, (_, i) => makeDate(i));

      const res = calculateSustainedSignal(dates, now);
      expect(res.activeMonths12).toBe(12);
      expect(res.activeMonths36).toBe(12);
      // 0.5 * (12/12) + 0.5 * (12/36) = 0.5 + 0.1667 = ~0.6667
      expect(res.score).toBeCloseTo(0.6667, 2);
    });

    it("returns null for empty dates", () => {
      expect(calculateSustainedSignal([]).score).toBeNull();
    });

    it("returns null for invalid dates only", () => {
      const res = calculateSustainedSignal(["invalid-date"]);
      expect(res.score).toBeNull();
    });
  });

  describe("Signal Q: Quality & Testing", () => {
    it("recognizes test files properly", () => {
      expect(isTestFile("src/app.test.ts")).toBe(true);
      expect(isTestFile("src/components/Button.spec.tsx")).toBe(true);
      expect(isTestFile("tests/unit/test_api.py")).toBe(true);
      expect(isTestFile("src/__tests__/index.js")).toBe(true);
      expect(isTestFile("src/main/AppTest.java")).toBe(true);
      expect(isTestFile("src/app.ts")).toBe(false);
      expect(isTestFile("main.py")).toBe(false);
    });

    it("returns null for tool skills (Docker, CI/CD, Kubernetes, Terraform)", () => {
      const files: FileEvidence[] = [
        { path: "Dockerfile", status: "added", additions: 20, deletions: 0, skills: ["Docker"] },
      ];
      expect(calculateQualitySignal(files, "Docker").score).toBeNull();
      expect(calculateQualitySignal(files, "CI/CD").score).toBeNull();
    });

    it("returns null when fewer than 3 distinct source files", () => {
      const files: FileEvidence[] = [
        { path: "src/service.ts", status: "added", additions: 50, deletions: 10, skills: ["TypeScript"] },
        { path: "src/service.test.ts", status: "added", additions: 40, deletions: 5, skills: ["TypeScript"] },
      ];
      // 1 source file < QUALITY_MIN_SOURCE_FILES (3) → null
      const res = calculateQualitySignal(files, "TypeScript");
      expect(res.score).toBeNull();
    });

    it("computes test ratio for sufficient source files", () => {
      const files: FileEvidence[] = [
        { path: "src/a.ts", status: "added", additions: 50, deletions: 10, skills: ["TypeScript"] },
        { path: "src/b.ts", status: "added", additions: 50, deletions: 10, skills: ["TypeScript"] },
        { path: "src/c.ts", status: "added", additions: 50, deletions: 10, skills: ["TypeScript"] },
        { path: "src/a.test.ts", status: "added", additions: 40, deletions: 5, skills: ["TypeScript"] },
        { path: "src/b.test.ts", status: "added", additions: 40, deletions: 5, skills: ["TypeScript"] },
      ];
      const res = calculateQualitySignal(files, "TypeScript");
      // 2 test / 3 source = 0.667 ratio / 0.35 target = min(1, 1.9) = 1.0
      expect(res.score).not.toBeNull();
      expect(res.testFilesCount).toBe(2);
      expect(res.sourceFilesCount).toBe(3);
    });
  });
});
