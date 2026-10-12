/**
 * scoring/config.ts — Scoring weights, gating thresholds, and role benchmarks.
 * Spec reference: CLAUDE_CODE_PROMPT.md Phase 2 & Agents.md Appendix A
 *
 * Rule 7: "Weights and thresholds are guesses until fitted to expert ratings.
 * Keep them in one config file, never hardcoded in logic."
 *
 * Phase 2 changes:
 *   - Breadth (B) removed from weights entirely
 *   - New weights: V 0.25, D 0.30, T 0.30, Q 0.15 (sum 1.00)
 *   - New level cutoffs: <0.20→1, <0.40→2, <0.60→3, <0.80→4, ≥0.80→5
 *   - VOLUME_SATURATION_K: replaces sigmoid midpoint/scale
 *   - DEPTH_MIN_MATCHES, DEPTH_MIN_LINES, DEPTH_TARGET_FRACTION moved here from logic
 *   - QUALITY_TEST_RATIO_TARGET in NORMALIZATION
 *   - SUSTAINED_WEIGHT_12 / SUSTAINED_WEIGHT_36 for T formula
 *   - Gate 2: repos ≥ 2 OR distinctFiles ≥ 15 (monorepo-friendly)
 *   - MIN_SAMPLE_FRACTION for evidence strength downgrade
 */

import type { RoleBenchmark } from "./types";

export const SCORING_CONFIG = {
  // ── Composite Score Weights (sum = 1.00) ───────────────────────────
  // Breadth (B) has been removed per spec decision.
  // No signal above 0.30 — none is validated yet.
  WEIGHTS: {
    VOLUME: 0.25,    // V
    DEPTH: 0.30,     // D
    SUSTAINED: 0.30, // T
    QUALITY: 0.15,   // Q
  },

  // ── Score to Level Mapping Thresholds ──────────────────────────────
  // S < 0.20 → 1, < 0.40 → 2, < 0.60 → 3, < 0.80 → 4, ≥ 0.80 → 5
  LEVEL_CUTOFFS: {
    LEVEL_1_MAX: 0.20,
    LEVEL_2_MAX: 0.40,
    LEVEL_3_MAX: 0.60,
    LEVEL_4_MAX: 0.80,
  },

  // ── Gating Thresholds (Hard Rules) ─────────────────────────────────
  GATES: {
    // Fewer than 3 distinct files OR fewer than 2 active months → "No evidence"
    MIN_FILES_FOR_EVIDENCE: 3,
    MIN_MONTHS_FOR_EVIDENCE: 2,

    // Level ≥ 3 requires M36 ≥ 6 AND (repos ≥ 2 OR distinctFiles ≥ 15)
    // (monorepo-friendly: one repo with many files still qualifies)
    LEVEL_3_MIN_MONTHS_36: 6,
    LEVEL_3_MIN_REPOS: 2,
    LEVEL_3_MIN_DISTINCT_FILES: 15,   // alternative to LEVEL_3_MIN_REPOS

    // Level 5 requires Depth D ≥ 0.70 (and D must be non-null)
    LEVEL_5_MIN_DEPTH: 0.70,
  },

  // ── Evidence Strength Thresholds ───────────────────────────────────
  // E_s = 0.4·min(1, distinctFiles/50) + 0.3·min(1, repos/3) + 0.3·min(1, M36/12)
  EVIDENCE_STRENGTH: {
    FILES_CAP: 50,
    REPOS_CAP: 3,
    MONTHS_CAP: 12,
    FILES_WEIGHT: 0.4,
    REPOS_WEIGHT: 0.3,
    MONTHS_WEIGHT: 0.3,
    LOW_CUTOFF: 0.4,
    HIGH_CUTOFF: 0.7,
    /** If sampling.detailed / sampling.listedNonMerge is below this, downgrade strength one notch */
    MIN_SAMPLE_FRACTION: 0.15,
  },

  // ── Normalization Parameters ───────────────────────────────────────
  NORMALIZATION: {
    // Signal V: V = 1 − exp(−raw / K)   raw = Σ ln(1 + c_f) per distinct file
    // K = 80 produces sensible [0,1] spread across realistic portfolios
    VOLUME_SATURATION_K: 80,

    // Signal D thresholds (moved from logic to config)
    /** A construct must match at least this many lines to count */
    DEPTH_MIN_MATCHES: 2,
    /** If skill has fewer than this many non-comment authored lines → D = null */
    DEPTH_MIN_LINES: 30,
    /** D normalisation target = this fraction × sum of all construct weights */
    DEPTH_TARGET_FRACTION: 0.65,

    // Signal T weights
    SUSTAINED_WEIGHT_12: 0.5,
    SUSTAINED_WEIGHT_36: 0.5,

    // Signal Q
    /** test file / source file ratio that maps to Q = 1.0 */
    QUALITY_TEST_RATIO_TARGET: 0.35,
    /** At least this many distinct non-test files to compute Q (else null) */
    QUALITY_MIN_SOURCE_FILES: 3,
  },
};

