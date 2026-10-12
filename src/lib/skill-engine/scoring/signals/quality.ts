/**
 * signals/quality.ts — Signal Q (Quality & Testing)
 * Spec reference: CLAUDE_CODE_PROMPT.md Phase 4.4
 *
 * Q = min(1, testRatio / QUALITY_TEST_RATIO_TARGET)
 * where testRatio = distinctTestFiles / distinctNonTestFiles for this skill
 *
 * Returns null when:
 *   - Fewer than QUALITY_MIN_SOURCE_FILES distinct non-test files (insufficient evidence)
 *   - Tool skills: Docker, CI/CD, Kubernetes, Terraform (no test files concept)
 *
 * NOTE: The "survival proxy" (additions vs deletions) has been removed.
 * It penalised refactoring and was not a valid quality signal.
 * Real survival requires blame data and is deferred to a future phase.
 */

import { SCORING_CONFIG } from "../config";
import type { FileEvidence } from "../../types";

/** Tool skills that cannot have test file coverage — always return null for Q */
const TOOL_SKILLS_NO_Q = new Set(["Docker", "CI/CD", "Kubernetes", "Terraform"]);

/**
 * Check if a file path is a test file.
 * Spec reference: CLAUDE_CODE_PROMPT.md §4.4
 * Rules:
 *   - Path segments: tests?/, __tests__/, spec(s)/, src/test/
 *   - Filenames: *.test.[jt]sx?, *.spec.[jt]sx?, test_*.py, *_test.py, *_test.go,
 *     *Test.java, *Tests.java, *IT.java, *Test.kt, *Tests.cs
 *   - NO bare "test_" substring (avoids false-matching latest_results.py, contest_utils.py)
 */
export function isTestFile(path: string): boolean {
  const normalized = path.replace(/\\/g, "/");

  // 1. Path segments: tests/, test/, __tests__/, spec/, specs/, src/test/
  if (/(?:^|\/)(?:tests?|__tests__|specs?|src\/test)(?:\/|$)/i.test(normalized)) {
    return true;
  }

  // Extract filename
  const filename = normalized.split("/").pop() ?? normalized;

  // 2. Filename patterns:
  // - *.test.[jt]sx?, *.spec.[jt]sx?
  if (/\.(?:test|spec)\.[jt]sx?$/i.test(filename)) return true;
  // - *_spec.*
  if (/_spec\.[a-z0-9]+$/i.test(filename)) return true;

  // - Python: test_*.py or *_test.py (MUST match at filename level, not substring)
  if (/^test_.*\.py$/i.test(filename) || /.*_test\.py$/i.test(filename)) return true;

  // - Go: *_test.go
  if (/.*_test\.go$/i.test(filename)) return true;

  // - Java / Kotlin / C#: *Test.java, *Tests.java, *IT.java, *Test.kt, *Tests.cs
  if (/(?:Tests?|IT)\.java$/i.test(filename)) return true;
  if (/Test\.kt$/i.test(filename)) return true;
  if (/Tests\.cs$/i.test(filename)) return true;

  return false;
}

/**
 * Calculate Signal Q (Quality & Testing) for a set of files belonging to a skill.
 *
 * @param files   Non-removed files for this skill
 * @param skill   Skill name (used to check if Q applies)
 */
export function calculateQualitySignal(
  files: FileEvidence[],
  skill?: string
): {
  score: number | null;
  testFilesCount: number;
  sourceFilesCount: number;
  testRatio: number;
} {
  const { QUALITY_TEST_RATIO_TARGET, QUALITY_MIN_SOURCE_FILES } =
    SCORING_CONFIG.NORMALIZATION;

  // Tool skills have no test-file concept
  if (skill && TOOL_SKILLS_NO_Q.has(skill)) {
    return { score: null, testFilesCount: 0, sourceFilesCount: 0, testRatio: 0 };
  }

  if (files.length === 0) {
    return { score: null, testFilesCount: 0, sourceFilesCount: 0, testRatio: 0 };
  }

  // Count distinct test vs source files
  const testPaths = new Set<string>();
  const sourcePaths = new Set<string>();

  for (const file of files) {
    if (isTestFile(file.path)) {
      testPaths.add(file.path);
    } else {
      sourcePaths.add(file.path);
    }
  }

  const testCount = testPaths.size;
  const sourceCount = sourcePaths.size;

  // Not enough source files to compute a meaningful ratio
  if (sourceCount < QUALITY_MIN_SOURCE_FILES) {
    return {
      score: null,
      testFilesCount: testCount,
      sourceFilesCount: sourceCount,
      testRatio: 0,
    };
  }

  const rawTestRatio = testCount / sourceCount;
  const score = Math.min(1.0, rawTestRatio / QUALITY_TEST_RATIO_TARGET);

  return {
    score: Number(score.toFixed(4)),
    testFilesCount: testCount,
    sourceFilesCount: sourceCount,
    testRatio: Number(rawTestRatio.toFixed(2)),
  };
}
