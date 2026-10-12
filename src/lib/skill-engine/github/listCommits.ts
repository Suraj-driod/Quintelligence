/**
 * listCommits.ts — Commit listing (F3) + commit selection (F4)
 * Spec reference: Agents.md §5 F3, F4, Phase 3.3, Phase 3.4
 *
 * Phase 3 optimizations:
 * - Batched GraphQL commit listing across ~5 repos per query.
 * - Extracts oid, committedDate, additions, deletions, changedFiles in listing,
 *   enabling smart selection BEFORE spending REST calls.
 * - Month stratification: picks largest commit per month to ensure Signal T coverage.
 * - Budget distribution: proportional to ln(1 + authoredNonMergeCommits).
 * - Skips repos with < MIN_COMMITS_PER_REPO (3) commits.
 * - Drops merge commits, bots, bulk (> BULK_COMMIT_FILES), and trivial (< MIN_COMMIT_LINES).
 * - Enforces LIST_PAGES_MAX truncation note.
 */

import type { GitHubClient } from "./client";
import type { DiscoveredRepo, CoverageInfo } from "../types";
import { ENGINE_CONFIG, type TierConfig } from "../config";
import { isBotAuthor, isMergeCommit, isBulkCommit } from "../filters/commitFilter";

// ── Types ────────────────────────────────────────────────────────────

export interface ListedCommit {
  sha: string;
  date: string;
  parentCount: number;
  authorLogin?: string;
  additions: number;
  deletions: number;
  changedFiles?: number;
}

export interface CommitListResult {
  allDates: string[];
  commitsForDetail: ListedCommit[];
  totalListed: number;
}

// ── F3: List commits via batched GraphQL (Phase 3.3) ─────────────────

export interface CommitListingOptions {
  userNodeId?: string;
  targetLogin: string;
  userEmails?: string[];
}

/**
 * List commits for multiple repos using batched GraphQL queries.
 * Batches ~5 repos per query.
 */
