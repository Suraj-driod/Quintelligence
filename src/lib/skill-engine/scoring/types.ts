/**
 * scoring/types.ts — Core types for Phase 2 Skill Profiling & Scoring.
 * Spec reference: Agents.md Appendix A & Hard Rules §1
 *
 * Phase 2 changes:
 *   - SignalScores: breadth removed; remaining fields are number|null (null = unavailable)
 *   - SignalMetrics: fileCount → distinctFiles; breadth fields removed;
 *     fileChangeEvents added; unavailableSignals added
 *   - SkillProfileSchema: collaboration/coverage use proper schemas (not z.any())
 */

import { z } from "zod";
import type {
  CollaborationEvidence,
  CoverageInfo,
} from "../types";
import {
  CollaborationEvidenceSchema,
  CoverageInfoSchema,
} from "../types";

// ── Signal Scores & Metrics ──────────────────────────────────────────

/** All signal scores are in [0, 1] or null (unavailable — excluded from composite). */
export interface SignalScores {
  /** V — Volume: 1 − exp(−Σ ln(1+c_f) / K) */
  volume: number | null;
  /** D — Depth: construct sophistication index */
  depth: number | null;
  /** T — Sustained: 0.5·(M12/12) + 0.5·(M36/36) */
  sustained: number | null;
  /** Q — Quality/Testing: distinctTestFiles / distinctNonTestFiles ratio */
  quality: number | null;
}

export interface SignalMetrics {
  /** Count of distinct (path) non-removed files contributing to this skill */
  distinctFiles: number;
  /** Total add+delete events across all sampled commits (informational) */
  fileChangeEvents: number;
  totalAdditions: number;
  totalDeletions: number;
  reposCount: number;
  activeMonths12: number;
  activeMonths36: number;
  depthFeaturesDetected: string[];
  testFilesCount: number;
  sourceFilesCount: number;
  /** Signal names that could not be computed (e.g. "Depth" when authored lines < threshold) */
  unavailableSignals: string[];
}

// ── Skill Level & Strength ───────────────────────────────────────────

export type SkillLevel = 1 | 2 | 3 | 4 | 5 | "No evidence";

export type EvidenceStrength = "Low" | "Medium" | "High";

export interface SkillRating {
  skill: string;
  level: SkillLevel;
  rawScore: number;                 // S in [0, 1]
  evidenceStrength: EvidenceStrength;
  signals: SignalScores;
  metrics: SignalMetrics;
  gatingNotes: string[];            // Explains any caps or "No evidence"
}

// ── Skill Profile ────────────────────────────────────────────────────

export interface SkillProfile {
  target: {
    login: string;
    id: number;
    mode: "public" | "public+private";
  };
  evaluatedAt: string;
  skills: SkillRating[];
  collaboration: CollaborationEvidence;
  coverage: CoverageInfo;
}

// ── Role Gap Analysis ────────────────────────────────────────────────

export interface RoleSkillRequirement {
  skill: string;
  requiredLevel: 1 | 2 | 3 | 4 | 5;
  importance: "required" | "preferred";
}

export interface RoleBenchmark {
  roleId: string;
  roleName: string;
  description: string;
  requirements: RoleSkillRequirement[];
  /**
   * Skills in this role that cannot be detected from code evidence alone
   * (e.g. System Design, Communication). Excluded from matchPercentage.
   */
  unobservableSkills?: string[];
}

export type GapStatus = "Exceeds" | "Meets" | "Developing" | "Missing Evidence";

export interface RoleSkillGap {
  skill: string;
  requiredLevel: number;
  currentLevel: SkillLevel;
  delta: number;                    // currentLevelNumber - requiredLevel
  status: GapStatus;
  evidenceStrength: EvidenceStrength | "None";
  importance: "required" | "preferred";
}

export interface RoleGapAnalysis {
  roleId: string;
  roleName: string;
  /**
   * Percentage computed only over requirements that have evidence.
   * 0–100. Does NOT penalise missing evidence — that is expressed by evidenceCoverage.
   */
  matchPercentage: number;
  /**
   * Fraction of required skills for which any evidence exists.
   * 0–1. Use to communicate how observable this candidate is for the role.
   */
  evidenceCoverage: number;
  gaps: RoleSkillGap[];
  strengths: string[];
  recommendations: string[];
  /**
   * Required skills that the engine cannot detect from code evidence
   * (listed in RoleBenchmark.unobservableSkills). Excluded from all percentages.
   */
  unobservableSkills: string[];
}

// ── Zod Schemas ──────────────────────────────────────────────────────

export const SignalScoresSchema = z.object({
  volume: z.number().min(0).max(1).nullable(),
  depth: z.number().min(0).max(1).nullable(),
  sustained: z.number().min(0).max(1).nullable(),
  quality: z.number().min(0).max(1).nullable(),
});

export const SignalMetricsSchema = z.object({
  distinctFiles: z.number().int().nonnegative(),
  fileChangeEvents: z.number().int().nonnegative(),
  totalAdditions: z.number().int().nonnegative(),
  totalDeletions: z.number().int().nonnegative(),
  reposCount: z.number().int().nonnegative(),
  activeMonths12: z.number().int().nonnegative(),
  activeMonths36: z.number().int().nonnegative(),
  depthFeaturesDetected: z.array(z.string()),
  testFilesCount: z.number().int().nonnegative(),
  sourceFilesCount: z.number().int().nonnegative(),
  unavailableSignals: z.array(z.string()),
});

export const SkillRatingSchema = z.object({
  skill: z.string(),
  level: z.union([
    z.literal(1),
    z.literal(2),
    z.literal(3),
    z.literal(4),
    z.literal(5),
    z.literal("No evidence"),
  ]),
  rawScore: z.number().min(0).max(1),
  evidenceStrength: z.enum(["Low", "Medium", "High"]),
  signals: SignalScoresSchema,
  metrics: SignalMetricsSchema,
  gatingNotes: z.array(z.string()),
});

export const SkillProfileSchema = z.object({
  target: z.object({
    login: z.string(),
    id: z.number().int(),
    mode: z.enum(["public", "public+private"]),
  }),
  evaluatedAt: z.string(),
  skills: z.array(SkillRatingSchema),
  collaboration: CollaborationEvidenceSchema,
  coverage: CoverageInfoSchema,
});
