/**
 * discoverRepos.ts — Repo discovery (F1 identity + F2 repos)
 * Spec reference: Agents.md §5 F1, F2, Phase 3.3
 *
 * Phase 3 optimizations:
 * - Batched GraphQL for identity + collaboration + contributed repos in 1 query.
 * - Batched GraphQL for owned repos with pagination.
 * - Merges contributed commit counts into owned entries (test 0.11).
 * - Graceful fallback to REST when GraphQL is unavailable or rate-limited.
 */

import type { GitHubClient } from "./client";
import type {
  ResolvedIdentity,
  DiscoveredRepo,
  AnalysisMode,
  CoverageInfo,
  CollaborationEvidence,
} from "../types";
import { ENGINE_CONFIG } from "../config";

// ── F1: Resolve identity (REST fallback) ─────────────────────────────

/**
 * Resolve a GitHub login to a verified identity via REST.
 * Rejects bots and organizations.
 */
export async function resolveIdentity(
  client: GitHubClient,
  login: string
): Promise<ResolvedIdentity> {
  const { data } = await client.rest.users.getByUsername({ username: login });

  if (data.type === "Bot" || data.login.endsWith("[bot]")) {
    throw new Error(`Cannot analyze bot account: ${login}`);
  }

  if (data.type === "Organization") {
    throw new Error(
      `Cannot analyze organization account: ${login}. Please specify a user.`
    );
  }

  return {
    login: data.login,
    id: data.id,
    type: data.type,
    userNodeId: data.node_id,
  };
}

// ── F2: Discover repos ───────────────────────────────────────────────

export interface DiscoverOptions {
  login: string;
  mode: AnalysisMode;
  authenticatedLogin?: string;
  includeForks?: boolean;
}

/**
 * Merge owned and contributed repos, filter forks, and rank by commit activity.
 * When a repo appears in both owned and contributed lists, merge the commit
 * counts from the contributed entry INTO the owned entry (test 0.11).
 */
export function mergeAndRankRepos(
  ownedRepos: DiscoveredRepo[],
  contributedRepos: DiscoveredRepo[],
  includeForks = false
): DiscoveredRepo[] {
  const repos: Map<string, DiscoveredRepo> = new Map();

  for (const repo of ownedRepos) {
    repos.set(repo.fullName, repo);
  }

  for (const repo of contributedRepos) {
    const existing = repos.get(repo.fullName);
    if (existing) {
      // Merge: add contributed commit counts into the owned entry
      existing.authoredCommitCount += repo.authoredCommitCount;
      // Keep the more recent date
      if (
        repo.lastAuthoredCommitDate &&
        repo.lastAuthoredCommitDate > existing.lastAuthoredCommitDate
      ) {
        existing.lastAuthoredCommitDate = repo.lastAuthoredCommitDate;
      }
    } else {
      repos.set(repo.fullName, repo);
    }
  }

  let filtered = Array.from(repos.values());

  if (!includeForks) {
    filtered = filtered.filter((r) => !r.isFork);
  }

  filtered.sort((a, b) => {
    if (b.authoredCommitCount !== a.authoredCommitCount) {
      return b.authoredCommitCount - a.authoredCommitCount;
    }
    return b.lastAuthoredCommitDate.localeCompare(a.lastAuthoredCommitDate);
  });

  return filtered;
}

/**
 * Combined GraphQL Query 1: Identity + Collaboration + Contributed Repos
 * Spec §3.3.1
 */
