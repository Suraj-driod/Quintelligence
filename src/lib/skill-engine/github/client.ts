/**
 * client.ts — Octokit factory with throttling, retry, caching, and counters.
 * Spec reference: Agents.md §5 F11, Phase 1.3, Phase 3.1
 *
 * Requirements:
 * - No module-level mutable state. Each client has its own RequestBudget.
 * - Uses octokit.hook.wrap("request", …) for REST call interception.
 * - Tracks endpoints by route template, not raw URL.
 * - Accepts injected fetch for both REST and GraphQL.
 * - GraphQL requests are budget-tracked and parsed for rateLimit { cost remaining resetAt }.
 * - GET /rate_limit preflight seeds REST and GraphQL budgets without consuming REST quota.
 * - Rate limit floor is dynamically configurable per tier.
 */

import { Octokit } from "@octokit/rest";
import { graphql } from "@octokit/graphql";
import { throttling } from "@octokit/plugin-throttling";
import { retry } from "@octokit/plugin-retry";
import { ENGINE_CONFIG } from "../config";
import type { RequestLog } from "../types";

// ── Throttled Octokit class ──────────────────────────────────────────

const ThrottledOctokit = Octokit.plugin(throttling, retry);

// ── Per-instance request budget ──────────────────────────────────────

interface RequestBudgetInternal {
  totalRequests: number;
  restUsed: number;
  restRemaining: number;
  restResetAt: string;
  graphqlPointsUsed: number;
  graphqlRemaining: number;
  graphqlResetAt: string;
  cacheHits: number;
  byEndpoint: Record<string, number>;
  floor: number;
}

function createBudget(initialFloor = ENGINE_CONFIG.RATE_LIMIT_FLOOR): RequestBudgetInternal {
  return {
    totalRequests: 0,
    restUsed: 0,
    restRemaining: 5000,
    restResetAt: "",
    graphqlPointsUsed: 0,
    graphqlRemaining: 5000,
    graphqlResetAt: "",
    cacheHits: 0,
    byEndpoint: {},
    floor: initialFloor,
  };
}

// ── Track endpoint usage by route template ───────────────────────────

function normalizeEndpoint(url: string): string {
  return url
    .replace(/\/[0-9a-f]{40}/g, "/{sha}")
    .replace(/\/\d+/g, "/{id}")
    .split("?")[0];
}

// ── Create client ────────────────────────────────────────────────────

export interface GitHubClient {
  rest: InstanceType<typeof ThrottledOctokit>;
  graphqlClient: <T = unknown>(
    query: string,
    variables?: Record<string, unknown>
  ) => Promise<T>;
  requestLog: () => RequestLog;
  isRateLimited: () => boolean;
  setFloor: (floor: number) => void;
  preflight: () => Promise<{ restRemaining: number; graphqlRemaining: number }>;
  recordCacheHit: () => void;
  getRemaining: () => number;
}

export type GitHubClientOptions =
  | string
  | {
      token?: string;
      fetch?: typeof globalThis.fetch;
      floor?: number;
    };

