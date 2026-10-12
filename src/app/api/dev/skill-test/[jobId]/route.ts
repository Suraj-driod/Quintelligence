/**
 * GET /api/dev/skill-test/:jobId — Get job status and results.
 * Spec reference: Agents.md §3
 *
 * Returns job status, progress, and optionally the EvidenceBundle.
 * Dev-only: returns 404 unless ENABLE_DEV_TOOLS=true.
 */

import { NextRequest, NextResponse } from "next/server";
import { getJob, getBundle, verifyAuthToken } from "@/lib/skill-engine/store";

export const runtime = "nodejs";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ jobId: string }> }
) {
  // Dev-only guard
  if (process.env.ENABLE_DEV_TOOLS !== "true") {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const { jobId } = await params;

  if (!jobId) {
    return NextResponse.json(
      { error: "Missing jobId parameter" },
      { status: 400 }
    );
  }

  // Authenticate caller server-side
  let callerUid = "anonymous";
  const authHeader = request.headers.get("authorization");
  if (authHeader?.startsWith("Bearer ")) {
    const verified = await verifyAuthToken(authHeader.substring(7));
    if (verified) {
      callerUid = verified.uid;
    }
  } else if (process.env.NODE_ENV === "development") {
    // In dev fallback, allow x-uid header
    const devUid = request.headers.get("x-uid");
    if (devUid) callerUid = devUid;
  }

  try {
    const job = await getJob(jobId, callerUid);

    if (!job) {
      return NextResponse.json({ error: "Job not found" }, { status: 404 });
    }

    const response: {
      status: string;
      progress: { stage: string; done: number; total: number };
      result?: unknown;
      profile?: unknown;
      requestLog?: unknown;
      error?: string;
    } = {
      status: job.status,
      progress: job.progress,
      profile: job.profile,
      requestLog: job.requestLog,
    };

    // If done, fetch the bundle
    if (job.status === "done" && job.bundlePath) {
      try {
        const bundle = await getBundle(job.uid, jobId);
        if (bundle) {
          response.result = bundle;
        }
      } catch (bundleError) {
        console.warn("[skill-test] Could not fetch bundle:", bundleError);
      }
    }

    // If error, include the error message
    if (job.status === "error" && job.error) {
      response.error = job.error;
    }

    return NextResponse.json(response);
  } catch (error) {
    console.error("[skill-test] Error fetching job:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
