/**
 * parseInput.ts — URL → target (F0)
 * Spec reference: Agents.md §5 F0
 *
 * Accepts:
 *   - github.com/{user} → target = user, scope = all repos
 *   - github.com/{owner}/{repo} → scope = that repo; target = contributor if given, else owner
 *
 * Rejects anything not on github.com. Strips trailing slashes, .git, query strings.
 */

import type { ParsedInput } from "../types";

const GITHUB_URL_REGEX =
  /^(?:https?:\/\/)?(?:www\.)?github\.com\/([a-zA-Z0-9_-]+)(?:\/([a-zA-Z0-9._-]+))?\/?$/;

/**
 * Parse a GitHub URL into a structured target.
 * @throws Error if the URL is not a valid GitHub profile or repo URL.
 */
export function parseGitHubInput(
  url: string,
  contributor?: string
): ParsedInput {
  // Clean the URL
  let cleaned = url.trim();

  // Remove query strings and fragments
  cleaned = cleaned.split("?")[0].split("#")[0];

  // Remove trailing .git
  cleaned = cleaned.replace(/\.git\/?$/, "");

  // Remove trailing slashes
  cleaned = cleaned.replace(/\/+$/, "");

  // Remove tree/branch paths (e.g., /tree/main)
  cleaned = cleaned.replace(/\/tree\/.*$/, "");

  // Remove blob paths (e.g., /blob/main/...)
  cleaned = cleaned.replace(/\/blob\/.*$/, "");

  const match = cleaned.match(GITHUB_URL_REGEX);
  if (!match) {
    throw new Error(
      `Invalid GitHub URL: "${url}". Expected https://github.com/{user} or https://github.com/{owner}/{repo}`
    );
  }

  const [, owner, repo] = match;

  if (repo) {
    // Repo URL: github.com/{owner}/{repo}
    return {
      type: "repo",
      owner,
      repo,
      targetLogin: contributor || owner,
    };
  }

  // Profile URL: github.com/{user}
  return {
    type: "user",
    owner,
    targetLogin: contributor || owner,
  };
}
