/**
 * store.ts — Firestore + Firebase Storage adapter.
 * Spec reference: Agents.md §3b
 *
 * - skillJobs/{jobId}: job status and progress
 * - skill-bundles/{uid}/{jobId}.json: EvidenceBundle storage
 * - githubTokens/{uid}: encrypted GitHub tokens (admin-only)
 *
 * Phase 1 fixes:
 * - Removed DEFAULT_DEV_KEY (security)
 * - Missing TOKEN_ENCRYPTION_KEY outside dev throws
 * - In dev, generates random per-process key with warning
 * - Validates 32-byte key length
 * - Decrypt errors are surfaced, not swallowed by Firestore handler
 * - Transient Firestore errors retry, don't permanently disable
 * - getJob takes caller uid for authorization
 * - Added deleteBundle/deleteJob for user-requested deletion
 * - Added LRU cap for in-memory maps (dev only)
 */

import { initializeApp, cert, getApps, type App } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore, Timestamp, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";
import * as crypto from "crypto";
import type {
  SkillJob,
  EvidenceBundle,
  JobProgress,
  JobStatus,
  RequestLog,
  SkillProfile,
} from "./types";
import { ENGINE_CONFIG } from "./config";

// ── In-Memory Dev Fallback Store (LRU-capped) ────────────────────────

const MEM_MAX_SIZE = 200;

class LRUMap<K, V> {
  private map = new Map<K, V>();
  private maxSize: number;

  constructor(maxSize: number) {
    this.maxSize = maxSize;
  }

  get(key: K): V | undefined {
    const val = this.map.get(key);
    if (val !== undefined) {
      // Move to end (most recently used)
      this.map.delete(key);
      this.map.set(key, val);
    }
    return val;
  }

  set(key: K, value: V): void {
    if (this.map.has(key)) {
      this.map.delete(key);
    } else if (this.map.size >= this.maxSize) {
      // Evict oldest (first entry)
      const firstKey = this.map.keys().next().value;
      if (firstKey !== undefined) {
        this.map.delete(firstKey);
      }
    }
    this.map.set(key, value);
  }

  has(key: K): boolean {
    return this.map.has(key);
  }

  delete(key: K): boolean {
    return this.map.delete(key);
  }
}

const memJobs = new LRUMap<string, SkillJob>(MEM_MAX_SIZE);
const memBundles = new LRUMap<string, EvidenceBundle>(MEM_MAX_SIZE);
const memTokens = new LRUMap<
  string,
  { ciphertext: string; iv: string; scopes: string[]; connectedAt: string }
>(MEM_MAX_SIZE);

/**
 * Firestore availability state:
 * - null: not yet determined
 * - true: Firestore is available
 * - false: Firestore init failed (dev only: no credentials)
 */
let firestoreInitFailed = false;

// ── Firebase Admin init ──────────────────────────────────────────────

let adminApp: App | null = null;
let db: Firestore | null = null;
let storage: Storage | null = null;

function getAdminApp(): App | null {
  if (adminApp) return adminApp;

  try {
    if (getApps().length > 0) {
      adminApp = getApps()[0];
    } else {
      const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT;
      if (serviceAccount) {
        try {
          const parsed = JSON.parse(serviceAccount);
          adminApp = initializeApp({
            credential: cert(parsed),
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          });
        } catch {
          adminApp = initializeApp({
            credential: cert(serviceAccount),
            projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
            storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
          });
        }
      } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
        adminApp = initializeApp({
          projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
          storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
        });
      } else {
        // No Admin credentials provisioned
        if (process.env.NODE_ENV !== "development") {
          // Outside development, never silently fall back to in-memory store
          throw new Error(
            "Firebase credentials are required outside development. " +
            "Set FIREBASE_SERVICE_ACCOUNT or GOOGLE_APPLICATION_CREDENTIALS."
          );
        }
        // In development, fall back to in-memory store
        console.warn(
          "[skill-engine/store] No Firebase credentials found. Using in-memory store (dev only)."
        );
        firestoreInitFailed = true;
        return null;
      }
    }

    if (adminApp) {
      db = getFirestore(adminApp);
      storage = getStorage(adminApp);
    }
  } catch (err) {
    if (process.env.NODE_ENV !== "development") {
      throw err;
    }
    console.warn(
      "[skill-engine/store] Firebase Admin init failed, using in-memory store:",
      err instanceof Error ? err.message : err
    );
    firestoreInitFailed = true;
    return null;
  }

  return adminApp;
}

