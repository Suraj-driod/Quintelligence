"use client";

/**
 * /dev/skill-test — Test page for the Skill Intelligence Engine.
 * Spec reference: Agents.md §3
 *
 * Features:
 * 1. GitHub link input (profile or repo URL)
 * 2. Optional contributor input
 * 3. Analyze button
 * 4. Connect GitHub account button (include private repos)
 * 5. Mode indicator
 * 6. Progress area
 * 7. Results: Evidence summary | Raw JSON | Request log
 */

import { useState, useEffect, useRef, useCallback } from "react";
import type { SkillProfile, SkillRating } from "@/lib/skill-engine/scoring/types";
import { STANDARD_ROLE_BENCHMARKS } from "@/lib/skill-engine/scoring/config";
import { evaluateEvidenceBundle } from "@/lib/skill-engine/scoring/evaluator";
import { analyzeRoleGap } from "@/lib/skill-engine/scoring/gapAnalysis";
import { ANALYSIS_TIERS, type AnalysisTier } from "@/lib/skill-engine/config";

// ── Types (client-side mirrors) ──────────────────────────────────────

interface JobProgress {
  stage: string;
  done: number;
  total: number;
}

interface FileEvidence {
  path: string;
  status: string;
  additions: number;
  deletions: number;
  skill: string | null;
  authoredAddedLines?: string[];
}

interface CommitEvidence {
  sha: string;
  date: string;
  files: FileEvidence[];
}

interface RepoEvidence {
  fullName: string;
  isPrivate: boolean;
  isFork: boolean;
  stack: string[];
  commitDates: string[];
  commits: CommitEvidence[];
}

interface EvidenceBundle {
  target: { login: string; id: number; mode: string };
  fetchedAt: string;
  coverage: {
    reposDiscovered: number;
    reposAnalyzed: number;
    commitsListed: number;
    commitsDetailed: number;
    truncated: boolean;
    notes: string[];
  };
  repos: RepoEvidence[];
  collaboration: {
    prsOpened: number;
    prsMerged: number;
    reviewsGiven: number;
    issuesOpened: number;
    comments: number;
    windowMonths: number;
  };
}

interface RequestLog {
  totalRequests: number;
  restUsed?: number;
  restRemaining?: number;
  graphqlPointsUsed?: number;
  graphqlRemaining?: number;
  cacheHits: number;
  rateLimitRemaining: number;
  rateLimitReset: string;
  byEndpoint: Record<string, number>;
  floor?: number;
}

// ── Component ────────────────────────────────────────────────────────