export async function listCommitsBatchedGraphQL(
  client: GitHubClient,
  repos: DiscoveredRepo[],
  options: CommitListingOptions,
  coverage: CoverageInfo,
  tierConfig?: TierConfig
): Promise<Map<string, CommitListResult>> {
  const results = new Map<string, CommitListResult>();
  if (repos.length === 0) return results;

  const since = new Date();
  since.setMonth(since.getMonth() - ENGINE_CONFIG.LOOKBACK_MONTHS);
  const sinceIso = since.toISOString();

  const batchSize = ENGINE_CONFIG.GRAPHQL_COMMIT_BATCH_SIZE;

  for (let i = 0; i < repos.length; i += batchSize) {
    if (client.isRateLimited()) {
      coverage.truncated = true;
      coverage.notes.push(
        "Rate limit floor reached while listing commits via GraphQL."
      );
      break;
    }

    const batch = repos.slice(i, i + batchSize);

    // Build aliased GraphQL query for the batch
    const repoQueries = batch
      .map(
        (repo, idx) => `
      r${idx}: repository(owner: "${repo.owner}", name: "${repo.repo}") {
        defaultBranchRef {
          target {
            ... on Commit {
              history(first: 100, since: $since ${
                options.userNodeId ? ", author: $author" : ""
              }) {
                pageInfo {
                  hasNextPage
                  endCursor
                }
                nodes {
                  oid
                  committedDate
                  additions
                  deletions
                  changedFilesIfAvailable
                  parents { totalCount }
                }
              }
            }
          }
        }
      }
    `
      )
      .join("\n");

    const query = `
      query($since: GitTimestamp ${options.userNodeId ? ", $author: CommitAuthor" : ""}) {
        ${repoQueries}
        rateLimit {
          cost
          remaining
          resetAt
        }
      }
    `;

    const variables: Record<string, unknown> = {
      since: sinceIso,
    };

    if (options.userNodeId) {
      const authorVar: { id: string; emails?: string[] } = {
        id: options.userNodeId,
      };
      if (options.userEmails && options.userEmails.length > 0) {
        authorVar.emails = options.userEmails;
      }
      variables.author = authorVar;
    }

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await client.graphqlClient(query, variables);

      for (let idx = 0; idx < batch.length; idx++) {
        const repo = batch[idx];
        const rData = data?.[`r${idx}`];
        const history = rData?.defaultBranchRef?.target?.history;
        const nodes = history?.nodes ?? [];
        const hasNextPage = history?.pageInfo?.hasNextPage ?? false;
        let endCursor = history?.pageInfo?.endCursor ?? null;

        const allDates: string[] = [];
        const validCommits: ListedCommit[] = [];

        const processNodes = (commitNodes: any[]) => {
          for (const node of commitNodes) {
            const date = node.committedDate ?? "";
            allDates.push(date);

            const parentCount = node.parents?.totalCount ?? 0;
            if (isMergeCommit(parentCount)) continue;

            validCommits.push({
              sha: node.oid,
              date,
              parentCount,
              additions: node.additions ?? 0,
              deletions: node.deletions ?? 0,
              changedFiles: node.changedFilesIfAvailable ?? undefined,
            });
          }
        };

        processNodes(nodes);
        coverage.commitsListed += nodes.length;

        // Paginate single repo if hasNextPage, up to LIST_PAGES_MAX
        let page = 1;
        while (hasNextPage && page < ENGINE_CONFIG.LIST_PAGES_MAX && endCursor && !client.isRateLimited()) {
          try {
            const pageQuery = `
              query($owner: String!, $name: String!, $since: GitTimestamp, $after: String ${
                options.userNodeId ? ", $author: CommitAuthor" : ""
              }) {
                repository(owner: $owner, name: $name) {
                  defaultBranchRef {
                    target {
                      ... on Commit {
                        history(first: 100, since: $since, after: $after ${
                          options.userNodeId ? ", author: $author" : ""
                        }) {
                          pageInfo { hasNextPage endCursor }
                          nodes {
                            oid
                            committedDate
                            additions
                            deletions
                            changedFilesIfAvailable
                            parents { totalCount }
                          }
                        }
                      }
                    }
                  }
                }
              }
            `;
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            const pageData: any = await client.graphqlClient(pageQuery, {
              owner: repo.owner,
              name: repo.repo,
              since: sinceIso,
              after: endCursor,
              ...(options.userNodeId ? { author: variables.author } : {}),
            });

            const pageHistory = pageData?.repository?.defaultBranchRef?.target?.history;
            const pageNodes = pageHistory?.nodes ?? [];
            processNodes(pageNodes);
            coverage.commitsListed += pageNodes.length;

            page++;
            if (!pageHistory?.pageInfo?.hasNextPage) break;
            endCursor = pageHistory.pageInfo.endCursor;
          } catch {
            break;
          }
        }

        if (page >= ENGINE_CONFIG.LIST_PAGES_MAX && hasNextPage) {
          coverage.truncated = true;
          coverage.notes.push(
            `Commit listing for ${repo.fullName} hit the ${ENGINE_CONFIG.LIST_PAGES_MAX}-page cap; coverage was truncated.`
          );
        }

        results.set(repo.fullName, {
          allDates,
          commitsForDetail: validCommits,
          totalListed: allDates.length,
        });
      }
    } catch (err) {
      console.warn(
        `[skill-engine] GraphQL batched commit listing failed, falling back to REST for batch:`,
        err
      );
      // Fall back to REST for this batch
      for (const repo of batch) {
        if (!client.isRateLimited()) {
          const restResult = await listCommitsForRepo(
            client,
            repo,
            options.targetLogin,
            coverage
          );
          results.set(repo.fullName, restResult);
        }
      }
    }
  }

  return results;
}

// ── F3: List commits via REST (Fallback & Single-repo) ────────────────

