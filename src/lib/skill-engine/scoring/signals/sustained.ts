/**
 * signals/sustained.ts — Signal T (Sustained Activity)
 * Spec reference: CLAUDE_CODE_PROMPT.md Phase 4.2
 *
 * T = 0.5·min(1, M12/12) + 0.5·min(1, M36/36)
 * where M is the count of distinct UTC calendar months with ≥ 1 qualifying commit.
 *
 * Returns null when there are no dates (null ≠ 0; excluded from composite).
 *
 * NOTE: With Phase 3.4's month-stratified sampling, the set of detailed-commit dates
 * approximates presence per month. It is a lower bound of true active months.
 *
 * Weights 0.5/0.5 come from config (SUSTAINED_WEIGHT_12 / SUSTAINED_WEIGHT_36).
 */

import { SCORING_CONFIG } from "../config";

/**
 * Calculate Signal T (Sustained Activity) from commit dates for a skill.
 *
 * @param commitDates  ISO-8601 date strings for commits touching this skill.
 * @param now          Override "now" for deterministic tests. Defaults to new Date().
 */
export function calculateSustainedSignal(
  commitDates: string[],
  now: Date = new Date()
): {
  score: number | null;
  activeMonths12: number;
  activeMonths36: number;
} {
  if (commitDates.length === 0) {
    return { score: null, activeMonths12: 0, activeMonths36: 0 };
  }

  const { SUSTAINED_WEIGHT_12, SUSTAINED_WEIGHT_36 } = SCORING_CONFIG.NORMALIZATION;

  // Use UTC month boundaries
  const nowMs = now.getTime();
  const oneYearAgoMs = Date.UTC(
    now.getUTCFullYear() - 1,
    now.getUTCMonth(),
    now.getUTCDate()
  );
  const threeYearsAgoMs = Date.UTC(
    now.getUTCFullYear() - 3,
    now.getUTCMonth(),
    now.getUTCDate()
  );

  const months12Set = new Set<string>();
  const months36Set = new Set<string>();

  for (const dateStr of commitDates) {
    if (!dateStr) continue;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) continue;

    const ms = d.getTime();
    // Use UTC year/month for deterministic bucketing across time zones
    const monthKey = `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`;

    if (ms >= threeYearsAgoMs && ms <= nowMs) {
      months36Set.add(monthKey);
    }
    if (ms >= oneYearAgoMs && ms <= nowMs) {
      months12Set.add(monthKey);
    }
  }

  const M12 = months12Set.size;
  const M36 = months36Set.size;

  // Return null if no months fall in range (all commits pre-date the 36-month window)
  if (M36 === 0) {
    return { score: null, activeMonths12: 0, activeMonths36: 0 };
  }

  const score =
    SUSTAINED_WEIGHT_12 * Math.min(1, M12 / 12) +
    SUSTAINED_WEIGHT_36 * Math.min(1, M36 / 36);

  return {
    score: Number(score.toFixed(4)),
    activeMonths12: M12,
    activeMonths36: M36,
  };
}
