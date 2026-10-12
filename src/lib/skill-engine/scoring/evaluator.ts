/**
 * scoring/evaluator.ts — Core evaluator for skill signals, scoring, and gating.
 * Spec reference: CLAUDE_CODE_PROMPT.md Phase 4.5
 *
 * Phase 2 changes:
 *   - Groups by file.skills[] (array) instead of file.skill (singular)
 *   - Null signals are excluded from composite (renormalized weights)
 *   - Breadth (B) fully removed
 *   - Gate 2: repos ≥ 2 OR distinctFiles ≥ 15 (monorepo-friendly)
 *   - Gate 3: Level 5 requires D non-null AND D ≥ 0.70
 *   - SignalMetrics: distinctFiles, fileChangeEvents, unavailableSignals
 *   - Evidence strength lowered one notch when sample fraction is too low
 *   - Round only for display; compare cutoffs against unrounded score
 */

import { SCORING_CONFIG } from "./config";
import type {
  SkillProfile,
  SkillRating,
  SkillLevel,
  EvidenceStrength,
  SignalScores,
  SignalMetrics,
} from "./types";
import type { EvidenceBundle, FileEvidence } from "../types";
import { calculateVolumeSignal } from "./signals/volume";
import { calculateDepthSignal } from "./signals/depth";
import { calculateSustainedSignal } from "./signals/sustained";
import { calculateQualitySignal } from "./signals/quality";

interface SkillBucket {
  skill: string;
  /** All non-removed files for this skill (across all commits/repos). */
  files: FileEvidence[];
  /** Dates of detailed commits that touched this skill. */
  commitDates: string[];
  repos: Set<string>;
  repoStacks: Set<string>;
  /** Sampling fractions per repo, for evidence strength downgrade. */
  samplingFractions: Array<{ listedNonMerge: number; detailed: number }>;
}

/**
 * Group evidence from an EvidenceBundle by skill.
 * Each file can contribute to multiple skills (skills: string[]).
 * Removed files are excluded entirely.
 */
function groupEvidenceBySkill(bundle: EvidenceBundle): Map<string, SkillBucket> {
  const buckets = new Map<string, SkillBucket>();

  for (const repo of bundle.repos) {
    const repoStackList = repo.stack ?? [];
    const sampling = repo.sampling ?? { listedNonMerge: 0, detailed: 0 };

    for (const commit of repo.commits) {
      for (const file of commit.files) {
        const fileSkills = file.skills ?? [];
        if (fileSkills.length === 0) continue;

        for (const skill of fileSkills) {
          if (!skill) continue;

          if (!buckets.has(skill)) {
            buckets.set(skill, {
              skill,
              files: [],
              commitDates: [],
              repos: new Set(),
              repoStacks: new Set(),
              samplingFractions: [],
            });
          }

          // Exclude removed files from evidence entirely (not counted in files/dates)
          if (file.status === "removed") continue;

          const bucket = buckets.get(skill)!;
          bucket.files.push(file);
          if (commit.date) {
            bucket.commitDates.push(commit.date);
          }
          bucket.repos.add(repo.fullName);
          for (const stackItem of repoStackList) {
            bucket.repoStacks.add(stackItem);
          }
        }
      }
    }

    // Record sampling fraction for each repo that has this skill
    // We'll assign after we know which skills reference this repo
    // (done in a second pass if needed; for now store per repo)
    for (const bucket of buckets.values()) {
      if (bucket.repos.has(repo.fullName)) {
        // Avoid duplicate entries
        const alreadyHas = bucket.samplingFractions.some(
          (sf) => sf.listedNonMerge === sampling.listedNonMerge && sf.detailed === sampling.detailed
        );
        if (!alreadyHas && (sampling.listedNonMerge > 0 || sampling.detailed > 0)) {
          bucket.samplingFractions.push(sampling);
        }
      }
    }
  }

  return buckets;
}

/**
 * Calculate Evidence Strength from coverage metrics.
 * E_s = 0.4·min(1, distinctFiles/50) + 0.3·min(1, repos/3) + 0.3·min(1, M36/12)
 *
 * Lowered one notch if the sample fraction is below MIN_SAMPLE_FRACTION.
 */
