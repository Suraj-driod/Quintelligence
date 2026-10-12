/**
 * scoring/gapAnalysis.ts — Role Gap Analysis Engine.
 * Benchmarks candidate SkillProfiles against standardized industry role benchmarks.
 *
 * Phase 2.3 changes:
 *   - matchPercentage is computed ONLY over requirements that have evidence
 *     (missing evidence does NOT count as zero skill)
 *   - unobservableSkills: requirements the engine cannot detect from code
 *     (e.g. System Design) are excluded from all percentages
 *   - evidenceCoverage = (# required skills with evidence) / (# required skills)
 */

import { STANDARD_ROLE_BENCHMARKS } from "./config";
import type {
  SkillProfile,
  RoleBenchmark,
  RoleGapAnalysis,
  RoleSkillGap,
  GapStatus,
} from "./types";

/**
 * Compare a candidate's SkillProfile against a specific RoleBenchmark.
 */
export function analyzeRoleGap(
  profile: SkillProfile,
  role: RoleBenchmark
): RoleGapAnalysis {
  const profileSkillsMap = new Map(profile.skills.map((s) => [s.skill.toLowerCase(), s]));
  const unobservableSet = new Set((role.unobservableSkills ?? []).map((s) => s.toLowerCase()));

  const gaps: RoleSkillGap[] = [];
  const strengths: string[] = [];
  const recommendations: string[] = [];
  const unobservableSkills: string[] = [];

  // matchPercentage is computed ONLY over requirements that have evidence
  let totalWeightedTarget = 0;
  let totalWeightedAchieved = 0;

  // evidenceCoverage denominator = required skills that ARE observable
  let observableRequired = 0;
  let observableRequiredWithEvidence = 0;

  for (const req of role.requirements) {
    // Skip unobservable skills — they cannot be scored and are reported separately
    if (unobservableSet.has(req.skill.toLowerCase())) {
      unobservableSkills.push(req.skill);
      continue;
    }

    const weight = req.importance === "required" ? 2 : 1;
    if (req.importance === "required") {
      observableRequired++;
    }

    const matchedSkill = profileSkillsMap.get(req.skill.toLowerCase());

    if (!matchedSkill || matchedSkill.level === "No evidence") {
      gaps.push({
        skill: req.skill,
        requiredLevel: req.requiredLevel,
        currentLevel: "No evidence",
        delta: -req.requiredLevel,
        status: "Missing Evidence",
        evidenceStrength: "None",
        importance: req.importance,
      });

      recommendations.push(
        `Focus on building portfolio evidence in ${req.skill} to achieve target Level ${req.requiredLevel}.`
      );
      // Do NOT add to totalWeightedTarget — missing evidence is excluded from matchPercentage
      continue;
    }

    // This requirement has evidence — include in matchPercentage and evidenceCoverage
    if (req.importance === "required") {
      observableRequiredWithEvidence++;
    }
    totalWeightedTarget += weight * req.requiredLevel;

    const currentLevelNum = matchedSkill.level as number;
    const delta = currentLevelNum - req.requiredLevel;

    let status: GapStatus = "Meets";
    if (delta > 0) {
      status = "Exceeds";
      strengths.push(`${req.skill} (Level ${currentLevelNum} vs required ${req.requiredLevel})`);
    } else if (delta < 0) {
      status = "Developing";
      recommendations.push(
        `Advance ${req.skill} from Level ${currentLevelNum} to Level ${req.requiredLevel} (${Math.abs(delta)} level gap).`
      );
    } else {
      status = "Meets";
      strengths.push(`${req.skill} (Meets target Level ${req.requiredLevel})`);
    }

    totalWeightedAchieved += weight * Math.min(req.requiredLevel, currentLevelNum);

    gaps.push({
      skill: req.skill,
      requiredLevel: req.requiredLevel,
      currentLevel: matchedSkill.level,
      delta,
      status,
      evidenceStrength: matchedSkill.evidenceStrength,
      importance: req.importance,
    });
  }

  const matchPercentage =
    totalWeightedTarget > 0
      ? Math.round((totalWeightedAchieved / totalWeightedTarget) * 100)
      : 0;

  const evidenceCoverage =
    observableRequired > 0
      ? Number((observableRequiredWithEvidence / observableRequired).toFixed(2))
      : 1.0;

  // Sort gaps: Missing Evidence / Developing first, then largest negative delta
  gaps.sort((a, b) => a.delta - b.delta);

  return {
    roleId: role.roleId,
    roleName: role.roleName,
    matchPercentage,
    evidenceCoverage,
    gaps,
    strengths,
    recommendations,
    unobservableSkills,
  };
}

/**
 * Compare a SkillProfile against all standard role benchmarks.
 */
export function analyzeAllRoleGaps(
  profile: SkillProfile,
  benchmarks: RoleBenchmark[] = STANDARD_ROLE_BENCHMARKS
): RoleGapAnalysis[] {
  return benchmarks.map((role) => analyzeRoleGap(profile, role));
}
