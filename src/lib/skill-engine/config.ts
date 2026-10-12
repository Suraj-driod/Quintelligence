/**
 * config.ts — All constants and weights for the Skill Intelligence Engine.
 * Spec reference: Agents.md §5 table
 *
 * Hard rule (§1, rule 7): Weights and thresholds are guesses until fitted
 * to expert ratings. Keep them in one config file, never hardcoded in logic.
 */

export type AnalysisTier = "quick" | "standard" | "deep";

export interface TierConfig {
  maxRepos: number;
  detailPerRepo: number;
  detailTotalCap: number;
  targetRestRequests: number;
  rateLimitFloor: number;
}

export const ANALYSIS_TIERS: Record<AnalysisTier, TierConfig> = {
  quick: {
    maxRepos: 8,
    detailPerRepo: 25,
    detailTotalCap: 120,
    targetRestRequests: 150,
    rateLimitFloor: 50,
  },
  standard: {
    maxRepos: 12,
    detailPerRepo: 40,
    detailTotalCap: 350,
    targetRestRequests: 400,
    rateLimitFloor: 100,
  },
  deep: {
    maxRepos: 15,
    detailPerRepo: 60,
    detailTotalCap: 600,
    targetRestRequests: 700,
    rateLimitFloor: 200,
  },
} as const;

export const DEFAULT_ANALYSIS_TIER: AnalysisTier = "standard";

export const ENGINE_CONFIG = {
  // ── Analysis tiers ────────────────────────────────────────────────
  DEFAULT_TIER: DEFAULT_ANALYSIS_TIER,
  TIERS: ANALYSIS_TIERS,

  // ── Repo discovery ────────────────────────────────────────────────
  /** Maximum repos analyzed per run (§5 F2) - default from standard tier */
  MAX_REPOS: ANALYSIS_TIERS.standard.maxRepos,

  /** Include forked repos in analysis (§5 F2, default false) */
  INCLUDE_FORKS: false,

  // ── Commit listing ────────────────────────────────────────────────
  /** Max pages of commit listing per repo (100/page) (§5 F3) */
  LIST_PAGES_MAX: 5,

  /** Lookback window in months (§5 F3) */
  LOOKBACK_MONTHS: 36,

  /** Batch size for GraphQL commit listing queries (§3.3) */
  GRAPHQL_COMMIT_BATCH_SIZE: 5,

  // ── Commit details ────────────────────────────────────────────────
  /** Commits fetched in detail per repo (default from standard tier) */
  DETAIL_PER_REPO: ANALYSIS_TIERS.standard.detailPerRepo,

  /** Total cap on detailed commit requests across all repos (standard tier) */
  DETAIL_TOTAL_CAP: ANALYSIS_TIERS.standard.detailTotalCap,

  /** Commits touching more files than this are dropped as bulk (§5 F5) */
  BULK_COMMIT_FILES: 100,

  /** Minimum lines changed (additions + deletions) for a commit to be detailed (§3.4) */
  MIN_COMMIT_LINES: 5,

  /** Maximum lines changed for a commit to be detailed (§3.4) */
  MAX_COMMIT_LINES: 3000,

  /** Minimum authored non-merge commits required for repo to be detailed (§3.4) */
  MIN_COMMITS_PER_REPO: 3,

  // ── Authorship and sampling ───────────────────────────────────────
  /** Max authored added lines kept per file (§5 F9) */
  MAX_PATCH_LINES_PER_FILE: 200,

  /** Files kept per skill for depth scoring (§5 F9) */
  SAMPLE_FILES_PER_SKILL: 20,

  // ── Rate limiting ─────────────────────────────────────────────────
  /** Default stop fetching when remaining requests drop below this */
  RATE_LIMIT_FLOOR: ANALYSIS_TIERS.standard.rateLimitFloor,

  /** Max concurrent requests to GitHub API (§5 F11, §3.6) */
  MAX_CONCURRENT_REQUESTS: 5,

  // ── Caching TTLs ──────────────────────────────────────────────────
  /** Cache TTL for commit details in ms (immutable by sha) */
  CACHE_TTL_COMMIT_DETAILS_MS: Infinity,

  /** Cache TTL for repo lists in ms (1 hour) */
  CACHE_TTL_REPO_LIST_MS: 60 * 60 * 1000,

  /** Default cache TTL in ms (24 hours) */
  CACHE_TTL_DEFAULT_MS: 24 * 60 * 60 * 1000,

  /** Bundle cache TTL in hours (§3.5) */
  BUNDLE_CACHE_HOURS: 24,

  // ── Job / storage ─────────────────────────────────────────────────
  /** Default job/bundle TTL in days */
  BUNDLE_TTL_DAYS: 7,

  // ── Manifests & Stack Detection ───────────────────────────────────
  /** Max manifest files fetched per repo for stack detection (§5 F8) */
  MAX_MANIFESTS_PER_REPO: 10,

  /** Batch size for GraphQL stack detection queries (§3.3) */
  GRAPHQL_STACK_BATCH_SIZE: 8,
} as const;

export type EngineConfig = typeof ENGINE_CONFIG;
