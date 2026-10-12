/**
 * commitDetails.ts — Fetch per-commit file details (F5)
 * Spec reference: Agents.md §5 F5, Phase 3.4, Phase 3.5
 *
 * Phase 3 optimizations:
 * - Persistent caching via CacheStore (immutable by sha, 0 requests on repeat).
 * - Caches raw filtered file records, not skill-mapped output, so ontology updates survive.
 * - Public commits cached under commit-cache/public/{owner}/{repo}/{sha}.json.
 * - Private commits isolated per uid under commit-cache/private/{uid}/{owner}/{repo}/{sha}.json.
 * - Extracts authored added lines (including ++count; without stripping).
 * - Drops bulk commits (> BULK_COMMIT_FILES) and trivial commits.
 * - Respects max concurrency 5 and stops cleanly at rate limit floor.
 */

import type { GitHubClient } from "./client";
import type { CommitEvidence, FileEvidence, CoverageInfo } from "../types";
import { ENGINE_CONFIG } from "../config";
import { isExcludedPath } from "../filters/pathFilter";
import { isBulkCommit } from "../filters/commitFilter";
import { getSkillsForFile } from "../skills/ontology";
import type { ListedCommit } from "./listCommits";
import {
  type CacheStore,
  type CachedCommitDetail,
  getDefaultCacheStore,
  getCommitCacheKey,
} from "../cache";

// ── Concurrency Helper ───────────────────────────────────────────────

async function mapConcurrent<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R>
): Promise<R[]> {
  const results: R[] = new Array(items.length);
  let nextIndex = 0;

  const worker = async () => {
    while (nextIndex < items.length) {
      const idx = nextIndex++;
      results[idx] = await fn(items[idx]);
    }
  };

  const workers = Array.from(
    { length: Math.min(concurrency, items.length) },
    () => worker()
  );
  await Promise.all(workers);
  return results;
}

// ── F5: Commit detail fetching ───────────────────────────────────────

export interface CommitDetailOptions {
  isPrivate?: boolean;
  uid?: string;
  repoStack?: string[];
  cacheStore?: CacheStore;
}

/**
 * Fetch detailed file-level data for a single commit.
 * Checks cache first; on cache hit, 0 REST calls are made.
 * Stores raw file records in cache so ontology changes survive.
 */
export async function fetchCommitDetail(
  client: GitHubClient,
  owner: string,
  repo: string,
  sha: string,
  coverage: CoverageInfo,
  options?: CommitDetailOptions
): Promise<CommitEvidence | null> {
  const cacheStore = options?.cacheStore ?? getDefaultCacheStore();
  const isPrivate = options?.isPrivate ?? false;
  const uid = options?.uid;
  const repoStack = options?.repoStack ?? [];
  const cacheKey = getCommitCacheKey(owner, repo, sha, isPrivate, uid);

  // 1. Check persistent cache
  try {
    const cached = await cacheStore.get<CachedCommitDetail>(cacheKey);
    if (cached) {
      client.recordCacheHit();
      coverage.commitsDetailed++;

      // Attribute skills dynamically using latest ontology and repoStack
      const evidenceFiles: FileEvidence[] = cached.files.map((file) => ({
        path: file.path,
        status: file.status,
        additions: file.additions,
        deletions: file.deletions,
        skills: getSkillsForFile({
          path: file.path,
          repoStack,
          authoredAddedLines: file.authoredAddedLines,
        }),
        authoredAddedLines: file.authoredAddedLines,
      }));

      return {
        sha: cached.sha,
        date: cached.date,
        files: evidenceFiles,
      };
    }
  } catch (err) {
    console.warn(`[skill-engine] Cache read error for ${cacheKey}:`, err);
  }

  // 2. Cache miss: verify rate limit before making REST call
  if (client.isRateLimited()) {
    coverage.truncated = true;
    coverage.notes.push(
      `Rate limit floor reached while fetching commit ${sha.substring(0, 7)} in ${owner}/${repo}.`
    );
    return null;
  }

  try {
    const { data } = await client.rest.repos.getCommit({
      owner,
      repo,
      ref: sha,
    });

    coverage.commitsDetailed++;

    const files = data.files ?? [];

    // Drop bulk commits
    if (isBulkCommit(files.length)) {
      return null;
    }

    const date =
      data.commit.author?.date ??
      data.commit.committer?.date ??
      "";

    // Extract raw file records
    const rawFiles: CachedCommitDetail["files"] = [];
    const evidenceFiles: FileEvidence[] = [];

    for (const file of files) {
      if (isExcludedPath(file.filename)) continue;

      const authoredAddedLines = extractAuthoredLines(
        file.patch,
        ENGINE_CONFIG.MAX_PATCH_LINES_PER_FILE
      );

      const status = normalizeStatus(file.status);
      const rawRecord = {
        path: file.filename,
        status,
        additions: file.additions ?? 0,
        deletions: file.deletions ?? 0,
        authoredAddedLines:
          authoredAddedLines.length > 0 ? authoredAddedLines : undefined,
      };

      rawFiles.push(rawRecord);

      evidenceFiles.push({
        ...rawRecord,
        skills: getSkillsForFile({
          path: file.filename,
          repoStack,
          authoredAddedLines: rawRecord.authoredAddedLines,
        }),
      });
    }

    // Save raw records to persistent cache (no skill attribution cached)
    const toCache: CachedCommitDetail = {
      sha: data.sha,
      date,
      files: rawFiles,
      cachedAt: Date.now(),
    };

    const ttl = isPrivate ? 60 * 60 * 1000 : undefined; // private 1h, public permanent
    await cacheStore.set(cacheKey, toCache, ttl).catch((e) => {
      console.warn(`[skill-engine] Cache set error for ${cacheKey}:`, e);
    });

    return {
      sha: data.sha,
      date,
      files: evidenceFiles,
    };
  } catch (error) {
    console.warn(
      `[skill-engine] Error fetching commit ${sha.substring(0, 7)} in ${owner}/${repo}:`,
      error
    );
    return null;
  }
}

