/**
 * cache.ts — Persistent caching layer for the Skill Intelligence Engine.
 * Spec reference: Agents.md §3b, Phase 3.5
 *
 * Requirements:
 * - Commit details are immutable by sha: cache permanently, no revalidation.
 * - Store raw filtered file records (path, status, additions, deletions, authoredAddedLines),
 *   NOT skill-mapped output, so ontology changes don't invalidate the cache.
 * - Public repos: keyed `commit-cache/public/{owner}/{repo}/{sha}.json` (shared across users).
 * - Private repos: never shared; keyed by uid with short TTL, or not cached across users.
 * - Bundle-level cache: if a bundle for (target, tier, options) exists younger than
 *   BUNDLE_CACHE_HOURS (24), return it instead of re-running (forceRefresh overrides).
 * - Framework-free interface: CacheStore { get(key), set(key, value, ttl?) }
 */

import { ENGINE_CONFIG } from "./config";

export interface CacheStore {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlMs?: number): Promise<void>;
  has?(key: string): Promise<boolean>;
  delete?(key: string): Promise<void>;
}

export interface CachedFileRecord {
  path: string;
  status: "added" | "modified" | "removed" | "renamed";
  additions: number;
  deletions: number;
  authoredAddedLines?: string[];
}

export interface CachedCommitDetail {
  sha: string;
  date: string;
  files: CachedFileRecord[];
  cachedAt?: number;
}

interface CacheEntry<T> {
  data: T;
  expiresAt: number | null;
  cachedAt: number;
}

/**
 * In-memory LRU CacheStore implementation with TTL support.
 */
export class MemoryCacheStore implements CacheStore {
  private map = new Map<string, CacheEntry<unknown>>();
  private maxEntries: number;

  constructor(maxEntries = 2000) {
    this.maxEntries = maxEntries;
  }

  async get<T>(key: string): Promise<T | null> {
    const entry = this.map.get(key);
    if (!entry) return null;

    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.map.delete(key);
      return null;
    }

    // Refresh LRU position
    this.map.delete(key);
    this.map.set(key, entry);

    return entry.data as T;
  }

  async set<T>(key: string, value: T, ttlMs?: number): Promise<void> {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.maxEntries) {
      // Evict oldest entry
      const oldestKey = this.map.keys().next().value;
      if (oldestKey !== undefined) {
        this.map.delete(oldestKey);
      }
    }

    const expiresAt =
      ttlMs !== undefined && ttlMs !== Infinity && Number.isFinite(ttlMs)
        ? Date.now() + ttlMs
        : null;

    this.map.set(key, {
      data: value,
      expiresAt,
      cachedAt: Date.now(),
    });
  }

  async has(key: string): Promise<boolean> {
    const val = await this.get(key);
    return val !== null;
  }

  async delete(key: string): Promise<void> {
    this.map.delete(key);
  }

  clear(): void {
    this.map.clear();
  }

  size(): number {
    return this.map.size;
  }
}

// ── Cache Key Generators ─────────────────────────────────────────────

export function getCommitCacheKey(
  owner: string,
  repo: string,
  sha: string,
  isPrivate: boolean,
  uid?: string
): string {
  const o = owner.toLowerCase();
  const r = repo.toLowerCase();
  if (isPrivate) {
    const userScope = uid && uid.trim() ? uid.trim() : "anonymous";
    return `commit-cache/private/${userScope}/${o}/${r}/${sha}.json`;
  }
  return `commit-cache/public/${o}/${r}/${sha}.json`;
}

export function getBundleCacheKey(
  targetKey: string,
  tier: string,
  isPrivate: boolean,
  uid?: string
): string {
  const t = targetKey.toLowerCase();
  if (isPrivate) {
    const userScope = uid && uid.trim() ? uid.trim() : "anonymous";
    return `bundle-cache/private/${userScope}/${t}/${tier}.json`;
  }
  return `bundle-cache/public/${t}/${tier}.json`;
}

// Global default in-memory cache instance for the process
let defaultCacheStore: CacheStore = new MemoryCacheStore(5000);

export function getDefaultCacheStore(): CacheStore {
  return defaultCacheStore;
}

export function setDefaultCacheStore(store: CacheStore): void {
  defaultCacheStore = store;
}
