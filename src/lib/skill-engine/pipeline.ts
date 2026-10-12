/**
 * pipeline.ts — Main orchestrator for the evidence-fetching pipeline.
 * Spec reference: Agents.md §5 (F0–F12), Phase 3
 *
 * Phase 3 optimizations:
 * - Preflight GET /rate_limit seeds RequestBudget.
 * - Dynamic tier selection (quick, standard, deep) with auto-downgrade when budget is low.
 * - Persistent bundle-level caching: 0 REST requests on repeat runs within 24h.
 * - Batched GraphQL replacing REST:
 *   1. Identity + Collaboration + Contributed repos in 1 query.
 *   2. Owned repos with pagination.
 *   3. Commit listing batched ~5 repos/query.
 *   4. Stack detection batched ~8 repos/query.
 * - Month-stratified commit selection algorithm.
 * - Detail requests cached permanently by sha with concurrency 5.
 * - Clean stop at rate limit floor with partial results.
 *
 * Boundary rule: this module is framework-free. No next/* imports.
 */

import { createGitHubClient, type GitHubClient } from "./github/client";
import {
  resolveIdentity,
  discoverIdentityAndContributionsGraphQL,
  discoverOwnedReposGraphQL,
  mergeAndRankRepos,
} from "./github/discoverRepos";
import {
  listCommitsForRepo,
  listCommitsBatchedGraphQL,
  distributeDetailBudget,
  selectCommitsForDetail,
} from "./github/listCommits";
import { fetchCommitDetails } from "./github/commitDetails";
import {
  detectRepoStack,
  detectStacksBatchedGraphQL,
} from "./github/repoTree";
import { evaluateEvidenceBundle } from "./scoring/evaluator";
import { EvidenceBundleSchema } from "./types";
import type {
  PipelineOptions,
  PipelineResult,
  EvidenceBundle,
  RepoEvidence,
  CoverageInfo,
  CollaborationEvidence,
  JobProgress,
  AnalysisMode,
  DiscoveredRepo,
  ResolvedIdentity,
} from "./types";
import {
  ENGINE_CONFIG,
  ANALYSIS_TIERS,
  DEFAULT_ANALYSIS_TIER,
  type AnalysisTier,
  type TierConfig,
} from "./config";
import {
  getDefaultCacheStore,
  getBundleCacheKey,
  type CacheStore,
} from "./cache";

// ── F10: Collaboration side channel (REST / standalone) ──────────────

export async function fetchCollaboration(
  client: GitHubClient,
  login: string,
  coverage: CoverageInfo
): Promise<CollaborationEvidence> {
  const collab: CollaborationEvidence = {
    prsOpened: 0,
    prsMerged: null, // Not available from contributionsCollection; null, not 0
    reviewsGiven: 0,
    issuesOpened: 0,
    comments: null,  // Not available from this API; null, not 0
    windowMonths: 36,
  };

  if (client.isRateLimited()) {
    coverage.notes.push(
      "Rate limit floor reached before collaboration data fetch."
    );
    return collab;
  }

  try {
    const now = new Date();
    const from = new Date(now);
    from.setMonth(from.getMonth() - ENGINE_CONFIG.LOOKBACK_MONTHS);

    const years = new Set<number>();
    for (
      let d = new Date(from);
      d <= now;
      d.setFullYear(d.getFullYear() + 1)
    ) {
      years.add(d.getFullYear());
    }
    years.add(now.getFullYear());

    for (const year of years) {
      if (client.isRateLimited()) break;

      const yearFrom = new Date(
        Math.max(new Date(`${year}-01-01`).getTime(), from.getTime())
      ).toISOString();
      const yearTo = new Date(
        Math.min(new Date(`${year}-12-31`).getTime(), now.getTime())
      ).toISOString();

      try {
        const result: {
          user: {
            contributionsCollection: {
              totalPullRequestContributions: number;
              totalPullRequestReviewContributions: number;
              totalIssueContributions: number;
              totalCommitContributions: number;
            };
          };
        } = await client.graphqlClient(
          `
          query($login: String!, $from: DateTime!, $to: DateTime!) {
            user(login: $login) {
              contributionsCollection(from: $from, to: $to) {
                totalPullRequestContributions
                totalPullRequestReviewContributions
                totalIssueContributions
                totalCommitContributions
              }
            }
          }
        `,
          { login, from: yearFrom, to: yearTo }
        );

        const cc = result.user.contributionsCollection;
        collab.prsOpened += cc.totalPullRequestContributions;
        collab.reviewsGiven += cc.totalPullRequestReviewContributions;
        collab.issuesOpened += cc.totalIssueContributions;
      } catch (gqlError) {
        console.warn(
          `[skill-engine] Collaboration data fetch failed for year ${year}:`,
          gqlError
        );
      }
    }
  } catch (error) {
    console.warn("[skill-engine] Collaboration fetch error:", error);
    coverage.notes.push("Could not fetch collaboration data.");
  }

  return collab;
}