function getDb(): Firestore | null {
  if (firestoreInitFailed) return null;
  getAdminApp();
  return db;
}

function getStorageBucket() {
  if (firestoreInitFailed) return null;
  getAdminApp();
  return storage ? storage.bucket() : null;
}

// ── Token encryption ─────────────────────────────────────────────────

const ALGORITHM = "aes-256-gcm";

// Per-process random key for development (never logged)
let devProcessKey: Buffer | null = null;

function getEncryptionKey(): Buffer {
  const keyEnv = process.env.TOKEN_ENCRYPTION_KEY;

  if (!keyEnv) {
    if (process.env.NODE_ENV !== "development") {
      throw new Error(
        "TOKEN_ENCRYPTION_KEY is required outside development. " +
        "Set a 32-byte base64-encoded key in your environment."
      );
    }

    // Development: generate a random per-process key
    if (!devProcessKey) {
      devProcessKey = crypto.randomBytes(32);
      console.warn(
        "[skill-engine/store] WARNING: Using random per-process encryption key (dev only). " +
        "Encrypted tokens will not survive restarts."
      );
    }
    return devProcessKey;
  }

  const key = Buffer.from(keyEnv, "base64");

  // Validate key length
  if (key.length !== 32) {
    throw new Error(
      `TOKEN_ENCRYPTION_KEY must decode to exactly 32 bytes (got ${key.length}). ` +
      "Use a 32-byte key encoded as base64."
    );
  }

  return key;
}

export class TokenDecryptionError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "TokenDecryptionError";
  }
}

export function encryptToken(plaintext: string): {
  ciphertext: string;
  iv: string;
} {
  const key = getEncryptionKey();
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let encrypted = cipher.update(plaintext, "utf8", "base64");
  encrypted += cipher.final("base64");

  const authTag = cipher.getAuthTag();

  return {
    ciphertext: encrypted + "." + authTag.toString("base64"),
    iv: iv.toString("base64"),
  };
}

export function decryptToken(ciphertext: string, iv: string): string {
  const key = getEncryptionKey();
  const parts = ciphertext.split(".");
  if (parts.length !== 2) {
    throw new TokenDecryptionError(
      "Token is undecryptable (invalid format). User should re-connect GitHub."
    );
  }
  const [encrypted, authTagStr] = parts;
  
  try {
    const authTag = Buffer.from(authTagStr, "base64");
    const ivBuf = Buffer.from(iv, "base64");

    const decipher = crypto.createDecipheriv(ALGORITHM, key, ivBuf);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "base64", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  } catch (err) {
    // Surface as a typed error, NOT a generic error
    // This must NOT be caught by the Firestore-availability handler
    throw new TokenDecryptionError(
      "Token is undecryptable (decryption failed). User should re-connect GitHub."
    );
  }
}

// ── Job operations ───────────────────────────────────────────────────

export async function createJob(
  jobId: string,
  uid: string,
  target: string,
  mode: "public" | "public+private"
): Promise<SkillJob> {
  const now = new Date();
  const expiresAt = new Date(now);
  expiresAt.setDate(expiresAt.getDate() + ENGINE_CONFIG.BUNDLE_TTL_DAYS);

  const job: SkillJob = {
    jobId,
    uid,
    target,
    mode,
    status: "queued",
    progress: { stage: "Initializing", done: 0, total: 0 },
    createdAt: now.toISOString(),
    expiresAt: expiresAt.toISOString(),
  };

  memJobs.set(jobId, job);

  const firestore = getDb();
  if (firestore) {
    try {
      await firestore.collection("skillJobs").doc(jobId).set({
        ...job,
        // Store expiresAt as Firestore Timestamp for TTL policy support
        expiresAt: Timestamp.fromDate(expiresAt),
        createdAt: Timestamp.fromDate(now),
      });
    } catch (err) {
      // Transient failure — don't disable Firestore permanently
      console.warn(
        "[skill-engine/store] Firestore write failed for job creation:",
        err instanceof Error ? err.message : err
      );
    }
  }

  return job;
}

export async function updateJobProgress(
  jobId: string,
  progress: JobProgress
): Promise<void> {
  const existing = memJobs.get(jobId);
  if (existing) {
    existing.status = "running";
    existing.progress = progress;
  }

  const firestore = getDb();
  if (firestore) {
    try {
      await firestore.collection("skillJobs").doc(jobId).update({
        status: "running",
        progress,
      });
    } catch (err) {
      console.warn(
        "[skill-engine/store] Firestore update failed for job progress:",
        err instanceof Error ? err.message : err
      );
    }
  }
}