export function createGitHubClient(
  tokenOrOptions?: GitHubClientOptions
): GitHubClient {
  const token =
    typeof tokenOrOptions === "string"
      ? tokenOrOptions
      : tokenOrOptions?.token ?? "";
  const customFetch =
    typeof tokenOrOptions === "object" ? tokenOrOptions?.fetch : undefined;
  const initialFloor =
    typeof tokenOrOptions === "object" && tokenOrOptions?.floor !== undefined
      ? tokenOrOptions.floor
      : ENGINE_CONFIG.RATE_LIMIT_FLOOR;
  const authToken = token && token.trim() ? token.trim() : undefined;

  // Per-instance state — never module-level
  const budget = createBudget(initialFloor);

  const rest = new ThrottledOctokit({
    ...(authToken ? { auth: authToken } : {}),
    throttle: {
      onRateLimit: (
        retryAfter: number,
        options: { method: string; url: string; request: { retryCount: number } }
      ) => {
        console.warn(
          `[skill-engine] Rate limit hit for ${options.method} ${options.url}. Retry after ${retryAfter}s`
        );
        // Retry once
        if (options.request.retryCount === 0) {
          return true;
        }
        return false;
      },
      onSecondaryRateLimit: (
        retryAfter: number,
        options: { method: string; url: string; request: { retryCount: number } }
      ) => {
        console.warn(
          `[skill-engine] Secondary rate limit for ${options.method} ${options.url}. Retry after ${retryAfter}s`
        );
        // Do not retry secondary rate limits
        return false;
      },
    },
    retry: {
      doNotRetry: [429],
    },
    request: {
      ...(customFetch ? { fetch: customFetch } : {}),
    },
  });

  // Use hook.wrap to intercept ALL REST requests
  rest.hook.wrap("request", async (request, options) => {
    const url = (options.url as string) || "";

    budget.totalRequests++;
    budget.restUsed++;

    // Track by route template
    const endpoint = normalizeEndpoint(url);
    budget.byEndpoint[endpoint] = (budget.byEndpoint[endpoint] ?? 0) + 1;

    const response = await request(options);

    // Update rate limit counters from response headers
    const headers = (response as unknown as Record<string, unknown>)?.headers as
      | Record<string, string>
      | undefined;
    if (headers) {
      const remaining = headers["x-ratelimit-remaining"];
      const reset = headers["x-ratelimit-reset"];
      if (remaining !== undefined) {
        budget.restRemaining = parseInt(String(remaining), 10);
      }
      if (reset) {
        budget.restResetAt = new Date(
          parseInt(String(reset), 10) * 1000
        ).toISOString();
      }
    }

    return response;
  });

  // GraphQL client setup
  const graphqlDefaults: Record<string, unknown> = {};
  if (authToken) {
    graphqlDefaults.headers = {
      authorization: `token ${authToken}`,
    };
  }
  if (customFetch) {
    graphqlDefaults.request = {
      fetch: customFetch,
    };
  }

  const baseGraphql =
    Object.keys(graphqlDefaults).length > 0
      ? graphql.defaults(graphqlDefaults)
      : graphql;

  const wrappedGraphql = async <T = unknown>(
    query: string,
    variables?: Record<string, unknown>
  ): Promise<T> => {
    budget.totalRequests++;
    budget.byEndpoint["graphql"] = (budget.byEndpoint["graphql"] ?? 0) + 1;

    const result = (await baseGraphql(query, variables)) as T;

    // Parse rateLimit if present in result data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const rateLimit = (result as any)?.rateLimit;
    if (rateLimit) {
      if (typeof rateLimit.cost === "number") {
        budget.graphqlPointsUsed += rateLimit.cost;
      }
      if (typeof rateLimit.remaining === "number") {
        budget.graphqlRemaining = rateLimit.remaining;
      }
      if (rateLimit.resetAt) {
        budget.graphqlResetAt = String(rateLimit.resetAt);
      }
    }

    return result;
  };

  const preflight = async (): Promise<{ restRemaining: number; graphqlRemaining: number }> => {
    try {
      const res = await rest.rateLimit.get();
      if (res?.data?.resources) {
        const core = res.data.resources.core;
        if (core) {
          budget.restRemaining = core.remaining;
          budget.restResetAt = new Date(core.reset * 1000).toISOString();
        }
        const gql = res.data.resources.graphql;
        if (gql) {
          budget.graphqlRemaining = gql.remaining;
          budget.graphqlResetAt = new Date(gql.reset * 1000).toISOString();
        }
      }
    } catch (err) {
      console.warn("[skill-engine] Preflight rate limit check failed:", err);
    }
    return {
      restRemaining: budget.restRemaining,
      graphqlRemaining: budget.graphqlRemaining,
    };
  };

  return {
    rest,
    graphqlClient: wrappedGraphql,
    requestLog: (): RequestLog => ({
      totalRequests: budget.totalRequests,
      restUsed: budget.restUsed,
      restRemaining: budget.restRemaining,
      restResetAt: budget.restResetAt,
      graphqlPointsUsed: budget.graphqlPointsUsed,
      graphqlRemaining: budget.graphqlRemaining,
      graphqlResetAt: budget.graphqlResetAt,
      cacheHits: budget.cacheHits,
      rateLimitRemaining: budget.restRemaining,
      rateLimitReset: budget.restResetAt,
      byEndpoint: { ...budget.byEndpoint },
      floor: budget.floor,
    }),
    isRateLimited: () => budget.restRemaining < budget.floor,
    setFloor: (floor: number) => {
      budget.floor = floor;
    },
    preflight,
    recordCacheHit: () => {
      budget.cacheHits++;
    },
    getRemaining: () => budget.restRemaining,
  };
}