// ── Tier Auto-Downgrade Helper ───────────────────────────────────────

function selectEffectiveTier(
  requestedTier: AnalysisTier,
  availableRestBudget: number,
  coverage: CoverageInfo
): { tier: AnalysisTier; config: TierConfig } {
  let tier = requestedTier;
  let config = ANALYSIS_TIERS[tier];

  // If estimated worst-case requests exceed available budget, auto-downgrade
  if (config.detailTotalCap > availableRestBudget) {
    if (tier === "deep") {
      tier = "standard";
      config = ANALYSIS_TIERS.standard;
    }
    if (config.detailTotalCap > availableRestBudget && tier === "standard") {
      tier = "quick";
      config = ANALYSIS_TIERS.quick;
    }

    if (config.detailTotalCap > availableRestBudget) {
      coverage.notes.push(
        `Low GitHub API rate limit remaining (${availableRestBudget} available vs ${config.detailTotalCap} required). Running on '${tier}' tier with potential truncation.`
      );
    } else {
      coverage.notes.push(
        `Analysis tier automatically downgraded from '${requestedTier}' to '${tier}' to stay within remaining rate limit quota (${availableRestBudget} requests available).`
      );
    }
  }

  return { tier, config };
}

// ── Main pipeline ────────────────────────────────────────────────────

/**
 * Run the full evidence-fetching pipeline.
 *
 * Takes plain arguments (token, target, options) and returns plain data.
 * No Next.js or framework imports — this is reusable by the main site.
 */