export async function discoverIdentityAndContributionsGraphQL(
  client: GitHubClient,
  login: string
): Promise<{
  identity: ResolvedIdentity;
  collaboration: CollaborationEvidence;
  contributedRepos: DiscoveredRepo[];
}> {
  const now = new Date();
  const lookbackDate = new Date(now);
  lookbackDate.setMonth(lookbackDate.getMonth() - ENGINE_CONFIG.LOOKBACK_MONTHS);

  const years: number[] = [];
  for (let y = lookbackDate.getFullYear(); y <= now.getFullYear(); y++) {
    years.push(y);
  }

  // Build aliased query fragments for each year
  const yearFields = years
    .map(
      (year) => `
    y${year}: contributionsCollection(from: $from_${year}, to: $to_${year}) {
      totalCommitContributions
      totalPullRequestContributions
      totalPullRequestReviewContributions
      totalIssueContributions
      commitContributionsByRepository(maxRepositories: 100) {
        repository {
          nameWithOwner
          owner { login }
          name
          isPrivate
          isFork
          defaultBranchRef { name }
          pushedAt
        }
        contributions {
          totalCount
        }
      }
    }
  `
    )
    .join("\n");

  const queryVarsDef = years
    .map((year) => `$from_${year}: DateTime!, $to_${year}: DateTime!`)
    .join(", ");

  const query = `
    query($login: String!, ${queryVarsDef}) {
      repositoryOwner(login: $login) {
        __typename
        id
        login
        ... on User {
          databaseId
          ${yearFields}
        }
        ... on Organization {
          id
        }
      }
      rateLimit {
        cost
        remaining
        resetAt
      }
    }
  `;

  const variables: Record<string, unknown> = { login };
  for (const year of years) {
    const from = new Date(
      Math.max(new Date(`${year}-01-01T00:00:00Z`).getTime(), lookbackDate.getTime())
    ).toISOString();
    const to = new Date(
      Math.min(new Date(`${year}-12-31T23:59:59Z`).getTime(), now.getTime())
    ).toISOString();
    variables[`from_${year}`] = from;
    variables[`to_${year}`] = to;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await client.graphqlClient(query, variables);

  const owner = data?.repositoryOwner;
  if (!owner) {
    throw new Error(`User not found: ${login}`);
  }

  if (owner.__typename === "Organization") {
    throw new Error(
      `Cannot analyze organization account: ${login}. Please specify a user.`
    );
  }

  if (owner.login.endsWith("[bot]") || owner.login === "ghost") {
    throw new Error(`Cannot analyze bot account: ${login}`);
  }

  const identity: ResolvedIdentity = {
    login: owner.login,
    id: owner.databaseId ?? 0,
    type: "User",
    userNodeId: owner.id,
  };

  const collab: CollaborationEvidence = {
    prsOpened: 0,
    prsMerged: null, // unavailable from contributionsCollection
    reviewsGiven: 0,
    issuesOpened: 0,
    comments: null,  // unavailable from contributionsCollection
    windowMonths: 36,
  };

  const contributedMap = new Map<string, DiscoveredRepo>();

  for (const year of years) {
    const yearData = owner[`y${year}`];
    if (!yearData) continue;

    collab.prsOpened += yearData.totalPullRequestContributions ?? 0;
    collab.reviewsGiven += yearData.totalPullRequestReviewContributions ?? 0;
    collab.issuesOpened += yearData.totalIssueContributions ?? 0;

    const repoContribs = yearData.commitContributionsByRepository ?? [];
    for (const entry of repoContribs) {
      const repo = entry.repository;
      if (!repo) continue;
      const count = entry.contributions?.totalCount ?? 0;
      const existing = contributedMap.get(repo.nameWithOwner);
      if (existing) {
        existing.authoredCommitCount += count;
      } else {
        contributedMap.set(repo.nameWithOwner, {
          fullName: repo.nameWithOwner,
          owner: repo.owner.login,
          repo: repo.name,
          isPrivate: repo.isPrivate,
          isFork: repo.isFork,
          defaultBranch: repo.defaultBranchRef?.name ?? "main",
          authoredCommitCount: count,
          lastAuthoredCommitDate: repo.pushedAt ?? "",
        });
      }
    }
  }

  return {
    identity,
    collaboration: collab,
    contributedRepos: Array.from(contributedMap.values()),
  };
}

/**
 * Query 2: Owned repos via GraphQL with pagination
 * Spec §3.3.2
 */
export async function discoverOwnedReposGraphQL(
  client: GitHubClient,
  login: string,
  mode: AnalysisMode,
  includeForks = false
): Promise<DiscoveredRepo[]> {
  const repos: DiscoveredRepo[] = [];
  let cursor: string | null = null;
  let hasNextPage = true;
  let pagesFetched = 0;
  const MAX_PAGES = 10; // 100 per page = 1000 repos max

  while (hasNextPage && pagesFetched < MAX_PAGES) {
    if (client.isRateLimited()) break;

    const query = `
      query($login: String!, $cursor: String) {
        user(login: $login) {
          repositories(
            first: 100
            after: $cursor
            ownerAffiliations: [OWNER]
            isFork: ${includeForks ? "null" : "false"}
            orderBy: { field: PUSHED_AT, direction: DESC }
          ) {
            pageInfo {
              hasNextPage
              endCursor
            }
            nodes {
              nameWithOwner
              name
              owner { login }
              isPrivate
              isFork
              pushedAt
              defaultBranchRef { name }
            }
          }
        }
        rateLimit {
          cost
          remaining
          resetAt
        }
      }
    `;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data: any = await client.graphqlClient(query, {
      login,
      cursor,
    });

    const repoList = data?.user?.repositories;
    if (!repoList) break;

    const nodes = repoList.nodes ?? [];
    for (const repo of nodes) {
      if (mode === "public" && repo.isPrivate) continue;
      if (!includeForks && repo.isFork) continue;

      repos.push({
        fullName: repo.nameWithOwner,
        owner: repo.owner.login,
        repo: repo.name,
        isPrivate: repo.isPrivate,
        isFork: repo.isFork,
        defaultBranch: repo.defaultBranchRef?.name ?? "main",
        authoredCommitCount: 0,
        lastAuthoredCommitDate: repo.pushedAt ?? "",
      });
    }

    hasNextPage = repoList.pageInfo?.hasNextPage ?? false;
    cursor = repoList.pageInfo?.endCursor ?? null;
    pagesFetched++;
  }

  return repos;
}

/**
 * Discover repositories for a user, combining owned + contributed-to repos.
 * Uses batched GraphQL (Phase 3.3) with REST fallback.
 */
export async function discoverRepos(
  client: GitHubClient,
  options: DiscoverOptions,
  coverage: CoverageInfo,
  maxRepos = ENGINE_CONFIG.MAX_REPOS
): Promise<DiscoveredRepo[]> {
  const { login, mode, includeForks } = options;

  let ownedRepos: DiscoveredRepo[] = [];
  let contributedRepos: DiscoveredRepo[] = [];

  // Try GraphQL path first
  try {
    if (!client.isRateLimited()) {
      ownedRepos = await discoverOwnedReposGraphQL(
        client,
        login,
        mode,
        includeForks
      );
    }
  } catch (err) {
    console.warn(`[skill-engine] GraphQL owned repos failed for ${login}, falling back to REST:`, err);
    ownedRepos = await fetchOwnedReposREST(client, login, mode, options.authenticatedLogin);
  }

  if (ownedRepos.length === 0 && !client.isRateLimited()) {
    ownedRepos = await fetchOwnedReposREST(client, login, mode, options.authenticatedLogin);
  }

  coverage.reposDiscovered = new Set([
    ...ownedRepos.map((r) => r.fullName),
    ...contributedRepos.map((r) => r.fullName),
  ]).size;

  const filtered = mergeAndRankRepos(ownedRepos, contributedRepos, includeForks);
  const kept = filtered.slice(0, maxRepos);
  const dropped = filtered.length - kept.length;
  if (dropped > 0) {
    coverage.notes.push(
      `Dropped ${dropped} repos beyond the top ${maxRepos} by commit activity.`
    );
  }

  coverage.reposAnalyzed = kept.length;
  return kept;
}

// ── REST Fallback for Owned Repos ────────────────────────────────────

async function fetchOwnedReposREST(
  client: GitHubClient,
  login: string,
  mode: AnalysisMode,
  authenticatedLogin?: string
): Promise<DiscoveredRepo[]> {
  const repos: DiscoveredRepo[] = [];

  try {
    if (
      mode === "public+private" &&
      authenticatedLogin &&
      authenticatedLogin.toLowerCase() === login.toLowerCase()
    ) {
      const { data } = await client.rest.repos.listForAuthenticatedUser({
        affiliation: "owner",
        visibility: "all",
        per_page: 100,
        sort: "pushed",
      });

      for (const repo of data) {
        repos.push({
          fullName: repo.full_name,
          owner: repo.owner?.login ?? login,
          repo: repo.name,
          isPrivate: repo.private,
          isFork: repo.fork,
          defaultBranch: repo.default_branch ?? "main",
          authoredCommitCount: 0,
          lastAuthoredCommitDate: repo.pushed_at ?? "",
        });
      }
    } else {
      const { data } = await client.rest.repos.listForUser({
        username: login,
        type: "owner",
        per_page: 100,
        sort: "pushed",
      });

      for (const repo of data) {
        repos.push({
          fullName: repo.full_name,
          owner: repo.owner.login,
          repo: repo.name,
          isPrivate: repo.private,
          isFork: repo.fork,
          defaultBranch: repo.default_branch ?? "main",
          authoredCommitCount: 0,
          lastAuthoredCommitDate: repo.pushed_at ?? "",
        });
      }
    }
  } catch (error) {
    console.warn(`[skill-engine] Error fetching owned repos via REST for ${login}:`, error);
  }

  return repos;
}