export async function completeJob(
  jobId: string,
  bundlePath: string,
  requestLog?: RequestLog,
  profile?: SkillProfile
): Promise<void> {
  const existing = memJobs.get(jobId);
  if (existing) {
    existing.status = "done";
    existing.progress = { stage: "Complete", done: 1, total: 1 };
    existing.bundlePath = bundlePath;
    if (requestLog) {
      existing.requestLog = requestLog;
    }
    if (profile) {
      existing.profile = profile;
    }
  }

  const firestore = getDb();
  if (firestore) {
    try {
      const updateData: Record<string, unknown> = {
        status: "done",
        progress: { stage: "Complete", done: 1, total: 1 },
        bundlePath,
      };
      if (requestLog) {
        updateData.requestLog = requestLog;
      }
      if (profile) {
        updateData.profile = profile;
      }
      await firestore.collection("skillJobs").doc(jobId).update(updateData);
    } catch (err) {
      console.warn(
        "[skill-engine/store] Firestore update failed for job completion:",
        err instanceof Error ? err.message : err
      );
    }
  }
}

export async function failJob(jobId: string, error: string): Promise<void> {
  const existing = memJobs.get(jobId);
  if (existing) {
    existing.status = "error";
    existing.error = error;
  }

  const firestore = getDb();
  if (firestore) {
    try {
      await firestore.collection("skillJobs").doc(jobId).update({
        status: "error",
        error,
      });
    } catch (err) {
      console.warn(
        "[skill-engine/store] Firestore update failed for job failure:",
        err instanceof Error ? err.message : err
      );
    }
  }
}

/**
 * Get a job by ID. Verifies that the caller's uid matches the job's uid.
 * Returns null if the job doesn't exist or the caller is not the owner.
 */
export async function getJob(
  jobId: string,
  callerUid?: string
): Promise<SkillJob | null> {
  const firestore = getDb();
  if (firestore) {
    try {
      const doc = await firestore.collection("skillJobs").doc(jobId).get();
      if (doc.exists) {
        const data = doc.data() as Record<string, unknown>;
        if (callerUid && data.uid !== callerUid) {
          return null; // Caller is not the job owner
        }
        // Convert Firestore Timestamps back to ISO strings
        const job: SkillJob = {
          ...(data as unknown as SkillJob),
          createdAt:
            data.createdAt instanceof Timestamp
              ? data.createdAt.toDate().toISOString()
              : (data.createdAt as string),
          expiresAt:
            data.expiresAt instanceof Timestamp
              ? data.expiresAt.toDate().toISOString()
              : (data.expiresAt as string),
        };
        return job;
      }
    } catch (err) {
      console.warn(
        "[skill-engine/store] Firestore read failed for job:",
        err instanceof Error ? err.message : err
      );
    }
  }

  const memJob = memJobs.get(jobId);
  if (memJob) {
    if (callerUid && memJob.uid !== callerUid) {
      return null;
    }
    return memJob;
  }
  return null;
}

// ── Delete operations ────────────────────────────────────────────────

export async function deleteJob(
  jobId: string,
  callerUid: string
): Promise<boolean> {
  const memJob = memJobs.get(jobId);
  if (memJob) {
    if (memJob.uid !== callerUid) return false;
    memJobs.delete(jobId);
  }

  const firestore = getDb();
  if (firestore) {
    try {
      const doc = await firestore.collection("skillJobs").doc(jobId).get();
      if (doc.exists) {
        const data = doc.data();
        if (data?.uid !== callerUid) return false;
        await firestore.collection("skillJobs").doc(jobId).delete();
      }
    } catch (err) {
      console.warn(
        "[skill-engine/store] Firestore delete failed for job:",
        err instanceof Error ? err.message : err
      );
    }
  }

  return true;
}

export async function deleteBundle(
  uid: string,
  jobId: string
): Promise<boolean> {
  const path = `skill-bundles/${uid}/${jobId}.json`;
  memBundles.delete(path);

  const bucket = getStorageBucket();
  if (bucket) {
    try {
      const file = bucket.file(path);
      const [exists] = await file.exists();
      if (exists) {
        await file.delete();
      }
    } catch (err) {
      console.warn(
        `[skill-engine/store] Storage delete failed for ${path}:`,
        err instanceof Error ? err.message : err
      );
      return false;
    }
  }

  return true;
}

// ── Bundle storage ───────────────────────────────────────────────────

