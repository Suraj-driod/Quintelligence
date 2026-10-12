/**
 * types.ts — Core data model for the Skill Intelligence Engine.
 * Defines the EvidenceBundle and all supporting types.
 * Spec reference: Agents.md §4
 *
 * schemaVersion 2 changes (Phase 2):
 *   - FileEvidence.skill: string|null → skills: string[]  (one file can carry multiple skills)
 *   - RepoEvidence: added sampling field
 *   - CollaborationEvidence: numeric fields are number|null; prsMerged & comments null when unavailable
 *   - EvidenceBundle: added schemaVersion: 2
 */

import { z } from "zod";

// ─── Core Evidence Types ─────────────────────────────────────────────

export type AnalysisMode = "public" | "public+private";

export type JobStatus = "queued" | "running" | "done" | "error";

export interface AnalysisTarget {
  login: string;
  id: number;
  mode: AnalysisMode;
}

export interface CoverageInfo {
  reposDiscovered: number;
  reposAnalyzed: number;
  commitsListed: number;
  commitsDetailed: number;
  truncated: boolean;
  notes: string[];
}

export interface CollaborationEvidence {
  prsOpened: number;
  /** null when not fetched from API (e.g. PR merge data not in contributionsCollection) */
  prsMerged: number | null;
  reviewsGiven: number;
  issuesOpened: number;
  /** null when not available from the API used */
  comments: number | null;
  windowMonths: 36;
}

export interface FileEvidence {
  path: string;
  status: "added" | "modified" | "removed" | "renamed";
  additions: number;
  deletions: number;
  /** All skills this file contributes to. Empty array = unmapped. */
  skills: string[];
  authoredAddedLines?: string[];
}

export interface CommitEvidence {
  sha: string;
  date: string;
  files: FileEvidence[];
}

export interface RepoEvidence {
  fullName: string;
  isPrivate: boolean;
  isFork: boolean;
  stack: string[];
  commitDates: string[];
  commits: CommitEvidence[];
  /** Sampling coverage: how many non-merge commits were listed vs detailed */
  sampling?: {
    listedNonMerge: number;
    detailed: number;
  };
}

export interface EvidenceBundle {
  /** Schema version: 2 (v1 bundles have no schemaVersion field) */
  schemaVersion: 2;
  target: AnalysisTarget;
  fetchedAt: string;
  coverage: CoverageInfo;
  repos: RepoEvidence[];
  collaboration: CollaborationEvidence;
}

// ─── Schema v1 upcaster ──────────────────────────────────────────────

