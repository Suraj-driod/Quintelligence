/**
 * scripts/live-budget-check.ts — Live budget and rate limit validation script.
 * Spec reference: Phase 3, Phase 5.2
 *
 * Usage:
 *   npx tsx scripts/live-budget-check.ts <githubLogin> [tier]
 *
 * Calls GET /rate_limit before and after a run and prints:
 * - Engine-counted REST/GraphQL usage vs actual delta from GitHub API
 * - Per-endpoint counts
 * - Cache hits
 * - Elapsed time
 * Exits non-zero if counted vs actual differ by more than 5 requests or 5%.
 */

import { runPipeline } from "../src/lib/skill-engine/pipeline";
import { parseGitHubInput } from "../src/lib/skill-engine/github/parseInput";
import type { AnalysisTier } from "../src/lib/skill-engine/config";
import { Octokit } from "@octokit/rest";

async function getActualRateLimit(token: string) {
  const octokit = new Octokit({ auth: token });
  const { data } = await octokit.rest.rateLimit.get();
  return {
    coreRemaining: data.resources.core.remaining,
    graphqlRemaining: data.resources.graphql?.remaining ?? 0,
  };
}

async function main() {
  const args = process.argv.slice(2);
  const login = args[0];
  const tier = (args[1] || "standard") as AnalysisTier;

  if (!login) {
    console.error("Usage: npx tsx scripts/live-budget-check.ts <githubLogin> [tier]");
    process.exit(1);
  }

  // Attempt to load .env.local / .env if process.env token is missing
  if (!process.env.GITHUB_TOKEN && !process.env.GITHUB_SERVER_TOKEN) {
    try {
      if (typeof process.loadEnvFile === "function") {
        process.loadEnvFile(".env.local");
      }
    } catch {
      try {
        if (typeof process.loadEnvFile === "function") {
          process.loadEnvFile(".env");
        }
      } catch {
        // ignore missing env files
      }
    }
  }

  const token = process.env.GITHUB_TOKEN || process.env.GITHUB_SERVER_TOKEN || "";
  if (!token) {
    console.error("Error: GITHUB_TOKEN or GITHUB_SERVER_TOKEN env variable is required.");
    process.exit(1);
  }

  console.log(`Starting live budget check for '${login}' (tier: ${tier})...`);

  // 1. Fetch initial rate limits
  const before = await getActualRateLimit(token);
  console.log(`Initial rate limits -> Core REST: ${before.coreRemaining}, GraphQL: ${before.graphqlRemaining}`);

  const startTime = Date.now();
  const target = parseGitHubInput(`https://github.com/${login}`);

  // 2. Run pipeline
  const result = await runPipeline({
    token,
    target,
    mode: "public",
    tier,
    forceRefresh: true, // test live requests
  });

  const elapsedMs = Date.now() - startTime;

  // 3. Fetch after rate limits
  const after = await getActualRateLimit(token);
  console.log(`Final rate limits   -> Core REST: ${after.coreRemaining}, GraphQL: ${after.graphqlRemaining}`);

  const actualRestUsed = before.coreRemaining - after.coreRemaining;
  const actualGraphqlUsed = before.graphqlRemaining - after.graphqlRemaining;

  const countedRestUsed = result.requestLog.restUsed;
  const countedGraphqlUsed = result.requestLog.graphqlPointsUsed;

  console.log("\n── Results Summary ──────────────────────────────────");
  console.log(`Elapsed time: ${(elapsedMs / 1000).toFixed(2)}s`);
  console.log(`Cache hits: ${result.requestLog.cacheHits}`);
  console.log(`Repos analyzed: ${result.bundle.coverage.reposAnalyzed}`);
  console.log(`Commits detailed: ${result.bundle.coverage.commitsDetailed}`);
  console.log("\n── REST Request Accounting ──────────────────────────");
  console.log(`Engine counted REST: ${countedRestUsed}`);
  console.log(`Actual GitHub delta: ${actualRestUsed}`);
  const restDiff = Math.abs(countedRestUsed - actualRestUsed);
  console.log(`Difference: ${restDiff}`);

  const graphqlDiff = Math.abs(countedGraphqlUsed - actualGraphqlUsed);
  console.log(`Difference: ${graphqlDiff}`);

  console.log("\n── Per-Endpoint Counts ──────────────────────────────");
  for (const [endpoint, count] of Object.entries(result.requestLog.byEndpoint)) {
    console.log(`  ${endpoint}: ${count}`);
  }

  if (result.bundle.coverage.truncated) {
    console.log("\n⚠️ Coverage was truncated:", result.bundle.coverage.notes);
  }

  // Validate REST tolerance: <= 5 requests or <= 5%
  const maxRestTolerance = Math.max(5, Math.ceil(actualRestUsed * 0.05));
  if (restDiff > maxRestTolerance) {
    console.error(
      `\n❌ FAILED: REST counted (${countedRestUsed}) differs from actual delta (${actualRestUsed}) by ${restDiff} (tolerance: ${maxRestTolerance}).`
    );
    process.exit(1);
  }

  // Validate GraphQL tolerance: <= 5 points or <= 5%
  const maxGraphqlTolerance = Math.max(5, Math.ceil(actualGraphqlUsed * 0.05));
  if (graphqlDiff > maxGraphqlTolerance) {
    console.error(
      `\n❌ FAILED: GraphQL counted (${countedGraphqlUsed}) differs from actual delta (${actualGraphqlUsed}) by ${graphqlDiff} (tolerance: ${maxGraphqlTolerance}).`
    );
    process.exit(1);
  }

  console.log("\n✅ PASSED: Engine counters accurately match GitHub API usage!");
}

main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
