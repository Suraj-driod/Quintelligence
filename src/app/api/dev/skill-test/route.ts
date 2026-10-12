/**
 * POST /api/dev/skill-test — Start an analysis job.
 * Spec reference: Agents.md §3
 *
 * Returns 202 { jobId } and runs the pipeline in-process.
 * Dev-only: returns 404 unless ENABLE_DEV_TOOLS=true.
 */

import { NextRequest, NextResponse } from "next/server";
import { parseGitHubInput } from "@/lib/skill-engine/github/parseInput";
import { runPipeline } from "@/lib/skill-engine/pipeline";
import {
  createJob,
  updateJobProgress,
  completeJob,
  failJob,
  storeBundle,
  getGitHubToken,
  verifyAuthToken,
} from "@/lib/skill-engine/store";
import { AnalysisRequestSchema } from "@/lib/skill-engine/types";
import type { AnalysisMode } from "@/lib/skill-engine/types";
import { randomUUID } from "crypto";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  // Dev-only guard
  if (process.env.ENABLE_DEV_TOOLS !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const body = await request.json();

    // Validate input with zod
    const parsed = AnalysisRequestSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const { url, contributor, includePrivate, tier } = parsed.data;

    // Parse the GitHub URL
    let target;
    try {
      target = parseGitHubInput(url, contributor);
    } catch (parseError) {
      return NextResponse.json(
        {
          error:
            parseError instanceof Error
              ? parseError.message
              : "Invalid GitHub URL",
        },
        { status: 400 }
      );
    }

    // 1. Authenticate caller server-side
    let uid = "anonymous";
    let verifiedGithubLogin: string | undefined = undefined;

    const authHeader = request.headers.get("authorization");
    if (authHeader?.startsWith("Bearer ")) {
      const verified = await verifyAuthToken(authHeader.substring(7));
      if (verified) {
        uid = verified.uid;
        verifiedGithubLogin = verified.githubLogin;
      }
    } else if (process.env.NODE_ENV === "development") {
      // In development fallback, allow x-uid and x-github-login headers
      const devUid = request.headers.get("x-uid");
      if (devUid) uid = devUid;
      const devLogin = request.headers.get("x-github-login");
      if (devLogin) verifiedGithubLogin = devLogin;
    }

    // 2. Fetch user's token if available (Phase 3.2: use connected user's token)
    let userToken: string | null = null;
    if (uid !== "anonymous") {
      userToken = await getGitHubToken(uid).catch(() => null);
    }
    if (!userToken && process.env.NODE_ENV === "development") {
      userToken = request.headers.get("x-github-token") || null;
    }

    // Use user's own token for analyses (even public targets) if available, else server token
    let token = userToken || process.env.GITHUB_SERVER_TOKEN || "";
    let mode: AnalysisMode = "public";
    let authenticatedLogin: string | undefined = undefined;

    if (includePrivate) {
      // Agents.md §3: Private repos are only analyzed when the authenticated
      // GitHub login equals the target user. Never trust includePrivate or a login from the client.
      const isSelf =
        verifiedGithubLogin &&
        verifiedGithubLogin.toLowerCase() === target.targetLogin.toLowerCase();

      if (userToken && isSelf) {
        mode = "public+private";
        authenticatedLogin = verifiedGithubLogin;
      } else {
        mode = "public";
      }
    }

    // 3. Create job with unguessable crypto-random ID
    const jobId = randomUUID();
    await createJob(jobId, uid, target.targetLogin, mode);

    // Run pipeline in background with verified authenticatedLogin, uid, and tier
    runPipelineInBackground(jobId, uid, token, target, mode, authenticatedLogin, tier);

    return NextResponse.json({ jobId }, { status: 202 });
  } catch (error) {
    console.error("[skill-test] Error starting analysis:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

/**
 * Run the pipeline in the background (in-process job runner).
 * Updates store with progress.
 */
async function runPipelineInBackground(
  jobId: string,
  uid: string,
  token: string,
  target: ReturnType<typeof parseGitHubInput>,
  mode: AnalysisMode,
  authenticatedLogin?: string,
  tier?: import("@/lib/skill-engine/config").AnalysisTier
): Promise<void> {
  try {
    const result = await runPipeline({
      token,
      target,
      mode,
      tier,
      uid,
      authenticatedLogin,
      onProgress: async (progress) => {
        try {
          await updateJobProgress(jobId, progress);
        } catch (err) {
          console.warn("[skill-test] Failed to update progress:", err);
        }
      },
    });

    // Store the bundle
    const bundlePath = await storeBundle(uid, jobId, result.bundle);

    // Mark job as complete and store request log and profile
    await completeJob(jobId, bundlePath, result.requestLog, result.profile);
  } catch (error) {
    console.error("[skill-test] Pipeline error:", error);
    const errorMessage =
      error instanceof Error ? error.message : "Unknown pipeline error";
    await failJob(jobId, errorMessage).catch((e) =>
      console.error("[skill-test] Failed to mark job as failed:", e)
    );
  }
}