/**
 * List all authored commits in a repo within the lookback window using REST.
 * Returns dates for all commits, plus selected commits for detail fetching.
 */
export async function listCommitsForRepo(
  client: GitHubClient,
  repo: DiscoveredRepo,
  targetLogin: string,
  coverage: CoverageInfo
): Promise<CommitListResult> {
  const allDates: string[] = [];
  const validCommits: ListedCommit[] = [];

  const since = new Date();
  since.setMonth(since.getMonth() - ENGINE_CONFIG.LOOKBACK_MONTHS);

  let page = 1;
  let hitPageLimit = false;

  while (page <= ENGINE_CONFIG.LIST_PAGES_MAX) {
    if (client.isRateLimited()) {
      coverage.truncated = true;
      coverage.notes.push(
        `Rate limit floor reached while listing commits for ${repo.fullName}.`
      );
      break;
    }

    try {
      const { data } = await client.rest.repos.listCommits({
        owner: repo.owner,
        repo: repo.repo,
        author: targetLogin,
        since: since.toISOString(),
        per_page: 100,
        page,
      });

      if (data.length === 0) break;

      for (const commit of data) {
        const date =
          commit.commit?.author?.date ??
          commit.commit.committer?.date ??
          "";
        const authorLogin = commit.author?.login ?? "";
        const parentCount = commit.parents?.length ?? 0;

        allDates.push(date);

        // Filter: skip merge commits and bot authors
        if (isMergeCommit(parentCount)) continue;
        if (authorLogin && isBotAuthor(authorLogin)) continue;

        validCommits.push({
          sha: commit.sha,
          date,
          parentCount,
          authorLogin,
          additions: 0,
          deletions: 0,
        });
      }

      coverage.commitsListed += data.length;

      if (data.length < 100) break;
      page++;

      if (page > ENGINE_CONFIG.LIST_PAGES_MAX) {
        hitPageLimit = true;
      }
    } catch (error) {
      console.warn(
        `[skill-engine] Error listing commits for ${repo.fullName} page ${page}:`,
        error
      );
      break;
    }
  }

  // Mark truncated if we exhausted all allowed pages
  if (hitPageLimit) {
    coverage.truncated = true;
    coverage.notes.push(
      `Commit listing for ${repo.fullName} hit the ${ENGINE_CONFIG.LIST_PAGES_MAX}-page cap; coverage was truncated. Oldest commits in the window may be missed.`
    );
  }

  return {
    allDates,
    commitsForDetail: validCommits,
    totalListed: allDates.length,
  };
}

// ── F4: Budget distribution across repos (Phase 3.4) ─────────────────

/**
 * Distribute detail budget across repos proportional to log(1 + authoredNonMergeCommits).
 * Skips repos with fewer than MIN_COMMITS_PER_REPO (default 3) authored non-merge commits.
 * Spec §3.4 item 4
 */
export function distributeDetailBudget(
  repos: Array<{ fullName: string; totalListed: number }>,
  tierConfig: { detailTotalCap: number; detailPerRepo: number } = {
    detailTotalCap: ENGINE_CONFIG.DETAIL_TOTAL_CAP,
    detailPerRepo: ENGINE_CONFIG.DETAIL_PER_REPO,
  }
): Map<string, number> {
  const budget = new Map<string, number>();

  // Filter repos with >= MIN_COMMITS_PER_REPO (default 3)
  const eligible = repos.filter(
    (r) => r.totalListed >= ENGINE_CONFIG.MIN_COMMITS_PER_REPO
  );

  if (eligible.length === 0) {
    for (const repo of repos) budget.set(repo.fullName, 0);
    return budget;
  }

  // Weight proportional to ln(1 + totalListed)
  const weights = eligible.map((r) => Math.log(1 + r.totalListed));
  const totalWeight = weights.reduce((sum, w) => sum + w, 0);

  let remaining = tierConfig.detailTotalCap;

  for (let i = 0; i < eligible.length; i++) {
    const repo = eligible[i];
    const weight = weights[i];
    const share = totalWeight > 0 ? weight / totalWeight : 1 / eligible.length;
    const allocation = Math.min(
      Math.max(1, Math.round(share * tierConfig.detailTotalCap)),
      tierConfig.detailPerRepo,
      repo.totalListed,
      remaining
    );
    budget.set(repo.fullName, allocation);
    remaining -= allocation;
    if (remaining <= 0) break;
  }

  // Non-eligible repos receive 0 budget
  for (const repo of repos) {
    if (!budget.has(repo.fullName)) {
      budget.set(repo.fullName, 0);
    }
  }

  return budget;
}

