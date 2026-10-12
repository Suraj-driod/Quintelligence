/**
 * commitFilter.ts — Merge / bulk / bot commit filter.
 * Spec reference: Agents.md §5 F3, F5
 *
 * Filters out commits that should not count as evidence:
 * - Merge commits (more than 1 parent)
 * - Bot-authored commits
 * - Bulk commits (touching more files than BULK_COMMIT_FILES)
 */

import { ENGINE_CONFIG } from "../config";

// ── Known bot suffixes/patterns ──────────────────────────────────────
const BOT_LOGIN_PATTERNS: RegExp[] = [
  /\[bot\]$/i,
  /^dependabot/i,
  /^renovate/i,
  /^greenkeeper/i,
  /^snyk-bot/i,
  /^github-actions/i,
  /^codecov/i,
  /^semantic-release-bot/i,
];

/**
 * Returns true if the commit author login looks like a bot.
 */
export function isBotAuthor(login: string): boolean {
  return BOT_LOGIN_PATTERNS.some((pattern) => pattern.test(login));
}

/**
 * Returns true if a commit is a merge commit (has more than 1 parent).
 */
export function isMergeCommit(parentCount: number): boolean {
  return parentCount > 1;
}

/**
 * Returns true if a commit is a bulk commit (touches too many files).
 * These are likely imports, mass renames, or generated dumps.
 */
export function isBulkCommit(fileCount: number): boolean {
  return fileCount > ENGINE_CONFIG.BULK_COMMIT_FILES;
}

/**
 * Check all commit-level filters. Returns true if the commit should be DROPPED.
 */
export function shouldDropCommit(opts: {
  authorLogin: string;
  parentCount: number;
  fileCount?: number;
}): boolean {
  if (isBotAuthor(opts.authorLogin)) return true;
  if (isMergeCommit(opts.parentCount)) return true;
  if (opts.fileCount !== undefined && isBulkCommit(opts.fileCount)) return true;
  return false;
}
