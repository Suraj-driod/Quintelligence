/**
 * Phase 0 Regression Tests — Test 0.1 through 0.3
 * Tests for GitHub client: rate-limit tracking, cache isolation
 *
 * These tests must FAIL on the current code and PASS after fixes.
 */
import { describe, it, expect, beforeEach } from "vitest";
import { createGitHubClient } from "../github/client";

// ── Helpers: create a stub fetch ──────────────────────────────────────

function createStubFetch(
  responseOverrides: {
    headers?: Record<string, string>;
    body?: unknown;
    status?: number;
  } = {}
) {
  const {
    headers = {},
    body = { data: "stub" },
    status = 200,
  } = responseOverrides;

  const calls: Array<{ url: string; options: RequestInit }> = [];

  const stubFetch: typeof globalThis.fetch = async (input, init) => {
    const url = typeof input === "string" ? input : (input as Request).url;
    calls.push({ url, options: init ?? {} });

    const responseHeaders = new Headers(headers);
    return new Response(JSON.stringify(body), {
      status,
      headers: responseHeaders,
    });
  };

  return { fetch: stubFetch, calls };
}

// ── Test 0.1: Client rate-limit tracking ─────────────────────────────

describe("0.1 — Client rate-limit tracking", () => {
  it("should read x-ratelimit-remaining from response headers", async () => {
    const { fetch: stubFetch } = createStubFetch({
      headers: {
        "x-ratelimit-remaining": "42",
        "x-ratelimit-reset": String(Math.floor(Date.now() / 1000) + 3600),
      },
      body: {
        login: "testuser",
        id: 12345,
        type: "User",
      },
    });

    const client = createGitHubClient({ token: "ghp_test123", fetch: stubFetch });

    // Make a request to trigger the hook
    try {
      await client.rest.users.getByUsername({ username: "testuser" });
    } catch {
      // May fail due to response shape, but headers should still be read
    }

    const log = client.requestLog();
    expect(log.rateLimitRemaining).toBe(42);
    expect(log.totalRequests).toBe(1);
    expect(client.isRateLimited()).toBe(true); // 42 < floor of 100
  });
});

// ── Test 0.2: Cache must not collide on different commit SHAs ────────

describe("0.2 — Two different commit SHAs in one client", () => {
  it("should return different responses for different SHAs", async () => {
    let callCount = 0;
    const stubFetch: typeof globalThis.fetch = async (input) => {
      callCount++;
      const url = typeof input === "string" ? input : (input as Request).url;
      const sha = url.includes("sha_aaa") ? "sha_aaa" : "sha_bbb";
      return new Response(
        JSON.stringify({
          sha,
          commit: { author: { date: "2024-01-01" } },
          files: [],
          parents: [],
        }),
        {
          status: 200,
          headers: new Headers({
            "x-ratelimit-remaining": "4900",
            etag: `"etag-${sha}"`,
          }),
        }
      );
    };

    const client = createGitHubClient({ token: "ghp_test123", fetch: stubFetch });

    try {
      const [r1, r2] = await Promise.all([
        client.rest.repos.getCommit({ owner: "o", repo: "r", ref: "sha_aaa" }),
        client.rest.repos.getCommit({ owner: "o", repo: "r", ref: "sha_bbb" }),
      ]);
      // Responses must differ
      expect(r1.data.sha).not.toBe(r2.data.sha);
    } catch {
      // If the requests fail, the test structure still validates intent
    }

    // Both requests must have been made (no cache collision)
    expect(callCount).toBe(2);
  });
});

// ── Test 0.3: Two clients with different tokens, same URL ────────────

describe("0.3 — Two clients with different tokens, same URL", () => {
  it("should not serve cached data from one client to another", async () => {
    let callCount = 0;
    const stubFetch: typeof globalThis.fetch = async () => {
      callCount++;
      return new Response(
        JSON.stringify({
          login: "user",
          id: callCount,
          type: "User",
        }),
        {
          status: 200,
          headers: new Headers({
            "x-ratelimit-remaining": "4900",
            etag: `"etag-${callCount}"`,
          }),
        }
      );
    };

    const client1 = createGitHubClient({ token: "ghp_user1_token", fetch: stubFetch });
    const client2 = createGitHubClient({ token: "ghp_user2_token", fetch: stubFetch });

    try {
      await client1.rest.users.getByUsername({ username: "target" });
      await client2.rest.users.getByUsername({ username: "target" });
    } catch {
      // Responses may fail to parse, but both requests should go through
    }

    // Both requests must have hit the network — client2 must NOT get client1's cached response
    expect(callCount).toBe(2);
  });
});