// ── Standard Industry Role Benchmarks ────────────────────────────────

export const STANDARD_ROLE_BENCHMARKS: RoleBenchmark[] = [
  {
    roleId: "fullstack-engineer",
    roleName: "Full-Stack Engineer",
    description: "Builds responsive client applications and robust backend services.",
    requirements: [
      { skill: "TypeScript", requiredLevel: 4, importance: "required" },
      { skill: "React", requiredLevel: 4, importance: "required" },
      { skill: "Next.js", requiredLevel: 3, importance: "preferred" },
      { skill: "JavaScript", requiredLevel: 4, importance: "required" },
      { skill: "Python", requiredLevel: 3, importance: "preferred" },
      { skill: "Docker", requiredLevel: 2, importance: "preferred" },
      { skill: "CI/CD", requiredLevel: 3, importance: "preferred" },
    ],
    unobservableSkills: ["System Design", "Communication"],
  },
  {
    roleId: "backend-specialist",
    roleName: "Backend Engineer",
    description: "Architects scalable distributed systems, APIs, and microservices.",
    requirements: [
      { skill: "Java", requiredLevel: 4, importance: "preferred" },
      { skill: "Spring Boot", requiredLevel: 4, importance: "preferred" },
      { skill: "Python", requiredLevel: 4, importance: "preferred" },
      { skill: "Go", requiredLevel: 4, importance: "preferred" },
      { skill: "Docker", requiredLevel: 3, importance: "required" },
      { skill: "Kubernetes", requiredLevel: 3, importance: "preferred" },
      { skill: "CI/CD", requiredLevel: 3, importance: "required" },
    ],
    unobservableSkills: ["System Design", "Database Design"],
  },
  {
    roleId: "frontend-specialist",
    roleName: "Frontend Engineer",
    description: "Crafts high-performance user interfaces, animations, and web experiences.",
    requirements: [
      { skill: "TypeScript", requiredLevel: 4, importance: "required" },
      { skill: "JavaScript", requiredLevel: 5, importance: "required" },
      { skill: "React", requiredLevel: 5, importance: "required" },
      { skill: "Next.js", requiredLevel: 4, importance: "preferred" },
      { skill: "CI/CD", requiredLevel: 2, importance: "preferred" },
    ],
    unobservableSkills: ["UX Design", "Accessibility"],
  },
  {
    roleId: "devops-cloud-engineer",
    roleName: "DevOps / Cloud Engineer",
    description: "Automates CI/CD pipelines, container orchestration, and infrastructure as code.",
    requirements: [
      { skill: "Docker", requiredLevel: 5, importance: "required" },
      { skill: "Kubernetes", requiredLevel: 4, importance: "required" },
      { skill: "CI/CD", requiredLevel: 4, importance: "required" },
      { skill: "Terraform", requiredLevel: 4, importance: "preferred" },
      { skill: "Python", requiredLevel: 3, importance: "preferred" },
      { skill: "Go", requiredLevel: 3, importance: "preferred" },
    ],
    unobservableSkills: ["Cloud Architecture", "Incident Response"],
  },
  {
    roleId: "python-ai-engineer",
    roleName: "Python / Data / AI Engineer",
    description: "Develops machine learning pipelines, data processing workflows, and backend services.",
    requirements: [
      { skill: "Python", requiredLevel: 5, importance: "required" },
      { skill: "Django", requiredLevel: 3, importance: "preferred" },
      { skill: "Docker", requiredLevel: 3, importance: "preferred" },
      { skill: "CI/CD", requiredLevel: 3, importance: "preferred" },
    ],
    unobservableSkills: ["ML Model Design", "Data Science"],
  },
];