/**
 * Fetch details for a batch of commits, respecting the budget cap and concurrency 5.
 */
export async function fetchCommitDetails(
  client: GitHubClient,
  owner: string,
  repo: string,
  commits: ListedCommit[],
  maxCommits: number,
  coverage: CoverageInfo,
  options?: CommitDetailOptions
): Promise<CommitEvidence[]> {
  const results: CommitEvidence[] = [];
  const toFetch = commits.slice(0, maxCommits);

  if (toFetch.length === 0) return results;

  const concurrency = ENGINE_CONFIG.MAX_CONCURRENT_REQUESTS;

  const batchResults = await mapConcurrent(
    toFetch,
    concurrency,
    async (c) => {
      if (client.isRateLimited()) {
        coverage.truncated = true;
        return null;
      }
      return fetchCommitDetail(client, owner, repo, c.sha, coverage, options);
    }
  );

  for (const r of batchResults) {
    if (r && r.files.length > 0) {
      results.push(r);
    }
  }

  return results;
}

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Extract authored added lines (lines starting with +) from a unified diff patch.
 * These are provably authored by the commit author.
 *
 * GitHub's `patch` field does NOT include file headers (---/+++).
 * Only hunk headers (@@) and content lines appear.
 * Real code lines such as ++count; appear as +++count; and are preserved.
 */
export function extractAuthoredLines(
  patch: string | undefined,
  maxLines: number
): string[] {
  if (!patch) return [];

  const lines = patch.split("\n");
  const addedLines: string[] = [];

  for (const line of lines) {
    if (addedLines.length >= maxLines) break;

    // Skip hunk headers (@@)
    if (line.startsWith("@@")) continue;

    // Lines starting with + are added lines authored by the commit author.
    // Do NOT skip +++ lines — GitHub's patch has no file headers,
    // so +++count; is a real code line (the ++ operator on count).
    if (line.startsWith("+")) {
      addedLines.push(line.substring(1));
    }
  }

  return addedLines;
}

/**
 * Normalize the file status from GitHub API.
 */
function normalizeStatus(
  status: string | undefined
): "added" | "modified" | "removed" | "renamed" {
  switch (status) {
    case "added":
      return "added";
    case "removed":
      return "removed";
    case "renamed":
      return "renamed";
    case "modified":
    case "changed":
    default:
      return "modified";
  }
}