export function calculateEvidenceStrength(
  distinctFiles: number,
  reposCount: number,
  activeMonths36: number,
  samplingFractions: Array<{ listedNonMerge: number; detailed: number }> = []
): { strength: EvidenceStrength; rawValue: number } {
  const {
    FILES_CAP,
    REPOS_CAP,
    MONTHS_CAP,
    FILES_WEIGHT,
    REPOS_WEIGHT,
    MONTHS_WEIGHT,
    LOW_CUTOFF,
    HIGH_CUTOFF,
    MIN_SAMPLE_FRACTION,
  } = SCORING_CONFIG.EVIDENCE_STRENGTH;

  const rawValue =
    FILES_WEIGHT * Math.min(1, distinctFiles / FILES_CAP) +
    REPOS_WEIGHT * Math.min(1, reposCount / REPOS_CAP) +
    MONTHS_WEIGHT * Math.min(1, activeMonths36 / MONTHS_CAP);

  let strength: EvidenceStrength = "Low";
  if (rawValue >= HIGH_CUTOFF) {
    strength = "High";
  } else if (rawValue >= LOW_CUTOFF) {
    strength = "Medium";
  }

  // Downgrade one notch if sample fraction is too low
  if (samplingFractions.length > 0) {
    const totalListed = samplingFractions.reduce((s, f) => s + f.listedNonMerge, 0);
    const totalDetailed = samplingFractions.reduce((s, f) => s + f.detailed, 0);
    const fraction = totalListed > 0 ? totalDetailed / totalListed : 1;

    if (fraction < MIN_SAMPLE_FRACTION) {
      if (strength === "High") strength = "Medium";
      else if (strength === "Medium") strength = "Low";
    }
  }

  return { strength, rawValue: Number(rawValue.toFixed(3)) };
}

/**
 * Map raw composite score to preliminary level (1 to 5).
 * Compares against UNROUNDED score.
 */
export function mapScoreToPreliminaryLevel(score: number): 1 | 2 | 3 | 4 | 5 {
  const { LEVEL_1_MAX, LEVEL_2_MAX, LEVEL_3_MAX, LEVEL_4_MAX } =
    SCORING_CONFIG.LEVEL_CUTOFFS;

  if (score < LEVEL_1_MAX) return 1;
  if (score < LEVEL_2_MAX) return 2;
  if (score < LEVEL_3_MAX) return 3;
  if (score < LEVEL_4_MAX) return 4;
  return 5;
}

/**
 * Compute composite score from non-null signals using renormalized weights.
 * Null signals are excluded; remaining weights are renormalized to sum to 1.
 */
function computeCompositeScore(signals: SignalScores): number {
  const { WEIGHTS } = SCORING_CONFIG;

  const candidates: Array<{ weight: number; value: number }> = [
    { weight: WEIGHTS.VOLUME,    value: signals.volume    ?? -1 },
    { weight: WEIGHTS.DEPTH,     value: signals.depth     ?? -1 },
    { weight: WEIGHTS.SUSTAINED, value: signals.sustained ?? -1 },
    { weight: WEIGHTS.QUALITY,   value: signals.quality   ?? -1 },
  ].filter((c) => c.value >= 0);

  if (candidates.length === 0) return 0;

  const totalWeight = candidates.reduce((s, c) => s + c.weight, 0);
  const score = candidates.reduce((s, c) => s + (c.weight / totalWeight) * c.value, 0);

  return score; // do NOT round here — compare cutoffs against full precision
}

/**
 * Evaluate a single skill bucket against signals and gating rules.
 */
