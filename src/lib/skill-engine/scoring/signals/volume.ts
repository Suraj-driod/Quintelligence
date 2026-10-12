/**
 * signals/volume.ts — Signal V (Volume)
 * Spec reference: CLAUDE_CODE_PROMPT.md Phase 4.1
 *
 * Aggregate before scoring: group per distinct file (repo, path),
 * summing additions+deletions across the sampled commits (non-removed).
 *
 *   for each distinct file f in skill s:  c_f = Σ(additions+deletions) over sampled commits
 *   raw = Σ ln(1 + c_f)
 *   V   = 1 − exp(−raw / K)           K = VOLUME_SATURATION_K (config, default 80)
 *
 * Returns null if no distinct files (null ≠ 0; excluded from composite).
 *
 * Sanity targets (asserted in persona tests):
 *   3 files × 10 lines  ≈ 0.09
 *   3 × 50              ≈ 0.14
 *   1 file, 2000 lines  ≈ 0.09
 *   1 file 30× (150 total) ≈ 0.06
 *   10 × 50             ≈ 0.39
 *   25 × 100            ≈ 0.76
 *   50 × 50             ≈ 0.91
 */

import { SCORING_CONFIG } from "../config";
import type { FileEvidence } from "../../types";

/**
 * Compute the raw volume log-sum for a set of files belonging to a skill.
 * Aggregates by distinct file path: sums additions+deletions per distinct file,
 * then computes Σ ln(1 + c_f).
 *
 * Removed files (status === "removed") must already have been excluded by the caller.
 */
export function computeRawVolume(files: FileEvidence[]): {
  rawLogSum: number;
  distinctFiles: number;
  fileChangeEvents: number;
} {
  // Group by distinct file path, summing changes per file
  const fileChanges = new Map<string, number>();
  let fileChangeEvents = 0;

  for (const file of files) {
    const changes = (file.additions ?? 0) + (file.deletions ?? 0);
    const existing = fileChanges.get(file.path) ?? 0;
    fileChanges.set(file.path, existing + changes);
    fileChangeEvents++;
  }

  let logSum = 0;
  for (const totalChanges of fileChanges.values()) {
    logSum += Math.log(1 + totalChanges);
  }

  return {
    rawLogSum: logSum,
    distinctFiles: fileChanges.size,
    fileChangeEvents,
  };
}

/**
 * Normalize the raw volume log-sum into [0, 1] using V = 1 − exp(−raw / K).
 * Returns null if rawLogSum is 0 (no files → unavailable, not 0).
 */
export function normalizeVolume(rawLogSum: number): number | null {
  if (rawLogSum <= 0) return null;

  const K = SCORING_CONFIG.NORMALIZATION.VOLUME_SATURATION_K;
  const score = 1 - Math.exp(-rawLogSum / K);

  return Math.min(1, Math.max(0, Number(score.toFixed(4))));
}

/**
 * Calculate Signal V for a skill given its qualifying files.
 * Returns null score if there are no distinct files.
 */
export function calculateVolumeSignal(files: FileEvidence[]): {
  score: number | null;
  rawLogSum: number;
  totalAdditions: number;
  totalDeletions: number;
  distinctFiles: number;
  fileChangeEvents: number;
} {
  const { rawLogSum, distinctFiles, fileChangeEvents } = computeRawVolume(files);
  const score = normalizeVolume(rawLogSum);

  let totalAdditions = 0;
  let totalDeletions = 0;
  for (const file of files) {
    totalAdditions += file.additions ?? 0;
    totalDeletions += file.deletions ?? 0;
  }

  return {
    score,
    rawLogSum: Number(rawLogSum.toFixed(2)),
    totalAdditions,
    totalDeletions,
    distinctFiles,
    fileChangeEvents,
  };
}
