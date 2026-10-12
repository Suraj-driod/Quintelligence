/**
 * ownership.ts — Authored-code sampling (F9)
 * Spec reference: Agents.md §5 F9
 *
 * Per skill, rank files by authored added lines and keep the top
 * SAMPLE_FILES_PER_SKILL. These are the future input to depth scoring.
 * The diff (+lines) are provably the user's own code.
 *
 * Phase 2: FileEvidence now has skills: string[] (array).
 * augmentFileSkills has been deleted — skill attribution now uses
 * getSkillsForFile() in commitDetails.ts and the evaluator uses
 * repo.stack at grouping time for framework skills.
 */

import type { CommitEvidence, FileEvidence } from "../types";
import { ENGINE_CONFIG } from "../config";

interface SkillFileSample {
  path: string;
  authoredAddedLines: string[];
  additions: number;
}

/**
 * Sample the top files per skill by authored added lines.
 * Returns a map of skill → top files with their authored code.
 */
export function sampleFilesBySkill(
  commits: CommitEvidence[]
): Map<string, SkillFileSample[]> {
  // Aggregate files by skill — each file can belong to multiple skills
  const bySkill = new Map<string, SkillFileSample[]>();

  for (const commit of commits) {
    for (const file of commit.files) {
      // Skip removed files
      if (file.status === "removed") continue;

      const fileSkills = file.skills ?? [];
      for (const skill of fileSkills) {
        if (!skill) continue;

        if (!bySkill.has(skill)) {
          bySkill.set(skill, []);
        }

        bySkill.get(skill)!.push({
          path: file.path,
          authoredAddedLines: file.authoredAddedLines ?? [],
          additions: file.additions,
        });
      }
    }
  }

  // Per skill, rank by authored added lines count and keep top SAMPLE_FILES_PER_SKILL
  const sampled = new Map<string, SkillFileSample[]>();

  for (const [skill, files] of bySkill) {
    const sorted = files.sort(
      (a, b) => b.authoredAddedLines.length - a.authoredAddedLines.length
    );

    sampled.set(
      skill,
      sorted.slice(0, ENGINE_CONFIG.SAMPLE_FILES_PER_SKILL)
    );
  }

  return sampled;
}