/**
 * Stored bundles from schema v1 had:
 *   - `FileEvidence.skill: string | null` (singular)
 *   - No `schemaVersion` field
 *
 * This upcaster normalises them to v2 shape before use.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function upcaseEvidenceBundle(raw: any): EvidenceBundle {
  if (raw?.schemaVersion === 2) {
    return raw as EvidenceBundle;
  }

  // v1 → v2: convert FileEvidence.skill → skills[]
  const repos: RepoEvidence[] = (raw?.repos ?? []).map(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (repo: any): RepoEvidence => ({
      ...repo,
      sampling: repo.sampling ?? { listedNonMerge: 0, detailed: 0 },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      commits: (repo.commits ?? []).map((commit: any): CommitEvidence => ({
        ...commit,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        files: (commit.files ?? []).map((file: any): FileEvidence => ({
          ...file,
          // v1 had skill: string | null; convert to skills: string[]
          skills: Array.isArray(file.skills)
            ? file.skills
            : file.skill
            ? [file.skill]
            : [],
          // remove the old singular skill field
          skill: undefined,
        })),
      })),
    })
  );

  const collab: CollaborationEvidence = {
    prsOpened: raw?.collaboration?.prsOpened ?? 0,
    prsMerged: raw?.collaboration?.prsMerged ?? null,
    reviewsGiven: raw?.collaboration?.reviewsGiven ?? 0,
    issuesOpened: raw?.collaboration?.issuesOpened ?? 0,
    comments: raw?.collaboration?.comments ?? null,
    windowMonths: 36,
  };

  return {
    schemaVersion: 2,
    target: raw?.target ?? { login: "", id: 0, mode: "public" },
    fetchedAt: raw?.fetchedAt ?? new Date().toISOString(),
    coverage: raw?.coverage ?? {
      reposDiscovered: 0,
      reposAnalyzed: 0,
      commitsListed: 0,
      commitsDetailed: 0,
      truncated: false,
      notes: [],
    },
    repos,
    collaboration: collab,
  };
}

// ─── Job Types ───────────────────────────────────────────────────────

export interface JobProgress {
  stage: string;
  done: number;
  total: number;
}

import type { SkillProfile } from "./scoring/types";
export type { SkillProfile };

export interface SkillJob {
  jobId: string;
  uid: string;
  target: string;
  mode: AnalysisMode;
  status: JobStatus;
  progress: JobProgress;
  createdAt: string;
  expiresAt: string;
  bundlePath?: string;
  result?: EvidenceBundle;
  profile?: SkillProfile;
  requestLog?: RequestLog;
  error?: string;
}

import type { AnalysisTier } from "./config";
import type { CacheStore } from "./cache";
export type { AnalysisTier, CacheStore };

// ─── API Request/Response Types ──────────────────────────────────────

export interface AnalysisRequest {
  url: string;
  contributor?: string;
  includePrivate: boolean;
  tier?: AnalysisTier;
}

export interface AnalysisJobResponse {
  jobId: string;
}

export interface JobStatusResponse {
  status: JobStatus;
  progress: JobProgress;
  result?: EvidenceBundle;
  profile?: SkillProfile;
  requestLog?: RequestLog;
  error?: string;
}

// ─── Pipeline Types ──────────────────────────────────────────────────

export interface ParsedInput {
  type: "user" | "repo";
  owner: string;
  repo?: string;
  targetLogin: string;
}

export interface ResolvedIdentity {
  login: string;
  id: number;
  type: string;
  userNodeId?: string; // GraphQL node ID for user
}

export interface DiscoveredRepo {
  fullName: string;
  owner: string;
  repo: string;
  isPrivate: boolean;
  isFork: boolean;
  defaultBranch: string;
  authoredCommitCount: number;
  lastAuthoredCommitDate: string;
}

export interface RequestLog {
  totalRequests: number;
  restUsed: number;
  restRemaining: number;
  restResetAt: string;
  graphqlPointsUsed: number;
  graphqlRemaining: number;
  graphqlResetAt?: string;
  cacheHits: number;
  rateLimitRemaining: number; // backward compatibility mirror of restRemaining
  rateLimitReset: string;     // backward compatibility mirror of restResetAt
  byEndpoint: Record<string, number>;
  floor: number;
}

export interface PipelineOptions {
  token: string;
  target: ParsedInput;
  mode: AnalysisMode;
  tier?: AnalysisTier;
  authenticatedLogin?: string;
  userEmails?: string[];
  uid?: string;
  cacheStore?: CacheStore;
  forceRefresh?: boolean;
  includeForks?: boolean;
  fetch?: typeof globalThis.fetch;
  onProgress?: (progress: JobProgress) => void;
}

export interface PipelineResult {
  bundle: EvidenceBundle;
  requestLog: RequestLog;
  profile?: SkillProfile;
}

// ─── Ontology Types ──────────────────────────────────────────────────

export interface SkillMatchRule {
  ext?: string[];
  filename?: string[];
  yamlContains?: string[];
  manifestContains?: Record<string, string[]>;
}

export interface SkillDefinition {
  skill: string;
  match: SkillMatchRule;
}

// ─── Zod Schemas (for API validation) ────────────────────────────────

export const AnalysisRequestSchema = z.object({
  url: z.string().url(),
  contributor: z.string().optional(),
  includePrivate: z.boolean(),
  tier: z.enum(["quick", "standard", "deep"]).optional(),
});

export const FileEvidenceSchema: z.ZodType<FileEvidence> = z.object({
  path: z.string(),
  status: z.enum(["added", "modified", "removed", "renamed"]),
  additions: z.number().int().nonnegative(),
  deletions: z.number().int().nonnegative(),
  skills: z.array(z.string()),
  authoredAddedLines: z.array(z.string()).optional(),
});

export const CommitEvidenceSchema: z.ZodType<CommitEvidence> = z.object({
  sha: z.string(),
  date: z.string(),
  files: z.array(FileEvidenceSchema),
});

export const RepoEvidenceSchema: z.ZodType<RepoEvidence> = z.object({
  fullName: z.string(),
  isPrivate: z.boolean(),
  isFork: z.boolean(),
  stack: z.array(z.string()),
  commitDates: z.array(z.string()),
  commits: z.array(CommitEvidenceSchema),
  sampling: z
    .object({
      listedNonMerge: z.number().int().nonnegative(),
      detailed: z.number().int().nonnegative(),
    })
    .optional(),
});

export const CoverageInfoSchema: z.ZodType<CoverageInfo> = z.object({
  reposDiscovered: z.number().int().nonnegative(),
  reposAnalyzed: z.number().int().nonnegative(),
  commitsListed: z.number().int().nonnegative(),
  commitsDetailed: z.number().int().nonnegative(),
  truncated: z.boolean(),
  notes: z.array(z.string()),
});

export const CollaborationEvidenceSchema: z.ZodType<CollaborationEvidence> =
  z.object({
    prsOpened: z.number().int().nonnegative(),
    prsMerged: z.number().int().nonnegative().nullable(),
    reviewsGiven: z.number().int().nonnegative(),
    issuesOpened: z.number().int().nonnegative(),
    comments: z.number().int().nonnegative().nullable(),
    windowMonths: z.literal(36),
  });

export const EvidenceBundleSchema: z.ZodType<EvidenceBundle> = z.object({
  schemaVersion: z.literal(2),
  target: z.object({
    login: z.string(),
    id: z.number().int(),
    mode: z.enum(["public", "public+private"]),
  }),
  fetchedAt: z.string(),
  coverage: CoverageInfoSchema,
  repos: z.array(RepoEvidenceSchema),
  collaboration: CollaborationEvidenceSchema,
});