export default function SkillTestPage() {
  const [url, setUrl] = useState("");
  const [contributor, setContributor] = useState("");
  const [includePrivate, setIncludePrivate] = useState(false);
  const [tier, setTier] = useState<"quick" | "standard" | "deep">("standard");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [jobId, setJobId] = useState<string | null>(null);
  const [progress, setProgress] = useState<JobProgress | null>(null);
  const [status, setStatus] = useState<string>("");
  const [result, setResult] = useState<EvidenceBundle | null>(null);
  const [profile, setProfile] = useState<SkillProfile | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<string>("fullstack-engineer");
  const [requestLog, setRequestLog] = useState<RequestLog | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<
    "profile" | "gaps" | "summary" | "json" | "log"
  >("profile");
  const [copied, setCopied] = useState(false);
  const [connectedUser, setConnectedUser] = useState<{
    login: string;
    token: string;
  } | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [showManualTokenModal, setShowManualTokenModal] = useState(false);
  const [manualToken, setManualToken] = useState("");
  const [manualLogin, setManualLogin] = useState("");
  const pollRef = useRef<NodeJS.Timeout | null>(null);

  // ── Polling ──────────────────────────────────────────────────────

  const pollJob = useCallback(
    async (id: string) => {
      try {
        const res = await fetch(`/api/dev/skill-test/${id}`);
        if (!res.ok) {
          setError(`Failed to fetch job status: ${res.status}`);
          setIsAnalyzing(false);
          return;
        }

        const data = await res.json();
        setStatus(data.status);
        setProgress(data.progress);

        if (data.status === "done" && data.result) {
          setResult(data.result);
          if (data.profile) {
            setProfile(data.profile);
          } else {
            setProfile(evaluateEvidenceBundle(data.result));
          }
          if (data.requestLog) {
            setRequestLog(data.requestLog);
          }
          setIsAnalyzing(false);
          if (pollRef.current) clearInterval(pollRef.current);
        } else if (data.status === "error") {
          setError(data.error || "Analysis failed");
          setIsAnalyzing(false);
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch (e) {
        console.error("Poll error:", e);
      }
    },
    []
  );

  useEffect(() => {
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, []);

  // ── GitHub Auth ──────────────────────────────────────────────────

  async function handleConnectGitHub() {
    setIsConnecting(true);
    setError(null);
    try {
      const { auth, GithubAuthProvider, signInWithPopup } = await import(
        "@/app/backend/firebase"
      );
      const provider = new GithubAuthProvider();
      provider.addScope("repo");
      provider.addScope("read:user");

      const res = await signInWithPopup(auth, provider);
      const credential = GithubAuthProvider.credentialFromResult(res);
      const token = credential?.accessToken;
      // @ts-expect-error Firebase screenName property
      const username = res.user?.reloadUserInfo?.screenName || res.user?.displayName || "user";

      if (token) {
        setConnectedUser({ login: username, token });
        setIncludePrivate(true);
      } else {
        setShowManualTokenModal(true);
      }
    } catch (err: unknown) {
      console.warn("Firebase GitHub auth popup failed, opening PAT modal:", err);
      setShowManualTokenModal(true);
    } finally {
      setIsConnecting(false);
    }
  }

  function handleDisconnectGitHub() {
    setConnectedUser(null);
    setIncludePrivate(false);
  }

  function handleSaveManualToken() {
    if (manualToken.trim() && manualLogin.trim()) {
      setConnectedUser({
        login: manualLogin.trim(),
        token: manualToken.trim(),
      });
      setIncludePrivate(true);
      setShowManualTokenModal(false);
      setManualToken("");
      setManualLogin("");
    }
  }

  // ── Start analysis ────────────────────────────────────────────────

  async function handleAnalyze() {
    if (!url.trim()) return;

    setIsAnalyzing(true);
    setError(null);
    setResult(null);
    setProfile(null);
    setRequestLog(null);
    setProgress(null);
    setStatus("queued");

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      if (connectedUser?.token) {
        headers["x-github-token"] = connectedUser.token;
        headers["x-github-login"] = connectedUser.login;
      }

      const res = await fetch("/api/dev/skill-test", {
        method: "POST",
        headers,
        body: JSON.stringify({
          url: url.trim(),
          contributor: contributor.trim() || undefined,
          includePrivate: Boolean(includePrivate && connectedUser),
          tier,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || `Server error: ${res.status}`);
        setIsAnalyzing(false);
        return;
      }

      const { jobId: id } = await res.json();
      setJobId(id);

      // Start polling
      pollRef.current = setInterval(() => pollJob(id), 2000);
      pollJob(id);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to start analysis");
      setIsAnalyzing(false);
    }
  }

  // ── Copy JSON ──────────────────────────────────────────────────────

  function handleCopyJson() {
    if (!result) return;
    navigator.clipboard.writeText(JSON.stringify(result, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  // ── Compute skill summary ──────────────────────────────────────────

  function getSkillSummary() {
    if (!result) return [];

    const skillMap = new Map<
      string,
      {
        files: number;
        additions: number;
        deletions: number;
        repos: Set<string>;
        months12: Set<string>;
        months36: Set<string>;
      }
    >();

    const now = new Date();
    const oneYearAgo = new Date(now);
    oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
    const threeYearsAgo = new Date(now);
    threeYearsAgo.setFullYear(threeYearsAgo.getFullYear() - 3);

    for (const repo of result.repos) {
      for (const commit of repo.commits) {
        const commitDate = new Date(commit.date);
        const monthKey = `${commitDate.getFullYear()}-${String(commitDate.getMonth() + 1).padStart(2, "0")}`;

        for (const file of commit.files) {
          const skill = file.skill;
          if (!skill) continue;

          if (!skillMap.has(skill)) {
            skillMap.set(skill, {
              files: 0,
              additions: 0,
              deletions: 0,
              repos: new Set(),
              months12: new Set(),
              months36: new Set(),
            });
          }

          const entry = skillMap.get(skill)!;
          entry.files++;
          entry.additions += file.additions;
          entry.deletions += file.deletions;
          entry.repos.add(repo.fullName);

          if (commitDate >= threeYearsAgo) {
            entry.months36.add(monthKey);
          }
          if (commitDate >= oneYearAgo) {
            entry.months12.add(monthKey);
          }
        }
      }
    }

    return Array.from(skillMap.entries())
      .map(([skill, data]) => ({
        skill,
        files: data.files,
        additions: data.additions,
        deletions: data.deletions,
        repos: data.repos.size,
        activeMonths12: data.months12.size,
        activeMonths36: data.months36.size,
      }))
      .sort((a, b) => b.additions - a.additions);
  }

  // ── Render ─────────────────────────────────────────────────────────

  const mode = connectedUser && includePrivate
    ? `public + private (connected as @${connectedUser.login})`
    : "public repos only";

  return (
    <div style={styles.page}>
      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div style={styles.headerGlow} />
          <h1 style={styles.title}>
            <span style={styles.titleIcon}>⚡</span>
            Skill Intelligence Engine
          </h1>
          <p style={styles.subtitle}>
            GitHub evidence → Skill profile · Dev test harness
          </p>
          <div style={styles.modeBadge}>
            Mode: {mode}
          </div>
        </div>

        {/* Input Section */}
        <div style={styles.inputSection}>
          <div style={styles.inputGroup}>
            <label style={styles.label}>GitHub Link</label>
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://github.com/username or https://github.com/owner/repo"
              style={styles.input}
              disabled={isAnalyzing}
            />
          </div>

          <div style={styles.inputRow}>
            <div style={{ ...styles.inputGroup, flex: 1 }}>
              <label style={styles.label}>
                Analyze contributor{" "}
                <span style={styles.optional}>(optional)</span>
              </label>
              <input
                type="text"
                value={contributor}
                onChange={(e) => setContributor(e.target.value)}
                placeholder="GitHub username"
                style={styles.input}
                disabled={isAnalyzing}
              />
            </div>

            <div style={styles.checkboxGroup}>
              {connectedUser ? (
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", flexWrap: "wrap" }}>
                  <label style={styles.checkboxLabel}>
                    <input
                      type="checkbox"
                      checked={includePrivate}
                      onChange={(e) => setIncludePrivate(e.target.checked)}
                      disabled={isAnalyzing}
                      style={styles.checkbox}
                    />
                    Include private repos (@{connectedUser.login})
                  </label>
                  <button
                    type="button"
                    onClick={handleDisconnectGitHub}
                    style={{
                      padding: "0.25rem 0.6rem",
                      borderRadius: "6px",
                      border: "1px solid rgba(239, 68, 68, 0.3)",
                      background: "rgba(239, 68, 68, 0.15)",
                      color: "#f87171",
                      fontSize: "0.75rem",
                      cursor: "pointer",
                    }}
                  >
                    Disconnect
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={handleConnectGitHub}
                  disabled={isConnecting || isAnalyzing}
                  style={{
                    padding: "0.6rem 1rem",
                    borderRadius: "8px",
                    border: "1px solid rgba(139, 92, 246, 0.4)",
                    background: "rgba(139, 92, 246, 0.15)",
                    color: "#c4b5fd",
                    fontSize: "0.8rem",
                    fontWeight: 500,
                    cursor: "pointer",
                    whiteSpace: "nowrap",
                  }}
                >
                  {isConnecting
                    ? "Connecting..."
                    : "🔗 Connect GitHub (include private repos)"}
                </button>
              )}
            </div>
          </div>

          {/* Analysis Tier Selector (Phase 3) */}
          <div style={{ marginBottom: "1.25rem" }}>
            <label style={{ ...styles.label, marginBottom: "0.5rem", display: "block" }}>
              Analysis Tier:
            </label>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              {[
                { id: "quick", label: "⚡ Quick", desc: "≤150 REST, 8 repos" },
                { id: "standard", label: "🎯 Standard", desc: "≤400 REST, 12 repos" },
                { id: "deep", label: "🔬 Deep", desc: "≤700 REST, 15 repos" },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTier(t.id as "quick" | "standard" | "deep")}
                  style={{
                    padding: "0.5rem 0.85rem",
                    borderRadius: "8px",
                    border: tier === t.id ? "1px solid #a855f7" : "1px solid rgba(255,255,255,0.1)",
                    background: tier === t.id ? "rgba(168, 85, 247, 0.2)" : "rgba(255,255,255,0.03)",
                    color: tier === t.id ? "#e9d5ff" : "#94a3b8",
                    fontSize: "0.85rem",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "0.4rem",
                    fontWeight: tier === t.id ? 600 : 400,
                  }}
                >
                  <span>{t.label}</span>
                  <span style={{ fontSize: "0.75rem", opacity: 0.7 }}>({t.desc})</span>
                </button>
              ))}
            </div>
          </div>

          <button
            onClick={handleAnalyze}
            disabled={isAnalyzing || !url.trim()}
            style={{
              ...styles.analyzeButton,
              ...(isAnalyzing || !url.trim()
                ? styles.analyzeButtonDisabled
                : {}),
            }}
          >
            {isAnalyzing ? (
              <>
                <span style={styles.spinner} />
                Analyzing...
              </>
            ) : (
              <>🔍 Analyze</>
            )}
          </button>
        </div>

        {/* Progress */}
        {isAnalyzing && progress && (
          <div style={styles.progressSection}>
            <div style={styles.progressHeader}>
              <span style={styles.progressStage}>{progress.stage}</span>
              {progress.total > 0 && (
                <span style={styles.progressCount}>
                  {progress.done}/{progress.total}
                </span>
              )}
            </div>
            <div style={styles.progressBar}>
              <div
                style={{
                  ...styles.progressFill,
                  width:
                    progress.total > 0
                      ? `${(progress.done / progress.total) * 100}%`
                      : "0%",
                }}
              />
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div style={styles.errorBox}>
            <span style={styles.errorIcon}>⚠️</span>
            {error}
          </div>
        )}

        {/* Results */}
        {result && (
          <div style={styles.resultsSection}>
            {/* API Budget & Quota Overview Banner (Phase 3 & Phase 5) */}
            <div
              style={{
                background: "rgba(15, 23, 42, 0.7)",
                border: "1px solid rgba(139, 92, 246, 0.25)",
                borderRadius: "14px",
                padding: "1.25rem 1.5rem",
                marginBottom: "1.5rem",
                backdropFilter: "blur(12px)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  flexWrap: "wrap",
                  gap: "0.75rem",
                  marginBottom: "1rem",
                  borderBottom: "1px solid rgba(255, 255, 255, 0.08)",
                  paddingBottom: "0.75rem",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
                  <span style={{ fontSize: "1.2rem" }}>⚡</span>
                  <span style={{ fontWeight: 700, fontSize: "1rem", color: "#f1f5f9" }}>
                    GitHub API Budget & Rate Limit Accounting
                  </span>
                  <span
                    style={{
                      padding: "0.2rem 0.6rem",
                      borderRadius: "6px",
                      background: "rgba(168, 85, 247, 0.2)",
                      border: "1px solid rgba(168, 85, 247, 0.4)",
                      color: "#c084fc",
                      fontSize: "0.75rem",
                      fontWeight: 600,
                      textTransform: "capitalize",
                    }}
                  >
                    Tier: {tier} (Target: ≤{ANALYSIS_TIERS[tier].targetRestRequests} REST)
                  </span>
                </div>

                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                  {result.coverage.truncated ? (
                    <span
                      style={{
                        padding: "0.25rem 0.65rem",
                        borderRadius: "6px",
                        background: "rgba(239, 68, 68, 0.2)",
                        border: "1px solid rgba(239, 68, 68, 0.4)",
                        color: "#f87171",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    >
                      ⚠️ Coverage Truncated
                    </span>
                  ) : (
                    <span
                      style={{
                        padding: "0.25rem 0.65rem",
                        borderRadius: "6px",
                        background: "rgba(34, 197, 94, 0.2)",
                        border: "1px solid rgba(34, 197, 94, 0.4)",
                        color: "#4ade80",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    >
                      ✓ Coverage Complete
                    </span>
                  )}
                  {requestLog && requestLog.cacheHits > 0 && (
                    <span
                      style={{
                        padding: "0.25rem 0.65rem",
                        borderRadius: "6px",
                        background: "rgba(56, 189, 248, 0.2)",
                        border: "1px solid rgba(56, 189, 248, 0.4)",
                        color: "#38bdf8",
                        fontSize: "0.75rem",
                        fontWeight: 600,
                      }}
                    >
                      ⚡ {requestLog.cacheHits} Cache Hit{requestLog.cacheHits > 1 ? "s" : ""}
                    </span>
                  )}
                </div>
              </div>

              {/* Metric grid */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
                  gap: "0.75rem",
                }}
              >
                {/* 1. Estimated vs Used REST Requests */}
                <div
                  style={{
                    background: "rgba(0, 0, 0, 0.25)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    borderRadius: "10px",
                    padding: "0.85rem 1rem",
                  }}
                >
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.25rem" }}>
                    REST Requests (Used vs Est.)
                  </div>
                  <div style={{ display: "flex", alignItems: "baseline", gap: "0.35rem" }}>
                    <span
                      style={{
                        fontSize: "1.35rem",
                        fontWeight: 700,
                        color:
                          (requestLog?.restUsed ?? 0) <= ANALYSIS_TIERS[tier].targetRestRequests
                            ? "#4ade80"
                            : "#f87171",
                      }}
                    >
                      {requestLog?.restUsed ?? requestLog?.totalRequests ?? 0}
                    </span>
                    <span style={{ fontSize: "0.85rem", color: "#64748b" }}>
                      / ≤{ANALYSIS_TIERS[tier].targetRestRequests} est.
                    </span>
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "0.2rem" }}>
                    Cap: {ANALYSIS_TIERS[tier].detailTotalCap} commit details
                  </div>
                </div>

                {/* 2. GraphQL Points Used */}
                <div
                  style={{
                    background: "rgba(0, 0, 0, 0.25)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    borderRadius: "10px",
                    padding: "0.85rem 1rem",
                  }}
                >
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.25rem" }}>
                    GraphQL Points Used
                  </div>
                  <div style={{ fontSize: "1.35rem", fontWeight: 700, color: "#c084fc" }}>
                    {requestLog?.graphqlPointsUsed ?? 0}
                    <span style={{ fontSize: "0.8rem", fontWeight: 400, color: "#94a3b8", marginLeft: "0.3rem" }}>
                      pts
                    </span>
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "0.2rem" }}>
                    Batched queries (replaces ~{Math.max(1, Math.round(((requestLog?.graphqlPointsUsed ?? 1) * 3.5)))} REST calls)
                  </div>
                </div>

                {/* 3. Remaining REST & GraphQL Quota */}
                <div
                  style={{
                    background: "rgba(0, 0, 0, 0.25)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    borderRadius: "10px",
                    padding: "0.85rem 1rem",
                  }}
                >
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.25rem" }}>
                    Remaining Quota
                  </div>
                  <div style={{ fontSize: "1.35rem", fontWeight: 700, color: "#38bdf8" }}>
                    {requestLog?.restRemaining ?? requestLog?.rateLimitRemaining ?? 5000}
                    <span style={{ fontSize: "0.8rem", fontWeight: 400, color: "#94a3b8", marginLeft: "0.35rem" }}>
                      REST
                    </span>
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "0.2rem" }}>
                    Floor: {requestLog?.floor ?? ANALYSIS_TIERS[tier].rateLimitFloor} | GQL: {requestLog?.graphqlRemaining ?? 5000}
                  </div>
                </div>

                {/* 4. Cache Hits */}
                <div
                  style={{
                    background: "rgba(0, 0, 0, 0.25)",
                    border: "1px solid rgba(255, 255, 255, 0.06)",
                    borderRadius: "10px",
                    padding: "0.85rem 1rem",
                  }}
                >
                  <div style={{ fontSize: "0.75rem", color: "#94a3b8", marginBottom: "0.25rem" }}>
                    Cache Hits
                  </div>
                  <div style={{ fontSize: "1.35rem", fontWeight: 700, color: "#fbbf24" }}>
                    {requestLog?.cacheHits ?? 0}
                  </div>
                  <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "0.2rem" }}>
                    Warm repeat run: 0 REST commit calls
                  </div>
                </div>
              </div>

              {/* Coverage / Truncation Warnings and Notes */}
              {(result.coverage.truncated || result.coverage.notes.length > 0) && (
                <div
                  style={{
                    marginTop: "1rem",
                    padding: "0.75rem 1rem",
                    borderRadius: "8px",
                    background: result.coverage.truncated
                      ? "rgba(239, 68, 68, 0.12)"
                      : "rgba(245, 158, 11, 0.1)",
                    border: result.coverage.truncated
                      ? "1px solid rgba(239, 68, 68, 0.3)"
                      : "1px solid rgba(245, 158, 11, 0.25)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "0.4rem",
                      fontWeight: 600,
                      fontSize: "0.85rem",
                      color: result.coverage.truncated ? "#fca5a5" : "#fcd34d",
                      marginBottom: result.coverage.notes.length > 0 ? "0.35rem" : "0",
                    }}
                  >
                    <span>{result.coverage.truncated ? "⚠️ Coverage Truncation Warning:" : "ℹ️ Coverage Notes:"}</span>
                    {result.coverage.truncated && (
                      <span style={{ fontWeight: 400, fontSize: "0.8rem" }}>
                        Analysis stopped before exhausting rate limits or caps.
                      </span>
                    )}
                  </div>
                  {result.coverage.notes.map((note, idx) => (
                    <div
                      key={idx}
                      style={{
                        fontSize: "0.75rem",
                        color: result.coverage.truncated ? "#fecaca" : "#fef08a",
                        paddingLeft: "1.2rem",
                        lineHeight: 1.5,
                      }}
                    >
                      • {note}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Tab bar */}
            <div style={styles.tabBar}>
              <button
                style={{
                  ...styles.tab,
                  ...(activeTab === "profile" ? styles.tabActive : {}),
                }}
                onClick={() => setActiveTab("profile")}
              >
                🎯 Skill Profile
              </button>
              <button
                style={{
                  ...styles.tab,
                  ...(activeTab === "gaps" ? styles.tabActive : {}),
                }}
                onClick={() => setActiveTab("gaps")}
              >
                ⚖️ Role Gap Analysis
              </button>
              <button
                style={{
                  ...styles.tab,
                  ...(activeTab === "summary" ? styles.tabActive : {}),
                }}
                onClick={() => setActiveTab("summary")}
              >
                📊 Evidence Summary
              </button>
              <button
                style={{
                  ...styles.tab,
                  ...(activeTab === "json" ? styles.tabActive : {}),
                }}
                onClick={() => setActiveTab("json")}
              >
                📋 Raw JSON
              </button>
              <button
                style={{
                  ...styles.tab,
                  ...(activeTab === "log" ? styles.tabActive : {}),
                }}
                onClick={() => setActiveTab("log")}
              >
                📡 Request Log
              </button>
            </div>

            {/* Tab content */}
            <div style={styles.tabContent}>
              {activeTab === "profile" && profile && (
                <div>
                  <div style={styles.targetInfo}>
                    <h3 style={styles.sectionTitle}>
                      Candidate Skill Profile · @{profile.target.login}
                    </h3>
                    <div style={styles.metaRow}>
                      <span style={styles.metaItem}>
                        Total Skills Assessed: <strong>{profile.skills.length}</strong>
                      </span>
                      <span style={styles.metaItem}>
                        Evidence-Backed:{" "}
                        <strong>
                          {profile.skills.filter((s) => s.level !== "No evidence").length}
                        </strong>
                      </span>
                      <span style={styles.metaItem}>
                        Mode: {profile.target.mode}
                      </span>
                    </div>
                  </div>

                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
                      gap: "1rem",
                      marginTop: "1.5rem",
                    }}
                  >
                    {profile.skills.map((skill) => {
                      const levelNum = typeof skill.level === "number" ? skill.level : 0;

                      let badgeBg = "rgba(71, 85, 105, 0.2)";
                      let badgeColor = "#94a3b8";
                      let badgeBorder = "1px solid rgba(71, 85, 105, 0.4)";
                      let levelLabel = "No evidence";

                      if (levelNum === 5) {
                        badgeBg = "rgba(168, 85, 247, 0.2)";
                        badgeColor = "#c084fc";
                        badgeBorder = "1px solid rgba(168, 85, 247, 0.5)";
                        levelLabel = "Mastery (Level 5)";
                      } else if (levelNum === 4) {
                        badgeBg = "rgba(59, 130, 246, 0.2)";
                        badgeColor = "#60a5fa";
                        badgeBorder = "1px solid rgba(59, 130, 246, 0.5)";
                        levelLabel = "Proficient (Level 4)";
                      } else if (levelNum === 3) {
                        badgeBg = "rgba(16, 185, 129, 0.2)";
                        badgeColor = "#34d399";
                        badgeBorder = "1px solid rgba(16, 185, 129, 0.5)";
                        levelLabel = "Competent (Level 3)";
                      } else if (levelNum === 2) {
                        badgeBg = "rgba(245, 158, 11, 0.2)";
                        badgeColor = "#fbbf24";
                        badgeBorder = "1px solid rgba(245, 158, 11, 0.5)";
                        levelLabel = "Developing (Level 2)";
                      } else if (levelNum === 1) {
                        badgeBg = "rgba(100, 116, 139, 0.2)";
                        badgeColor = "#cbd5e1";
                        badgeBorder = "1px solid rgba(100, 116, 139, 0.5)";
                        levelLabel = "Novice (Level 1)";
                      }

                      let strengthColor = "#94a3b8";
                      if (skill.evidenceStrength === "High") strengthColor = "#34d399";
                      if (skill.evidenceStrength === "Medium") strengthColor = "#fbbf24";

                      return (
                        <div
                          key={skill.skill}
                          style={{
                            background: "rgba(0, 0, 0, 0.25)",
                            border: "1px solid rgba(255, 255, 255, 0.08)",
                            borderRadius: "12px",
                            padding: "1.25rem",
                            display: "flex",
                            flexDirection: "column",
                            gap: "0.75rem",
                          }}
                        >
                          <div
                            style={{
                              display: "flex",
                              justifyContent: "space-between",
                              alignItems: "flex-start",
                            }}
                          >
                            <div>
                              <h4
                                style={{
                                  fontSize: "1.1rem",
                                  fontWeight: 700,
                                  color: "#f1f5f9",
                                  margin: 0,
                                }}
                              >
                                {skill.skill}
                              </h4>
                              <div
                                style={{
                                  fontSize: "0.75rem",
                                  color: strengthColor,
                                  marginTop: "0.2rem",
                                }}
                              >
                                ● {skill.evidenceStrength} Evidence
                              </div>
                            </div>
                            <span
                              style={{
                                padding: "0.25rem 0.65rem",
                                borderRadius: "8px",
                                background: badgeBg,
                                color: badgeColor,
                                border: badgeBorder,
                                fontSize: "0.75rem",
                                fontWeight: 600,
                              }}
                            >
                              {levelLabel}
                            </span>
                          </div>

                          {/* Composite Score Bar */}
                          <div>
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "space-between",
                                fontSize: "0.75rem",
                                color: "#94a3b8",
                                marginBottom: "0.25rem",
                              }}
                            >
                              <span>Composite Score</span>
                              <span>
                                {Math.round(skill.rawScore * 100)} / 100
                              </span>
                            </div>
                            <div
                              style={{
                                width: "100%",
                                height: "6px",
                                background: "rgba(255, 255, 255, 0.06)",
                                borderRadius: "3px",
                                overflow: "hidden",
                              }}
                            >
                              <div
                                style={{
                                  width: `${Math.round(skill.rawScore * 100)}%`,
                                  height: "100%",
                                  background: badgeColor,
                                  borderRadius: "3px",
                                }}
                              />
                            </div>
                          </div>

                          {/* 4-Signal Breakdown (V, D, T, Q) */}
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: "repeat(4, 1fr)",
                              gap: "0.4rem",
                              paddingTop: "0.25rem",
                            }}
                          >
                            <div style={{ textAlign: "center" }}>
                              <div
                                style={{ fontSize: "0.65rem", color: "#64748b" }}
                              >
                                Volume (V)
                              </div>
                              <div
                                style={{
                                  fontSize: "0.8rem",
                                  fontWeight: 600,
                                  color: "#e2e8f0",
                                }}
                              >
                                {skill.signals.volume !== null
                                  ? `${Math.round(skill.signals.volume * 100)}%`
                                  : "N/A"}
                              </div>
                            </div>
                            <div style={{ textAlign: "center" }}>
                              <div
                                style={{ fontSize: "0.65rem", color: "#64748b" }}
                              >
                                Depth (D)
                              </div>
                              <div
                                style={{
                                  fontSize: "0.8rem",
                                  fontWeight: 600,
                                  color: "#e2e8f0",
                                }}
                              >
                                {skill.signals.depth !== null
                                  ? `${Math.round(skill.signals.depth * 100)}%`
                                  : "N/A"}
                              </div>
                            </div>
                            <div style={{ textAlign: "center" }}>
                              <div
                                style={{ fontSize: "0.65rem", color: "#64748b" }}
                              >
                                Sustained (T)
                              </div>
                              <div
                                style={{
                                  fontSize: "0.8rem",
                                  fontWeight: 600,
                                  color: "#e2e8f0",
                                }}
                              >
                                {skill.signals.sustained !== null
                                  ? `${Math.round(skill.signals.sustained * 100)}%`
                                  : "N/A"}
                              </div>
                            </div>
                            <div style={{ textAlign: "center" }}>
                              <div
                                style={{ fontSize: "0.65rem", color: "#64748b" }}
                              >
                                Quality (Q)
                              </div>
                              <div
                                style={{
                                  fontSize: "0.8rem",
                                  fontWeight: 600,
                                  color: "#e2e8f0",
                                }}
                              >
                                {skill.signals.quality !== null
                                  ? `${Math.round(skill.signals.quality * 100)}%`
                                  : "N/A"}
                              </div>
                            </div>
                          </div>

                          {/* Gating Notes */}
                          {skill.gatingNotes.length > 0 && (
                            <div
                              style={{
                                background: "rgba(245, 158, 11, 0.08)",
                                border: "1px solid rgba(245, 158, 11, 0.2)",
                                borderRadius: "6px",
                                padding: "0.5rem 0.65rem",
                                fontSize: "0.75rem",
                                color: "#fcd34d",
                                lineHeight: 1.4,
                              }}
                            >
                              ⚠️ {skill.gatingNotes.join(" ")}
                            </div>
                          )}

                          {/* Metrics summary */}
                          <div
                            style={{
                              borderTop: "1px solid rgba(255, 255, 255, 0.05)",
                              paddingTop: "0.5rem",
                              display: "flex",
                              justifyContent: "space-between",
                              fontSize: "0.7rem",
                              color: "#64748b",
                            }}
                          >
                            <span>
                              {skill.metrics.distinctFiles} files ·{" "}
                              {skill.metrics.reposCount} repos
                            </span>
                            <span>{skill.metrics.activeMonths36} active months</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {activeTab === "gaps" && profile && (
                <div>
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      flexWrap: "wrap",
                      gap: "1rem",
                      marginBottom: "1.5rem",
                    }}
                  >
                    <div>
                      <h3 style={styles.sectionTitle}>
                        Role Benchmark Gap Analysis
                      </h3>
                      <p
                        style={{
                          fontSize: "0.85rem",
                          color: "#94a3b8",
                          margin: 0,
                        }}
                      >
                        Evaluate target competencies against standard industry role profiles.
                      </p>
                    </div>

                    <div
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "0.5rem",
                      }}
                    >
                      <label style={{ fontSize: "0.85rem", color: "#cbd5e1" }}>
                        Target Role:
                      </label>
                      <select
                        value={selectedRoleId}
                        onChange={(e) => setSelectedRoleId(e.target.value)}
                        style={{
                          background: "#1e1b4b",
                          color: "#e2e8f0",
                          border: "1px solid rgba(139, 92, 246, 0.4)",
                          borderRadius: "8px",
                          padding: "0.4rem 0.8rem",
                          fontSize: "0.85rem",
                          outline: "none",
                        }}
                      >
                        {STANDARD_ROLE_BENCHMARKS.map((r) => (
                          <option key={r.roleId} value={r.roleId}>
                            {r.roleName}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {(() => {
                    const currentBenchmark =
                      STANDARD_ROLE_BENCHMARKS.find(
                        (r) => r.roleId === selectedRoleId
                      ) || STANDARD_ROLE_BENCHMARKS[0];
                    const gapAnalysis = analyzeRoleGap(profile, currentBenchmark);

                    return (
                      <div>
                        {/* Match Meter Card */}
                        <div
                          style={{
                            background:
                              "linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(59, 130, 246, 0.15))",
                            border: "1px solid rgba(139, 92, 246, 0.3)",
                            borderRadius: "14px",
                            padding: "1.5rem",
                            marginBottom: "1.5rem",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "space-between",
                            flexWrap: "wrap",
                            gap: "1.5rem",
                          }}
                        >
                          <div>
                            <div
                              style={{
                                fontSize: "1.3rem",
                                fontWeight: 700,
                                color: "#fff",
                              }}
                            >
                              {gapAnalysis.roleName}
                            </div>
                            <div
                              style={{
                                fontSize: "0.85rem",
                                color: "#94a3b8",
                                marginTop: "0.25rem",
                              }}
                            >
                              {currentBenchmark.description}
                            </div>
                          </div>

                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "1rem",
                            }}
                          >
                            <div style={{ textAlign: "right" }}>
                              <div
                                style={{
                                  fontSize: "2rem",
                                  fontWeight: 800,
                                  color: "#a78bfa",
                                }}
                              >
                                {gapAnalysis.matchPercentage}%
                              </div>
                              <div
                                style={{
                                  fontSize: "0.75rem",
                                  color: "#64748b",
                                }}
                              >
                                Role Readiness
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* Skill Requirements Breakdown */}
                        <h4 style={styles.sectionTitle}>
                          Required Skill Competencies
                        </h4>
                        <div style={styles.tableWrapper}>
                          <table style={styles.table}>
                            <thead>
                              <tr>
                                <th style={styles.th}>Skill</th>
                                <th style={styles.th}>Importance</th>
                                <th
                                  style={{
                                    ...styles.th,
                                    textAlign: "center",
                                  }}
                                >
                                  Required
                                </th>
                                <th
                                  style={{
                                    ...styles.th,
                                    textAlign: "center",
                                  }}
                                >
                                  Current
                                </th>
                                <th
                                  style={{
                                    ...styles.th,
                                    textAlign: "center",
                                  }}
                                >
                                  Status
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {gapAnalysis.gaps.map((gap) => {
                                let statusBg = "rgba(100, 116, 139, 0.2)";
                                let statusColor = "#94a3b8";

                                if (gap.status === "Exceeds") {
                                  statusBg = "rgba(168, 85, 247, 0.2)";
                                  statusColor = "#c084fc";
                                } else if (gap.status === "Meets") {
                                  statusBg = "rgba(16, 185, 129, 0.2)";
                                  statusColor = "#34d399";
                                } else if (gap.status === "Developing") {
                                  statusBg = "rgba(245, 158, 11, 0.2)";
                                  statusColor = "#fbbf24";
                                } else if (
                                  gap.status === "Missing Evidence"
                                ) {
                                  statusBg = "rgba(239, 68, 68, 0.2)";
                                  statusColor = "#f87171";
                                }

                                return (
                                  <tr key={gap.skill} style={styles.tr}>
                                    <td
                                      style={{
                                        ...styles.td,
                                        fontWeight: 600,
                                        color: "#f1f5f9",
                                      }}
                                    >
                                      {gap.skill}
                                    </td>
                                    <td style={styles.td}>
                                      <span
                                        style={{
                                          fontSize: "0.75rem",
                                          color:
                                            gap.importance === "required"
                                              ? "#f43f5e"
                                              : "#94a3b8",
                                          textTransform: "capitalize",
                                        }}
                                      >
                                        {gap.importance}
                                      </span>
                                    </td>
                                    <td
                                      style={{
                                        ...styles.td,
                                        textAlign: "center",
                                        color: "#cbd5e1",
                                      }}
                                    >
                                      Level {gap.requiredLevel}
                                    </td>
                                    <td
                                      style={{
                                        ...styles.td,
                                        textAlign: "center",
                                        fontWeight: 600,
                                      }}
                                    >
                                      {typeof gap.currentLevel === "number"
                                        ? `Level ${gap.currentLevel}`
                                        : "No evidence"}
                                    </td>
                                    <td
                                      style={{
                                        ...styles.td,
                                        textAlign: "center",
                                      }}
                                    >
                                      <span
                                        style={{
                                          padding: "0.2rem 0.55rem",
                                          borderRadius: "6px",
                                          background: statusBg,
                                          color: statusColor,
                                          fontSize: "0.75rem",
                                          fontWeight: 600,
                                        }}
                                      >
                                        {gap.status}{" "}
                                        {gap.delta !== 0 &&
                                        typeof gap.currentLevel === "number"
                                          ? `(${gap.delta > 0 ? "+" : ""}${gap.delta})`
                                          : ""}
                                      </span>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>

                        {/* Strengths & Recommendations */}
                        <div
                          style={{
                            display: "grid",
                            gridTemplateColumns:
                              "repeat(auto-fit, minmax(300px, 1fr))",
                            gap: "1rem",
                            marginTop: "1.5rem",
                          }}
                        >
                          <div
                            style={{
                              background: "rgba(0, 0, 0, 0.2)",
                              border: "1px solid rgba(255, 255, 255, 0.06)",
                              borderRadius: "10px",
                              padding: "1.25rem",
                            }}
                          >
                            <h4
                              style={{
                                fontSize: "0.95rem",
                                fontWeight: 600,
                                color: "#34d399",
                                margin: "0 0 0.75rem 0",
                              }}
                            >
                              ✅ Key Strengths
                            </h4>
                            {gapAnalysis.strengths.length > 0 ? (
                              <ul
                                style={{
                                  margin: 0,
                                  paddingLeft: "1.25rem",
                                  color: "#cbd5e1",
                                  fontSize: "0.85rem",
                                  lineHeight: 1.6,
                                }}
                              >
                                {gapAnalysis.strengths.map((str, i) => (
                                  <li key={i}>{str}</li>
                                ))}
                              </ul>
                            ) : (
                              <div
                                style={{ fontSize: "0.8rem", color: "#64748b" }}
                              >
                                No matching strengths identified for this profile yet.
                              </div>
                            )}
                          </div>

                          <div
                            style={{
                              background: "rgba(0, 0, 0, 0.2)",
                              border: "1px solid rgba(255, 255, 255, 0.06)",
                              borderRadius: "10px",
                              padding: "1.25rem",
                            }}
                          >
                            <h4
                              style={{
                                fontSize: "0.95rem",
                                fontWeight: 600,
                                color: "#a78bfa",
                                margin: "0 0 0.75rem 0",
                              }}
                            >
                              🚀 Targeted Learning Priorities
                            </h4>
                            {gapAnalysis.recommendations.length > 0 ? (
                              <ul
                                style={{
                                  margin: 0,
                                  paddingLeft: "1.25rem",
                                  color: "#cbd5e1",
                                  fontSize: "0.85rem",
                                  lineHeight: 1.6,
                                }}
                              >
                                {gapAnalysis.recommendations.map((rec, i) => (
                                  <li key={i}>{rec}</li>
                                ))}
                              </ul>
                            ) : (
                              <div
                                style={{ fontSize: "0.8rem", color: "#34d399" }}
                              >
                                All competencies fully satisfied for this role benchmark!
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              )}
              {activeTab === "summary" && (
                <div>
                  {/* Target info */}
                  <div style={styles.targetInfo}>
                    <h3 style={styles.sectionTitle}>
                      Target: @{result.target.login}
                    </h3>
                    <div style={styles.metaRow}>
                      <span style={styles.metaItem}>
                        Mode: {result.target.mode}
                      </span>
                      <span style={styles.metaItem}>
                        Repos: {result.coverage.reposAnalyzed}/
                        {result.coverage.reposDiscovered}
                      </span>
                      <span style={styles.metaItem}>
                        Commits listed:{" "}
                        {result.coverage.commitsListed}
                      </span>
                      <span style={styles.metaItem}>
                        Commits detailed:{" "}
                        {result.coverage.commitsDetailed}
                      </span>
                    </div>
                  </div>

                  {/* Skills table */}
                  <h3 style={styles.sectionTitle}>Per-Skill Evidence</h3>
                  <div style={styles.tableWrapper}>
                    <table style={styles.table}>
                      <thead>
                        <tr>
                          <th style={styles.th}>Skill</th>
                          <th style={{ ...styles.th, textAlign: "right" }}>
                            Files
                          </th>
                          <th style={{ ...styles.th, textAlign: "right" }}>
                            +Lines
                          </th>
                          <th style={{ ...styles.th, textAlign: "right" }}>
                            -Lines
                          </th>
                          <th style={{ ...styles.th, textAlign: "right" }}>
                            Repos
                          </th>
                          <th style={{ ...styles.th, textAlign: "right" }}>
                            Active Mo. (12)
                          </th>
                          <th style={{ ...styles.th, textAlign: "right" }}>
                            Active Mo. (36)
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {getSkillSummary().map((row) => (
                          <tr key={row.skill} style={styles.tr}>
                            <td style={styles.td}>
                              <span style={styles.skillBadge}>
                                {row.skill}
                              </span>
                            </td>
                            <td style={{ ...styles.td, textAlign: "right" }}>
                              {row.files.toLocaleString()}
                            </td>
                            <td
                              style={{
                                ...styles.td,
                                textAlign: "right",
                                color: "#4ade80",
                              }}
                            >
                              +{row.additions.toLocaleString()}
                            </td>
                            <td
                              style={{
                                ...styles.td,
                                textAlign: "right",
                                color: "#f87171",
                              }}
                            >
                              -{row.deletions.toLocaleString()}
                            </td>
                            <td style={{ ...styles.td, textAlign: "right" }}>
                              {row.repos}
                            </td>
                            <td style={{ ...styles.td, textAlign: "right" }}>
                              {row.activeMonths12}
                            </td>
                            <td style={{ ...styles.td, textAlign: "right" }}>
                              {row.activeMonths36}
                            </td>
                          </tr>
                        ))}
                        {getSkillSummary().length === 0 && (
                          <tr>
                            <td
                              colSpan={7}
                              style={{
                                ...styles.td,
                                textAlign: "center",
                                opacity: 0.5,
                              }}
                            >
                              No skill evidence found
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Collaboration */}
                  <h3 style={styles.sectionTitle}>Collaboration</h3>
                  <div style={styles.collabGrid}>
                    <div style={styles.collabCard}>
                      <div style={styles.collabValue}>
                        {result.collaboration.prsOpened}
                      </div>
                      <div style={styles.collabLabel}>PRs Opened</div>
                    </div>
                    <div style={styles.collabCard}>
                      <div style={styles.collabValue}>
                        {result.collaboration.reviewsGiven}
                      </div>
                      <div style={styles.collabLabel}>Reviews Given</div>
                    </div>
                    <div style={styles.collabCard}>
                      <div style={styles.collabValue}>
                        {result.collaboration.issuesOpened}
                      </div>
                      <div style={styles.collabLabel}>Issues Opened</div>
                    </div>
                    <div style={styles.collabCard}>
                      <div style={styles.collabValue}>
                        {result.collaboration.comments}
                      </div>
                      <div style={styles.collabLabel}>Comments</div>
                    </div>
                  </div>

                  {/* Repo stacks */}
                  <h3 style={styles.sectionTitle}>Repo Stacks</h3>
                  <div style={styles.repoList}>
                    {result.repos.map((repo) => (
                      <div key={repo.fullName} style={styles.repoCard}>
                        <div style={styles.repoName}>
                          {repo.isPrivate && (
                            <span style={styles.privateBadge}>🔒</span>
                          )}
                          {repo.fullName}
                        </div>
                        <div style={styles.repoMeta}>
                          <span>
                            {repo.commits.length} detailed commits
                          </span>
                          <span>
                            {repo.commitDates.length} total commits
                          </span>
                        </div>
                        {repo.stack.length > 0 && (
                          <div style={styles.stackList}>
                            {repo.stack.map((s) => (
                              <span key={s} style={styles.stackBadge}>
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {/* Coverage notes */}
                  {result.coverage.notes.length > 0 && (
                    <>
                      <h3 style={styles.sectionTitle}>Coverage Notes</h3>
                      <div style={styles.notesList}>
                        {result.coverage.notes.map((note, i) => (
                          <div key={i} style={styles.noteItem}>
                            ℹ️ {note}
                          </div>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {activeTab === "json" && (
                <div>
                  <button
                    onClick={handleCopyJson}
                    style={styles.copyButton}
                  >
                    {copied ? "✅ Copied!" : "📋 Copy JSON"}
                  </button>
                  <pre style={styles.jsonPre}>
                    {JSON.stringify(result, null, 2)}
                  </pre>
                </div>
              )}

              {activeTab === "log" && (
                <div>
                  <div style={styles.logGrid}>
                    <div style={styles.logCard}>
                      <div style={{ ...styles.logValue, color: "#94a3b8" }}>
                        ≤{ANALYSIS_TIERS[tier].targetRestRequests}
                      </div>
                      <div style={styles.logLabel}>Estimated REST Target</div>
                      <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "0.2rem" }}>
                        Cap: {ANALYSIS_TIERS[tier].detailTotalCap} commit details
                      </div>
                    </div>
                    <div style={styles.logCard}>
                      <div
                        style={{
                          ...styles.logValue,
                          color:
                            (requestLog?.restUsed ?? 0) <= ANALYSIS_TIERS[tier].targetRestRequests
                              ? "#4ade80"
                              : "#f87171",
                        }}
                      >
                        {requestLog?.restUsed ?? requestLog?.totalRequests ?? 0}
                      </div>
                      <div style={styles.logLabel}>Used REST Requests</div>
                      <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "0.2rem" }}>
                        {(requestLog?.restUsed ?? 0) <= ANALYSIS_TIERS[tier].targetRestRequests
                          ? "✓ Within budget"
                          : "⚠️ Exceeded estimate"}
                      </div>
                    </div>
                    <div style={styles.logCard}>
                      <div style={{ ...styles.logValue, color: "#c084fc" }}>
                        {requestLog?.graphqlPointsUsed ?? 0}
                      </div>
                      <div style={styles.logLabel}>GraphQL Points Used</div>
                      <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "0.2rem" }}>
                        Target: ≤30 queries
                      </div>
                    </div>
                    <div style={styles.logCard}>
                      <div style={{ ...styles.logValue, color: "#38bdf8" }}>
                        {requestLog?.cacheHits ?? 0}
                      </div>
                      <div style={styles.logLabel}>Cache Hits</div>
                      <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "0.2rem" }}>
                        Zero-cost responses
                      </div>
                    </div>
                    <div style={styles.logCard}>
                      <div style={{ ...styles.logValue, color: "#34d399" }}>
                        {requestLog?.restRemaining ?? requestLog?.rateLimitRemaining ?? 5000}
                      </div>
                      <div style={styles.logLabel}>REST Remaining</div>
                      <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "0.2rem" }}>
                        Safety Floor: {requestLog?.floor ?? ANALYSIS_TIERS[tier].rateLimitFloor}
                      </div>
                    </div>
                    <div style={styles.logCard}>
                      <div style={{ ...styles.logValue, color: "#a78bfa" }}>
                        {requestLog?.graphqlRemaining ?? 5000}
                      </div>
                      <div style={styles.logLabel}>GraphQL Remaining</div>
                      <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "0.2rem" }}>
                        Reset: 5000/hr
                      </div>
                    </div>
                    <div style={styles.logCard}>
                      <div
                        style={{
                          ...styles.logValue,
                          color: result.coverage.truncated
                            ? "#f87171"
                            : "#4ade80",
                        }}
                      >
                        {result.coverage.truncated
                          ? "Truncated"
                          : "Complete"}
                      </div>
                      <div style={styles.logLabel}>Coverage Status</div>
                      <div style={{ fontSize: "0.7rem", color: "#64748b", marginTop: "0.2rem" }}>
                        {result.coverage.truncated
                          ? "Stopped early"
                          : "Full window covered"}
                      </div>
                    </div>
                  </div>

                  {requestLog?.rateLimitReset && (
                    <div style={{ marginTop: "1rem", fontSize: "0.8rem", color: "#94a3b8" }}>
                      Rate limit resets at: {new Date(requestLog.rateLimitReset).toLocaleTimeString()}
                    </div>
                  )}

                  {requestLog?.byEndpoint &&
                    Object.keys(requestLog.byEndpoint).length > 0 && (
                      <div style={{ marginTop: "1.5rem" }}>
                        <h4 style={styles.sectionTitle}>Calls by Endpoint</h4>
                        <div style={styles.tableWrapper}>
                          <table style={styles.table}>
                            <thead>
                              <tr>
                                <th style={styles.th}>Endpoint Pattern</th>
                                <th style={{ ...styles.th, textAlign: "right" }}>
                                  Count
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              {Object.entries(requestLog.byEndpoint).map(
                                ([endpoint, count]) => (
                                  <tr key={endpoint} style={styles.tr}>
                                    <td style={styles.td}>
                                      <code style={{ color: "#c4b5fd" }}>
                                        {endpoint}
                                      </code>
                                    </td>
                                    <td
                                      style={{
                                        ...styles.td,
                                        textAlign: "right",
                                        fontWeight: 600,
                                      }}
                                    >
                                      {count}
                                    </td>
                                  </tr>
                                )
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Manual PAT Fallback Modal */}
        {showManualTokenModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.75)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 1000,
              padding: "1rem",
              backdropFilter: "blur(4px)",
            }}
          >
            <div
              style={{
                background: "#13132b",
                border: "1px solid rgba(139, 92, 246, 0.3)",
                borderRadius: "16px",
                padding: "2rem",
                maxWidth: "480px",
                width: "100%",
                color: "#e2e8f0",
              }}
            >
              <h3 style={{ fontSize: "1.2rem", fontWeight: 600, marginBottom: "0.5rem", color: "#c4b5fd" }}>
                Connect GitHub Token
              </h3>
              <p style={{ fontSize: "0.85rem", color: "#94a3b8", marginBottom: "1.25rem", lineHeight: 1.5 }}>
                Provide your GitHub username and Personal Access Token (classic with <code>repo</code> scope) to analyze your private repositories in this dev harness.
              </p>
              <div style={{ marginBottom: "1rem" }}>
                <label style={styles.label}>GitHub Username</label>
                <input
                  type="text"
                  placeholder="e.g. your-github-handle"
                  value={manualLogin}
                  onChange={(e) => setManualLogin(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div style={{ marginBottom: "1.5rem" }}>
                <label style={styles.label}>Personal Access Token</label>
                <input
                  type="password"
                  placeholder="ghp_..."
                  value={manualToken}
                  onChange={(e) => setManualToken(e.target.value)}
                  style={styles.input}
                />
              </div>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setShowManualTokenModal(false)}
                  style={{
                    padding: "0.5rem 1rem",
                    borderRadius: "8px",
                    border: "1px solid rgba(255, 255, 255, 0.1)",
                    background: "transparent",
                    color: "#94a3b8",
                    cursor: "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleSaveManualToken}
                  disabled={!manualLogin.trim() || !manualToken.trim()}
                  style={{
                    padding: "0.5rem 1.25rem",
                    borderRadius: "8px",
                    border: "none",
                    background: "linear-gradient(135deg, #7c3aed, #4f46e5)",
                    color: "#fff",
                    fontWeight: 600,
                    cursor: "pointer",
                  }}
                >
                  Save & Connect
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── Styles (inline, matching the project's aesthetic) ────────────────

const styles: Record<string, React.CSSProperties> = {
  page: {
    minHeight: "100vh",
    background: "linear-gradient(135deg, #0a0a1a 0%, #1a0a2e 50%, #0a1628 100%)",
    color: "#e2e8f0",
    fontFamily:
      "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    padding: "2rem 1rem",
  },
  container: {
    maxWidth: "1100px",
    margin: "0 auto",
  },
  header: {
    position: "relative",
    textAlign: "center",
    marginBottom: "2rem",
    padding: "2rem",
  },
  headerGlow: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    width: "300px",
    height: "300px",
    background:
      "radial-gradient(circle, rgba(139, 92, 246, 0.15) 0%, transparent 70%)",
    borderRadius: "50%",
    pointerEvents: "none",
  },
  title: {
    fontSize: "2.5rem",
    fontWeight: 800,
    background: "linear-gradient(135deg, #a78bfa 0%, #818cf8 50%, #6366f1 100%)",
    WebkitBackgroundClip: "text",
    WebkitTextFillColor: "transparent",
    marginBottom: "0.5rem",
    letterSpacing: "-0.02em",
  },
  titleIcon: {
    WebkitTextFillColor: "initial",
    marginRight: "0.5rem",
  },
  subtitle: {
    fontSize: "1rem",
    color: "#94a3b8",
    marginBottom: "1rem",
  },
  modeBadge: {
    display: "inline-block",
    padding: "0.25rem 1rem",
    borderRadius: "999px",
    background: "rgba(139, 92, 246, 0.15)",
    border: "1px solid rgba(139, 92, 246, 0.3)",
    color: "#a78bfa",
    fontSize: "0.85rem",
    fontWeight: 500,
  },
  inputSection: {
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    borderRadius: "16px",
    padding: "1.5rem",
    marginBottom: "1.5rem",
    backdropFilter: "blur(20px)",
  },
  inputGroup: {
    marginBottom: "1rem",
  },
  inputRow: {
    display: "flex",
    gap: "1rem",
    alignItems: "flex-end",
    marginBottom: "1rem",
    flexWrap: "wrap" as const,
  },
  label: {
    display: "block",
    fontSize: "0.85rem",
    color: "#94a3b8",
    marginBottom: "0.35rem",
    fontWeight: 500,
  },
  optional: {
    color: "#64748b",
    fontWeight: 400,
  },
  input: {
    width: "100%",
    padding: "0.75rem 1rem",
    borderRadius: "10px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    background: "rgba(0, 0, 0, 0.3)",
    color: "#e2e8f0",
    fontSize: "0.95rem",
    outline: "none",
    transition: "border-color 0.2s",
    boxSizing: "border-box" as const,
  },
  checkboxGroup: {
    display: "flex",
    alignItems: "center",
    paddingBottom: "0.2rem",
  },
  checkboxLabel: {
    display: "flex",
    alignItems: "center",
    gap: "0.5rem",
    fontSize: "0.9rem",
    color: "#94a3b8",
    cursor: "pointer",
    whiteSpace: "nowrap" as const,
  },
  checkbox: {
    accentColor: "#8b5cf6",
    width: "16px",
    height: "16px",
  },
  analyzeButton: {
    width: "100%",
    padding: "0.85rem",
    borderRadius: "10px",
    border: "none",
    background: "linear-gradient(135deg, #8b5cf6 0%, #6366f1 100%)",
    color: "white",
    fontSize: "1rem",
    fontWeight: 600,
    cursor: "pointer",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    gap: "0.5rem",
    transition: "opacity 0.2s, transform 0.1s",
  },
  analyzeButtonDisabled: {
    opacity: 0.5,
    cursor: "not-allowed",
  },
  spinner: {
    display: "inline-block",
    width: "16px",
    height: "16px",
    border: "2px solid rgba(255,255,255,0.3)",
    borderTopColor: "white",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
  },
  progressSection: {
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    borderRadius: "12px",
    padding: "1.25rem",
    marginBottom: "1.5rem",
  },
  progressHeader: {
    display: "flex",
    justifyContent: "space-between",
    marginBottom: "0.75rem",
  },
  progressStage: {
    fontSize: "0.9rem",
    color: "#a78bfa",
    fontWeight: 500,
  },
  progressCount: {
    fontSize: "0.85rem",
    color: "#64748b",
  },
  progressBar: {
    width: "100%",
    height: "6px",
    borderRadius: "3px",
    background: "rgba(255, 255, 255, 0.06)",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: "3px",
    background: "linear-gradient(90deg, #8b5cf6, #6366f1)",
    transition: "width 0.3s ease",
  },
  errorBox: {
    background: "rgba(239, 68, 68, 0.1)",
    border: "1px solid rgba(239, 68, 68, 0.3)",
    borderRadius: "12px",
    padding: "1rem 1.25rem",
    marginBottom: "1.5rem",
    color: "#fca5a5",
    fontSize: "0.9rem",
    display: "flex",
    alignItems: "flex-start",
    gap: "0.5rem",
  },
  errorIcon: {
    flexShrink: 0,
  },
  warningBox: {
    background: "rgba(245, 158, 11, 0.1)",
    border: "1px solid rgba(245, 158, 11, 0.3)",
    borderRadius: "12px",
    padding: "1rem 1.25rem",
    marginBottom: "1rem",
    color: "#fcd34d",
    fontSize: "0.85rem",
  },
  warningIcon: {
    marginRight: "0.5rem",
  },
  warningNote: {
    marginTop: "0.25rem",
    paddingLeft: "1.5rem",
    color: "#d4a843",
    fontSize: "0.8rem",
  },
  resultsSection: {
    background: "rgba(255, 255, 255, 0.03)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    borderRadius: "16px",
    padding: "1.5rem",
    backdropFilter: "blur(20px)",
  },
  tabBar: {
    display: "flex",
    gap: "0.5rem",
    marginBottom: "1.5rem",
    borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
    paddingBottom: "0.75rem",
  },
  tab: {
    padding: "0.5rem 1rem",
    borderRadius: "8px",
    border: "none",
    background: "transparent",
    color: "#64748b",
    fontSize: "0.85rem",
    fontWeight: 500,
    cursor: "pointer",
    transition: "all 0.2s",
  },
  tabActive: {
    background: "rgba(139, 92, 246, 0.15)",
    color: "#a78bfa",
  },
  tabContent: {},
  targetInfo: {
    marginBottom: "1.5rem",
  },
  sectionTitle: {
    fontSize: "1.1rem",
    fontWeight: 600,
    color: "#c4b5fd",
    marginBottom: "0.75rem",
    marginTop: "1.5rem",
  },
  metaRow: {
    display: "flex",
    gap: "1.5rem",
    flexWrap: "wrap" as const,
  },
  metaItem: {
    fontSize: "0.85rem",
    color: "#94a3b8",
  },
  tableWrapper: {
    overflowX: "auto" as const,
    borderRadius: "10px",
    border: "1px solid rgba(255, 255, 255, 0.06)",
  },
  table: {
    width: "100%",
    borderCollapse: "collapse" as const,
    fontSize: "0.85rem",
  },
  th: {
    padding: "0.75rem 1rem",
    textAlign: "left" as const,
    color: "#94a3b8",
    fontWeight: 600,
    fontSize: "0.75rem",
    textTransform: "uppercase" as const,
    letterSpacing: "0.05em",
    borderBottom: "1px solid rgba(255, 255, 255, 0.06)",
    background: "rgba(0, 0, 0, 0.2)",
  },
  tr: {
    borderBottom: "1px solid rgba(255, 255, 255, 0.03)",
  },
  td: {
    padding: "0.65rem 1rem",
    color: "#e2e8f0",
  },
  skillBadge: {
    display: "inline-block",
    padding: "0.15rem 0.6rem",
    borderRadius: "6px",
    background: "rgba(139, 92, 246, 0.15)",
    color: "#c4b5fd",
    fontSize: "0.8rem",
    fontWeight: 500,
  },
  collabGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: "0.75rem",
  },
  collabCard: {
    background: "rgba(0, 0, 0, 0.2)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    borderRadius: "10px",
    padding: "1rem",
    textAlign: "center" as const,
  },
  collabValue: {
    fontSize: "1.5rem",
    fontWeight: 700,
    color: "#a78bfa",
  },
  collabLabel: {
    fontSize: "0.75rem",
    color: "#64748b",
    marginTop: "0.25rem",
  },
  repoList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.5rem",
  },
  repoCard: {
    background: "rgba(0, 0, 0, 0.2)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    borderRadius: "10px",
    padding: "0.85rem 1rem",
  },
  repoName: {
    fontSize: "0.9rem",
    fontWeight: 600,
    color: "#e2e8f0",
    marginBottom: "0.25rem",
  },
  privateBadge: {
    marginRight: "0.35rem",
    fontSize: "0.8rem",
  },
  repoMeta: {
    display: "flex",
    gap: "1rem",
    fontSize: "0.75rem",
    color: "#64748b",
    marginBottom: "0.35rem",
  },
  stackList: {
    display: "flex",
    gap: "0.35rem",
    flexWrap: "wrap" as const,
  },
  stackBadge: {
    display: "inline-block",
    padding: "0.1rem 0.5rem",
    borderRadius: "4px",
    background: "rgba(99, 102, 241, 0.15)",
    color: "#818cf8",
    fontSize: "0.7rem",
    fontWeight: 500,
  },
  notesList: {
    display: "flex",
    flexDirection: "column" as const,
    gap: "0.35rem",
  },
  noteItem: {
    fontSize: "0.8rem",
    color: "#94a3b8",
    padding: "0.5rem 0.75rem",
    background: "rgba(0, 0, 0, 0.15)",
    borderRadius: "6px",
  },
  copyButton: {
    padding: "0.5rem 1rem",
    borderRadius: "8px",
    border: "1px solid rgba(255, 255, 255, 0.1)",
    background: "rgba(255, 255, 255, 0.05)",
    color: "#e2e8f0",
    fontSize: "0.85rem",
    cursor: "pointer",
    marginBottom: "1rem",
    transition: "background 0.2s",
  },
  jsonPre: {
    background: "rgba(0, 0, 0, 0.3)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    borderRadius: "10px",
    padding: "1rem",
    overflow: "auto",
    maxHeight: "600px",
    fontSize: "0.75rem",
    lineHeight: 1.6,
    color: "#94a3b8",
  },
  logGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "0.75rem",
  },
  logCard: {
    background: "rgba(0, 0, 0, 0.2)",
    border: "1px solid rgba(255, 255, 255, 0.06)",
    borderRadius: "10px",
    padding: "1.25rem",
    textAlign: "center" as const,
  },
  logValue: {
    fontSize: "1.75rem",
    fontWeight: 700,
    color: "#a78bfa",
  },
  logLabel: {
    fontSize: "0.75rem",
    color: "#64748b",
    marginTop: "0.25rem",
  },
};