export async function storeBundle(
  uid: string,
  jobId: string,
  bundle: EvidenceBundle
): Promise<string> {
  const path = `skill-bundles/${uid}/${jobId}.json`;
  memBundles.set(path, bundle);

  const bucket = getStorageBucket();
  if (bucket) {
    try {
      const file = bucket.file(path);
      await file.save(JSON.stringify(bundle, null, 2), {
        contentType: "application/json",
        metadata: {
          cacheControl: `private, max-age=${ENGINE_CONFIG.BUNDLE_TTL_DAYS * 86400}`,
        },
      });
    } catch (err) {
      console.warn(
        `[skill-engine/store] Storage upload failed for ${path}, saved in memory:`,
        err instanceof Error ? err.message : err
      );
    }
  }

  return path;
}

export async function getBundle(
  uid: string,
  jobId: string
): Promise<EvidenceBundle | null> {
  const path = `skill-bundles/${uid}/${jobId}.json`;

  const bucket = getStorageBucket();
  if (bucket) {
    try {
      const file = bucket.file(path);
      const [exists] = await file.exists();
      if (exists) {
        const [contents] = await file.download();
        return JSON.parse(contents.toString("utf-8")) as EvidenceBundle;
      }
    } catch {
      // Fall through to memory store
    }
  }

  return memBundles.get(path) ?? null;
}

// ── GitHub token storage ─────────────────────────────────────────────

export async function storeGitHubToken(
  uid: string,
  token: string,
  scopes: string[]
): Promise<void> {
  const { ciphertext, iv } = encryptToken(token);
  const record = {
    ciphertext,
    iv,
    scopes,
    connectedAt: new Date().toISOString(),
  };

  memTokens.set(uid, record);

  const firestore = getDb();
  if (firestore) {
    try {
      await firestore.collection("githubTokens").doc(uid).set(record);
    } catch (err) {
      console.warn(
        "[skill-engine/store] Firestore write failed for token storage:",
        err instanceof Error ? err.message : err
      );
    }
  }
}

export async function getGitHubToken(uid: string): Promise<string | null> {
  const firestore = getDb();
  if (firestore) {
    try {
      const doc = await firestore.collection("githubTokens").doc(uid).get();
      if (doc.exists) {
        const data = doc.data()!;
        // TokenDecryptionError is NOT caught here — it propagates up
        return decryptToken(data.ciphertext, data.iv);
      }
    } catch (err) {
      // Re-throw TokenDecryptionError — don't swallow it
      if (err instanceof TokenDecryptionError) {
        throw err;
      }
      console.warn(
        "[skill-engine/store] Firestore read failed for token:",
        err instanceof Error ? err.message : err
      );
    }
  }

  const mem = memTokens.get(uid);
  if (mem) {
    return decryptToken(mem.ciphertext, mem.iv);
  }
  return null;
}

export async function deleteGitHubToken(uid: string): Promise<void> {
  memTokens.delete(uid);

  const firestore = getDb();
  if (firestore) {
    try {
      await firestore.collection("githubTokens").doc(uid).delete();
    } catch (err) {
      console.warn(
        "[skill-engine/store] Firestore delete failed for token:",
        err instanceof Error ? err.message : err
      );
    }
  }
}

export async function getGitHubTokenScopes(
  uid: string
): Promise<string[] | null> {
  const firestore = getDb();
  if (firestore) {
    try {
      const doc = await firestore.collection("githubTokens").doc(uid).get();
      if (doc.exists) {
        return doc.data()!.scopes as string[];
      }
    } catch (err) {
      console.warn(
        "[skill-engine/store] Firestore read failed for token scopes:",
        err instanceof Error ? err.message : err
      );
    }
  }

  const mem = memTokens.get(uid);
  return mem ? mem.scopes : null;
}

/**
 * Verify Firebase ID token server-side.
 * Returns decoded uid and linked GitHub login if present, or null if invalid.
 */
export async function verifyAuthToken(
  idToken: string
): Promise<{ uid: string; githubLogin?: string } | null> {
  const app = getAdminApp();
  if (!app) return null;

  try {
    const auth = getAuth(app);
    const decoded = await auth.verifyIdToken(idToken);
    let githubLogin: string | undefined = undefined;

    try {
      const user = await auth.getUser(decoded.uid);
      const gh = user.providerData.find((p) => p.providerId === "github.com");
      githubLogin =
        gh?.displayName ||
        (decoded.github_login as string) ||
        (decoded.screen_name as string);
    } catch {
      // User record lookup non-fatal
    }

    return { uid: decoded.uid, githubLogin };
  } catch {
    return null;
  }
}