export function evaluateSkill(bucket: SkillBucket): SkillRating {
  const { files, commitDates, repos, samplingFractions } = bucket;

  // 1. Calculate signals
  const vol = calculateVolumeSignal(files);
  const dep = calculateDepthSignal(files, bucket.skill);
  const sus = calculateSustainedSignal(commitDates);
  const qlt = calculateQualitySignal(files, bucket.skill);

  // Count distinct non-removed files for gates and evidence strength
  const distinctFileSet = new Set(files.map((f) => f.path));
  const distinctFiles = distinctFileSet.size;

  const signals: SignalScores = {
    volume:    vol.score,
    depth:     dep.score,
    sustained: sus.score,
    quality:   qlt.score,
  };

  const unavailableSignals: string[] = [];
  if (signals.volume    === null) unavailableSignals.push("Volume");
  if (signals.depth     === null) unavailableSignals.push("Depth");
  if (signals.sustained === null) unavailableSignals.push("Sustained");
  if (signals.quality   === null) unavailableSignals.push("Quality");

  const metrics: SignalMetrics = {
    distinctFiles,
    fileChangeEvents: vol.fileChangeEvents,
    totalAdditions: vol.totalAdditions,
    totalDeletions: vol.totalDeletions,
    reposCount: repos.size,
    activeMonths12: sus.activeMonths12,
    activeMonths36: sus.activeMonths36,
    depthFeaturesDetected: dep.detectedFeatures,
    testFilesCount: qlt.testFilesCount,
    sourceFilesCount: qlt.sourceFilesCount,
    unavailableSignals,
  };

  // 2. Compute composite score (renormalized over non-null signals)
  const rawScore = Number(computeCompositeScore(signals).toFixed(4));

  // 3. Compute Evidence Strength
  const { strength: evidenceStrength } = calculateEvidenceStrength(
    distinctFiles,
    metrics.reposCount,
    metrics.activeMonths36,
    samplingFractions
  );

  // 4. Apply Hard Gating Rules
  const gatingNotes: string[] = [];
  let level: SkillLevel;

  const { GATES } = SCORING_CONFIG;

  // Gate 1: "No evidence" if fewer than 3 distinct files OR fewer than 2 active months
  if (
    distinctFiles < GATES.MIN_FILES_FOR_EVIDENCE ||
    metrics.activeMonths36 < GATES.MIN_MONTHS_FOR_EVIDENCE
  ) {
    level = "No evidence";
    gatingNotes.push(
      `Insufficient evidence (${distinctFiles} qualifying files, ${metrics.activeMonths36} active months). ` +
      `Minimum required: ${GATES.MIN_FILES_FOR_EVIDENCE} files and ${GATES.MIN_MONTHS_FOR_EVIDENCE} active months.`
    );
  } else {
    let preliminaryLevel = mapScoreToPreliminaryLevel(rawScore);

    // Gate 2: Level ≥ 3 requires M36 ≥ 6 AND (repos ≥ 2 OR distinctFiles ≥ 15)
    // (monorepo-friendly: one repo with many files still qualifies)
    if (preliminaryLevel >= 3) {
      const missesMonths = metrics.activeMonths36 < GATES.LEVEL_3_MIN_MONTHS_36;
      const missesRepos  = metrics.reposCount < GATES.LEVEL_3_MIN_REPOS;
      const missesFiles  = distinctFiles < GATES.LEVEL_3_MIN_DISTINCT_FILES;

      if (missesMonths || (missesRepos && missesFiles)) {
        preliminaryLevel = 2;
        const reasons: string[] = [];
        if (missesMonths) {
          reasons.push(`≥ ${GATES.LEVEL_3_MIN_MONTHS_36} active months (observed ${metrics.activeMonths36})`);
        }
        if (missesRepos && missesFiles) {
          reasons.push(
            `≥ ${GATES.LEVEL_3_MIN_REPOS} distinct repos (observed ${metrics.reposCount}) ` +
            `OR ≥ ${GATES.LEVEL_3_MIN_DISTINCT_FILES} distinct files (observed ${distinctFiles})`
          );
        }
        gatingNotes.push(
          `Capped at Level 2: Level 3+ requires ${reasons.join(" and ")}.`
        );
      }
    }

    // Gate 3: Level 5 requires D non-null AND D ≥ 0.70
    if (preliminaryLevel === 5) {
      if (signals.depth === null) {
        preliminaryLevel = 4;
        gatingNotes.push(
          `Capped at Level 4: Level 5 requires Depth signal (D is unavailable — not enough authored code for this skill).`
        );
      } else if (signals.depth < GATES.LEVEL_5_MIN_DEPTH) {
        preliminaryLevel = 4;
        gatingNotes.push(
          `Capped at Level 4: Level 5 requires Depth score ≥ ${GATES.LEVEL_5_MIN_DEPTH} (observed ${signals.depth.toFixed(2)}).`
        );
      }
    }

    level = preliminaryLevel;
  }

  return {
    skill: bucket.skill,
    level,
    rawScore,
    evidenceStrength,
    signals,
    metrics,
    gatingNotes,
  };
}

/**
 * Evaluate an entire EvidenceBundle into a complete SkillProfile.
 */
export function evaluateEvidenceBundle(bundle: EvidenceBundle): SkillProfile {
  const buckets = groupEvidenceBySkill(bundle);
  const skills: SkillRating[] = [];

  for (const bucket of buckets.values()) {
    const rating = evaluateSkill(bucket);
    skills.push(rating);
  }

  // Sort skills:
  // 1. Evidence-backed skills first (Level 5 down to Level 1), followed by "No evidence"
  // 2. Secondary sort: rawScore descending
  skills.sort((a, b) => {
    const aIsEv = a.level !== "No evidence";
    const bIsEv = b.level !== "No evidence";

    if (aIsEv && !bIsEv) return -1;
    if (!aIsEv && bIsEv) return 1;

    if (typeof a.level === "number" && typeof b.level === "number") {
      if (b.level !== a.level) return b.level - a.level;
    }

    return b.rawScore - a.rawScore;
  });

  return {
    target: bundle.target,
    evaluatedAt: new Date().toISOString(),
    skills,
    collaboration: bundle.collaboration,
    coverage: bundle.coverage,
  };
}