// ── F4: Select commits for detail (Phase 3.4) ────────────────────────

/**
 * Choose which commits to fetch in detail using stratified sampling:
 * 1. Drop merge commits, bots, bulk commits, and trivial commits (< MIN_COMMIT_LINES).
 * 2. Stratify by calendar month: pick largest commit per distinct month first.
 * 3. Fill remainder with largest commits not exceeding MAX_COMMIT_LINES.
 * Spec §3.4
 */
export function selectCommitsForDetail(
  commits: ListedCommit[],
  repoBudget = ENGINE_CONFIG.DETAIL_PER_REPO
): ListedCommit[] {
  if (repoBudget <= 0 || commits.length === 0) return [];

  // Step 1: Filter
  const nonMergeNonBot = commits.filter((c) => {
    if (isMergeCommit(c.parentCount)) return false;
    if (c.authorLogin && isBotAuthor(c.authorLogin)) return false;
    return true;
  });

  const candidates = nonMergeNonBot.filter((c) => {
    if (c.changedFiles !== undefined && isBulkCommit(c.changedFiles)) {
      return false;
    }
    const linesChanged = c.additions + c.deletions;
    // If lines info is known from GraphQL, check trivial commits (< MIN_COMMIT_LINES)
    if (
      (c.additions > 0 || c.deletions > 0) &&
      linesChanged < ENGINE_CONFIG.MIN_COMMIT_LINES
    ) {
      return false;
    }
    return true;
  });

  if (candidates.length <= repoBudget) {
    return candidates;
  }

  // Step 2: Stratify by distinct UTC calendar month
  const byMonth = new Map<string, ListedCommit[]>();
  for (const commit of candidates) {
    const d = new Date(commit.date);
    const monthKey = !isNaN(d.getTime())
      ? `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, "0")}`
      : "unknown";
    const list = byMonth.get(monthKey) ?? [];
    list.push(commit);
    byMonth.set(monthKey, list);
  }

  const selectedShas = new Set<string>();
  const selected: ListedCommit[] = [];

  // For each month, pick the largest commit under MAX_COMMIT_LINES
  const monthBest: ListedCommit[] = [];
  for (const monthCommits of byMonth.values()) {
    const sorted = [...monthCommits].sort(
      (a, b) => (b.additions + b.deletions) - (a.additions + a.deletions)
    );
    const best =
      sorted.find(
        (c) => c.additions + c.deletions <= ENGINE_CONFIG.MAX_COMMIT_LINES
      ) ?? sorted[0];
    monthBest.push(best);
  }

  // Sort month best by date descending
  monthBest.sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  for (const commit of monthBest) {
    if (selected.length >= repoBudget) break;
    selected.push(commit);
    selectedShas.add(commit.sha);
  }

  // Step 3: Fill remaining budget with largest remaining commits <= MAX_COMMIT_LINES
  if (selected.length < repoBudget) {
    const remainingSlots = repoBudget - selected.length;
    const remaining = candidates
      .filter((c) => !selectedShas.has(c.sha))
      .filter((c) => c.additions + c.deletions <= ENGINE_CONFIG.MAX_COMMIT_LINES)
      .sort(
        (a, b) => (b.additions + b.deletions) - (a.additions + a.deletions)
      );

    selected.push(...remaining.slice(0, remainingSlots));
  }

  return selected;
}