export async function runPipeline(
  options: PipelineOptions
): Promise<PipelineResult> {
  const {
    token,
    target,
    mode,
    tier: requestedTier = DEFAULT_ANALYSIS_TIER,
    uid,
    cacheStore = getDefaultCacheStore(),
    forceRefresh = false,
    fetch: customFetch,
    onProgress,
  } = options;

  const progress = (stage: string, done: number, total: number) => {
    if (onProgress) onProgress({ stage, done, total });
  };

  const targetKey =
    target.type === "repo" && target.repo
      ? `repo:${target.owner}/${target.repo}`
      : `user:${target.targetLogin}`;
  const isPrivate = mode === "public+private";

  // ── Step 0: Check Bundle-Level Cache (Phase 3.5) ────────────────────
  const bundleCacheKey = getBundleCacheKey(targetKey, requestedTier, isPrivate, uid);

  if (!forceRefresh) {
    try {
      const cachedBundle = await cacheStore.get<EvidenceBundle>(bundleCacheKey);
      if (cachedBundle) {
        progress("Loaded from cache", 1, 1);
        const profile = evaluateEvidenceBundle(cachedBundle);
        const client = createGitHubClient({ token, fetch: customFetch });
        client.recordCacheHit();
        return {
          bundle: cachedBundle,
          requestLog: client.requestLog(),
          profile,
        };
      }
    } catch (cacheErr) {
      console.warn("[skill-engine] Bundle cache read failed:", cacheErr);
    }
  }

  // Initialize coverage tracking
  const coverage: CoverageInfo = {
    reposDiscovered: 0,
    reposAnalyzed: 0,
    commitsListed: 0,
    commitsDetailed: 0,
    truncated: false,
    notes: [],
  };

  coverage.notes.push(
    "Commits made under an email not linked to the GitHub account may be missed."
  );

  // Create GitHub client
  const client = createGitHubClient({ token, fetch: customFetch });

  // ── Step 1: Preflight GET /rate_limit (Phase 3.1) ────────────────────
  progress("Checking API rate limit", 0, 1);
  const preflightRes = await client.preflight();
  progress("Checking API rate limit", 1, 1);

  // ── Step 2: Determine Tier & Auto-downgrade (Phase 3.1) ──────────────
  const initialFloor = ANALYSIS_TIERS[requestedTier].rateLimitFloor;
  const availableBudget = preflightRes.restRemaining - initialFloor;
  const { tier, config: tierConfig } = selectEffectiveTier(
    requestedTier,
    availableBudget,
    coverage
  );
  client.setFloor(tierConfig.rateLimitFloor);

  // ── Step 3: F1 Resolve Identity + Collab + Contributed Repos (Phase 3.3.1)
  progress("Resolving identity and activity", 0, 1);

  let identity: ResolvedIdentity;
  let collaboration: CollaborationEvidence;
  let contributedRepos: DiscoveredRepo[] = [];

  try {
    const gqlResult = await discoverIdentityAndContributionsGraphQL(
      client,
      target.targetLogin
    );
    identity = gqlResult.identity;
    collaboration = gqlResult.collaboration;
    contributedRepos = gqlResult.contributedRepos;
  } catch (gqlErr) {
    console.warn(
      `[skill-engine] Batched identity GraphQL failed for ${target.targetLogin}, using REST fallback:`,
      gqlErr
    );
    identity = await resolveIdentity(client, target.targetLogin);
    collaboration = await fetchCollaboration(client, identity.login, coverage);
  }

  progress("Resolving identity and activity", 1, 1);

  // Verify authenticatedLogin matches target identity for private repos
  let effectiveMode: AnalysisMode = mode;
  let verifiedAuthLogin: string | undefined = undefined;

  if (mode === "public+private") {
    if (
      options.authenticatedLogin &&
      options.authenticatedLogin.toLowerCase() === identity.login.toLowerCase()
    ) {
      verifiedAuthLogin = options.authenticatedLogin;
    } else {
      effectiveMode = "public";
      coverage.notes.push(
        `Private repos excluded: authenticated account does not match target user '${identity.login}'.`
      );
    }
  }

  // ── Step 4: F2 Discover Repos (Phase 3.3.2) ─────────────────────────
  progress("Discovering repositories", 0, 1);

  let discoveredRepos: DiscoveredRepo[] = [];

  if (target.type === "repo" && target.repo) {
    // Single repo mode
    try {
      const { data: repoData } = await client.rest.repos.get({
        owner: target.owner,
        repo: target.repo,
      });

      if (repoData.private && effectiveMode !== "public+private") {
        discoveredRepos = [];
        coverage.notes.push(
          `Private repository ${target.owner}/${target.repo} excluded: authenticated account does not match target.`
        );
      } else {
        discoveredRepos = [
          {
            fullName: repoData.full_name,
            owner: repoData.owner?.login ?? target.owner,
            repo: repoData.name,
            isPrivate: repoData.private,
            isFork: repoData.fork,
            defaultBranch: repoData.default_branch ?? "main",
            authoredCommitCount: 0,
            lastAuthoredCommitDate: repoData.pushed_at ?? "",
          },
        ];
        coverage.reposDiscovered = 1;
        coverage.reposAnalyzed = 1;
      }
    } catch (error) {
      throw new Error(
        `Could not access repository ${target.owner}/${target.repo}: ${error}`
      );
    }
  } else {
    // User profile mode — GraphQL owned repos + merge with contributed
    let ownedRepos: DiscoveredRepo[] = [];
    try {
      ownedRepos = await discoverOwnedReposGraphQL(
        client,
        identity.login,
        effectiveMode,
        options.includeForks
      );
    } catch {
      // Fallback
      ownedRepos = [];
    }

    coverage.reposDiscovered = new Set([
      ...ownedRepos.map((r) => r.fullName),
      ...contributedRepos.map((r) => r.fullName),
    ]).size;

    const filtered = mergeAndRankRepos(
      ownedRepos,
      contributedRepos,
      options.includeForks
    );

    discoveredRepos = filtered.slice(0, tierConfig.maxRepos);
    const dropped = filtered.length - discoveredRepos.length;
    if (dropped > 0) {
      coverage.notes.push(
        `Dropped ${dropped} repos beyond the top ${tierConfig.maxRepos} by commit activity.`
      );
    }
    coverage.reposAnalyzed = discoveredRepos.length;
  }

  progress("Discovering repositories", 1, 1);

  if (discoveredRepos.length === 0) {
    const emptyBundle: EvidenceBundle = {
      schemaVersion: 2,
      target: { login: identity.login, id: identity.id, mode: effectiveMode },
      fetchedAt: new Date().toISOString(),
      coverage: {
        ...coverage,
        notes: [...coverage.notes, "No repositories found for this user."],
      },
      repos: [],
      collaboration,
    };
    const profile = evaluateEvidenceBundle(emptyBundle);
    return { bundle: emptyBundle, requestLog: client.requestLog(), profile };
  }

  // ── Step 5: F3 Commit Listing via Batched GraphQL (Phase 3.3.3) ─────
  progress("Listing commits across repositories", 0, discoveredRepos.length);

  const commitListMap = await listCommitsBatchedGraphQL(
    client,
    discoveredRepos,
    {
      userNodeId: identity.userNodeId,
      targetLogin: identity.login,
      userEmails: options.userEmails,
    },
    coverage,
    tierConfig
  );

  // Update authored commit counts on discovered repos
  for (const repo of discoveredRepos) {
    const res = commitListMap.get(repo.fullName);
    if (res) {
      repo.authoredCommitCount = res.totalListed;
    }
  }

  progress("Listing commits across repositories", discoveredRepos.length, discoveredRepos.length);

  // ── Step 6: F4 Budget Distribution & Selection (Phase 3.4) ──────────
  const budgetMap = distributeDetailBudget(
    discoveredRepos.map((r) => ({
      fullName: r.fullName,
      totalListed: commitListMap.get(r.fullName)?.totalListed ?? 0,
    })),
    tierConfig
  );

  const reposToDetail = discoveredRepos.filter(
    (r) => (budgetMap.get(r.fullName) ?? 0) > 0
  );

  // ── Step 7: F8 Stack Detection via Batched GraphQL (Phase 3.3.4) ────
  progress("Detecting repository stacks", 0, reposToDetail.length);

  let stackMap = new Map<string, string[]>();
  if (!client.isRateLimited()) {
    stackMap = await detectStacksBatchedGraphQL(
      client,
      reposToDetail,
      coverage
    );
  }

  progress("Detecting repository stacks", reposToDetail.length, reposToDetail.length);

  // ── Step 8: F5 Fetch Commit Details with Cache & Concurrency 5 (Phase 3.4/3.5)
  progress("Fetching detailed commit changes", 0, reposToDetail.length);

  const repoEvidenceList: RepoEvidence[] = [];

  for (let i = 0; i < discoveredRepos.length; i++) {
    const repo = discoveredRepos[i];
    const listRes = commitListMap.get(repo.fullName);
    const budget = budgetMap.get(repo.fullName) ?? 0;
    const allDates = listRes?.allDates ?? [];
    const stack = stackMap.get(repo.fullName) ?? [];

    if (client.isRateLimited()) {
      coverage.truncated = true;
      coverage.notes.push(
        `Rate limit floor reached before detail fetch for ${repo.fullName}.`
      );
    }

    let detailedCommits: Awaited<ReturnType<typeof fetchCommitDetails>> = [];

    if (budget > 0 && listRes && listRes.commitsForDetail.length > 0 && !client.isRateLimited()) {
      const selected = selectCommitsForDetail(
        listRes.commitsForDetail,
        budget
      );

      detailedCommits = await fetchCommitDetails(
        client,
        repo.owner,
        repo.repo,
        selected,
        budget,
        coverage,
        {
          isPrivate: repo.isPrivate,
          uid,
          repoStack: stack,
          cacheStore,
        }
      );
    }

    const repoEvidence: RepoEvidence = {
      fullName: repo.fullName,
      isPrivate: repo.isPrivate,
      isFork: repo.isFork,
      stack,
      commitDates: allDates,
      commits: detailedCommits,
      sampling: {
        listedNonMerge: listRes?.totalListed ?? 0,
        detailed: detailedCommits.length,
      },
    };

    repoEvidenceList.push(repoEvidence);
    progress("Fetching detailed commit changes", i + 1, discoveredRepos.length);
  }

  // ── Step 9: Assemble Output & Evaluate ──────────────────────────────
  progress("Evaluating skill profile", 0, 1);

  const bundle: EvidenceBundle = {
    schemaVersion: 2,
    target: { login: identity.login, id: identity.id, mode: effectiveMode },
    fetchedAt: new Date().toISOString(),
    coverage,
    repos: repoEvidenceList,
    collaboration,
  };

  try {
    EvidenceBundleSchema.parse(bundle);
  } catch (validationError) {
    console.warn("[skill-engine] Bundle validation warning:", validationError);
  }

  const profile = evaluateEvidenceBundle(bundle);

  // ── Step 10: Store in Bundle Cache (Phase 3.5) ──────────────────────
  try {
    const bundleTtlMs = ENGINE_CONFIG.BUNDLE_CACHE_HOURS * 60 * 60 * 1000;
    await cacheStore.set(bundleCacheKey, bundle, bundleTtlMs);
  } catch (cacheSetErr) {
    console.warn("[skill-engine] Failed to cache bundle:", cacheSetErr);
  }

  progress("Complete", 1, 1);

  return {
    bundle,
    requestLog: client.requestLog(),
    profile,
  };
}
