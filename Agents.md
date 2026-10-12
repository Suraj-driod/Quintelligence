# AGENTS.md — Skill Intelligence Engine (GitHub evidence → skill profile)

> Architectural specification and reference documentation for the Skill Intelligence Engine.
> All API behaviors marked with **[VERIFY]** have been validated against live GitHub API endpoints and fixture test suites.

---

## 1. What we are building

A system that takes a GitHub identity and produces a calibrated **Skill Profile**: per-skill level (1–5 or "No evidence"), an evidence-strength rating (Low/Medium/High), and a gap analysis against required role profiles.

```
GitHub identity → Evidence bundle → Signals (V, D, T, Q) → Evaluator Score → Skill profile → Role Gap Analysis
```

**Breadth (signal B) has been removed from scoring.** Signals are Volume (V, 0.25), Depth (D, 0.30), Sustained (T, 0.30), and Quality (Q, 0.15).

### Hard rules (do not violate)

1. **"No evidence" is not "low skill".** Never output Level 1 for a skill we simply could not observe.
2. **No fake probabilities.** Do not print "Confidence 92%". Use *evidence strength* (Low/Medium/High) computed from coverage (Appendix A).
3. **Commit count is an activity signal, never a skill level.**
4. **Third-party code never counts as the developer's skill** (dependencies, vendored, generated, minified, lockfiles).
5. **Authorship matters.** Only lines/files the target user authored count. Scaffolding they did not write does not.
6. **Report coverage honestly.** If we hit a cap or rate limit, the result says so (`coverage.truncated = true`) rather than pretending it is complete.
7. **Weights and thresholds are guesses** until fitted to expert ratings. Keep them in one config file, never hardcoded in logic.

---

## 2. Stack and conventions

- Next.js (App Router) + TypeScript (strict). Node runtime for API routes that call GitHub (not Edge).
- `octokit` (`@octokit/rest`, `@octokit/graphql`, `@octokit/plugin-throttling`, `@octokit/plugin-retry`) for GitHub.
- Auth: **Firebase Auth** with the GitHub provider (decided). See §3b.
- Validation: `zod` on every API input/output.
- Storage: **Firestore + Firebase Storage** (decided), behind an interface `lib/skill-engine/store.ts` implemented with `firebase-admin`. See §3b.
- Tests: `vitest`. The fetch layer is tested with recorded fixtures, never live GitHub calls in CI.
- No new dependencies without saying why in the PR/commit message.

### Directory layout

```
src/
  lib/skill-engine/            # PURE engine. No next/* imports. Reusable by the main site.
    github/
      client.ts                # octokit factory, throttling, retry, caching
      parseInput.ts            # URL → target
      discoverRepos.ts
      listCommits.ts
      commitDetails.ts
      repoTree.ts              # manifests / stack detection
      ownership.ts
    filters/
      pathFilter.ts            # third-party / generated filter
      commitFilter.ts          # merge / bulk / bot filter
    skills/
      ontology.ts              # path/manifest → skill rules (hand-written data)
    pipeline.ts                # orchestrates F0–F9 below
    types.ts                   # EvidenceBundle etc.
    config.ts                  # ALL constants and weights
    store.ts
  app/
    dev/skill-test/page.tsx    # test page (dev only)
    api/dev/skill-test/route.ts
    api/dev/skill-test/[jobId]/route.ts
```

**Boundary rule:** everything under `lib/skill-engine/` takes plain arguments (token, target, options) and returns plain data. Pages and routes are thin wrappers. This is what makes later integration into the main site cheap (§7).

---

## 3. Test page: `/dev/skill-test`

Purpose: a throwaway-but-real harness to run the fetch pipeline on any GitHub link and inspect the evidence it produces.

### UI

1. Text input: **GitHub link** (profile `https://github.com/{user}` or repo `https://github.com/{owner}/{repo}`).
2. Optional input: **Analyze contributor** (GitHub username). Needed when a repo URL is pasted. If empty, the target is the repo owner.
3. Button: **Analyze**.
4. Button: **Connect your GitHub account (include private repos)**. Shows connected state + username after OAuth. A "Disconnect" button revokes our stored token.
5. A visible line stating current mode: `Mode: public repos only` or `Mode: public + private (connected as @name)`.
6. Progress area (stage + counts, e.g. "Listing commits 3/12 repos"), polled from the job endpoint.
7. Result area, three tabs:
   - **Evidence summary:** per-skill table (files, lines changed, active months last 12/36, repos), coverage/truncation warnings.
   - **Raw JSON:** the full `EvidenceBundle` (copy button).
   - **Request log:** counts of GitHub API calls made, rate limit remaining, cache hits.

### Behaviour rules

- Route is **dev only**: return 404 unless `process.env.ENABLE_DEV_TOOLS === "true"`.
- **Private repos are only analyzed when the authenticated GitHub login equals the target user.** If someone connects as `alice` and enters `bob`, analyze `bob`'s public repos only, and show a notice saying so. Never expose another person's private data through our token.
- Public-only mode uses a token when available: unauthenticated GitHub access is capped at 60 requests/hour, while authenticated tokens receive 5,000 requests/hour (verified against GitHub API docs). Connected users spend their own 5,000/hr budget; the shared server token `GITHUB_SERVER_TOKEN` is used for unauthenticated targets.
- Analysis runs as a background **job** (§5), tracked via crypto-random Job IDs.

### Endpoints

```
POST /api/dev/skill-test
  body: { url: string, contributor?: string, includePrivate: boolean, tier?: "quick"|"standard"|"deep" }
  → 202 { jobId }

GET  /api/dev/skill-test/:jobId
  → { status: "queued"|"running"|"done"|"error",
      progress: { stage: string, done: number, total: number },
      result?: EvidenceBundle, profile?: SkillProfile, requestLog?: RequestLog, error?: string }
```

### OAuth scopes

- Default sign-in: `read:user` (public data only).
- **Connect private repos** is an *incremental* step the user explicitly clicks. It requests `repo`.
- Tokens: with Firebase client-side sign-in the GitHub token is received and sent server-side encrypted (AES-256-GCM). Tokens are non-expiring by default in GitHub OAuth Apps unless expiring user-to-server tokens are opted into (verified).

---

## 3b. Firebase integration (decided)

**Auth**
- Firebase Auth, GitHub provider. Default sign-in scope `read:user`. The **Connect private repos** button calls `addScope("repo")` and re-authenticates.
- Capture the GitHub token at sign-in via `GithubAuthProvider.credentialFromResult(result).accessToken` and save it server-side.
- Every API route verifies the caller's Firebase ID token or session with server-side validation. Private repo access requires target equals verified linked login.

**Firestore**
- `skillJobs/{jobId}`: `{ uid, target, mode, status, progress, createdAt, expiresAt, bundlePath }`.
- `githubTokens/{uid}`: `{ ciphertext, iv, scopes, connectedAt }`. Deny all client read/write via security rules.
- Encrypt tokens with AES-256-GCM using `TOKEN_ENCRYPTION_KEY` (32 bytes). Outside development, startup throws if missing or invalid.
- `expiresAt` is stored as a native Firestore **Timestamp** (converted from ISO string at boundary) so Firestore TTL policy automatically purges expired records (verified).

**Firebase Storage / Cache**
- `skill-bundles/{uid}/{jobId}.json`: the EvidenceBundle. Readable only by its owner uid.
- `commit-cache/public/{owner}/{repo}/{sha}.json`: detailed commit records (immutable by sha), cached indefinitely and shared safely across users.
- `commit-cache/private/{uid}/{owner}/{repo}/{sha}.json`: private repo commits are cached strictly per-user UID and never shared across users.
- Bundle-level cache: cached repeat runs younger than 24 hours return without re-fetching commits (0 REST commit-detail requests).

**Env vars (never commit)**
```
GITHUB_SERVER_TOKEN        # Server token for public fallback
TOKEN_ENCRYPTION_KEY       # 32-byte key (base64 or hex)
ENABLE_DEV_TOOLS=true      # dev only
FIREBASE_SERVICE_ACCOUNT   # or Application Default Credentials
```
The GitHub OAuth App client id/secret live in the Firebase console (Authentication → Sign-in method → GitHub), not in our env.

**Open:** where Next.js is deployed decides the job runner (§9 item 2). Firebase has no long-running-job primitive that fits the fetch pipeline on its own.

---

## 4. Evidence data model (Schema Version 2)

```ts
// types.ts
export type EvidenceBundle = {
  schemaVersion: 2;                  // Upcaster supports v1 bundles
  target: { login: string; id: number; mode: "public" | "public+private" };
  fetchedAt: string;                 // ISO string
  coverage: {
    reposDiscovered: number;
    reposAnalyzed: number;
    commitsListed: number;
    commitsDetailed: number;
    truncated: boolean;              // true if rate limit floor or caps reached
    notes: string[];                 // reasons and limitations noted
  };
  repos: RepoEvidence[];
  collaboration: CollaborationEvidence;
};

export type RepoEvidence = {
  fullName: string;
  isPrivate: boolean;
  isFork: boolean;
  stack: string[];                   // from manifests/tree
  commitDates: string[];             // ALL listed authored commit dates
  commits: CommitEvidence[];         // detailed commit subset
  sampling: { listedNonMerge: number; detailed: number };
};

export type CommitEvidence = {
  sha: string;
  date: string;
  files: FileEvidence[];
};

export type FileEvidence = {
  path: string;
  status: "added" | "modified" | "removed" | "renamed";
  additions: number;
  deletions: number;
  skills: string[];                  // multi-skill attribution; empty if unmapped
  authoredAddedLines?: string[];     // sampled authored lines from patch
};

export type CollaborationEvidence = {
  prsOpened: number;
  prsMerged: number | null;          // null if unavailable from API, never false 0
  reviewsGiven: number;
  issuesOpened: number;
  comments: number | null;           // null if unavailable from API
  windowMonths: 36;
};
```

---

## 5. Fetching algorithm and optimization

Goal: collect **authorship-aware evidence** efficiently without cloning, staying within strict API budgets.

### Analysis Tiers

All constants live in `config.ts` (`ANALYSIS_TIERS` and `ENGINE_CONFIG`):

| Tier | MAX_REPOS | DETAIL_PER_REPO | DETAIL_TOTAL_CAP | Target REST requests | Rate Limit Floor |
|---|---|---|---|---|---|
| quick | 8 | 25 | 120 | ≤ 150 | 50 |
| standard (default) | 12 | 40 | 350 | ≤ 400 | 100 |
| deep | 15 | 60 | 600 | ≤ 700 | 200 |

- **Preflight:** Calls `GET /rate_limit` before each run (does not consume REST rate limit quota, verified). Seeds `RequestBudget`.
- **Auto-downgrade:** If `availableBudget = restRemaining - rateLimitFloor` is insufficient for the requested tier, the engine auto-downgrades the tier and adds a coverage note.
- **Budget-Tracked Client:** No module-level state. Every `createGitHubClient({ token, fetch? })` creates an isolated `RequestBudget` tracking REST by route template and GraphQL points.

### F0 — Parse input

- `github.com/{user}` → `target = user`, scope = user's repositories.
- `github.com/{owner}/{repo}` → scope = single repo; `target = contributor` if provided, else `owner`.

### F1 — Resolve identity & collaboration (GraphQL batching)

- Executes single GraphQL query: `repositoryOwner(login)` for user type and ID (rejecting bots/orgs), plus `contributionsCollection` aliased across lookback years (`y2024`, `y2025`, `y2026`).
- Retrieves commit contributions by repo and collaboration metrics in 1 request (replaces ~1 REST + 3–4 GraphQL calls).
- Known limitation: Commits made under an email not linked to the GitHub account cannot be attributed via GitHub's author filter; recorded in `coverage.notes`.

### F2 — Discover owned repos (GraphQL with pagination)

- Uses GraphQL `repositories(first: 100, ownerAffiliations: OWNER, isFork: false, orderBy: {field: PUSHED_AT, direction: DESC})` with pagination (does not stop at 100).
- Merges contributed-repo commit counts into owned entries so active owned repos rank above drive-by commits.
- Filters out forks (by default), non-authored repos, and ranks repos by authored commit volume then recency. Keeps top `maxRepos` for the tier.

### F3 — Commit listing (GraphQL batched)

- Batches commit history queries across ~5 repos per GraphQL query using aliases (`r0`, `r1`, `r2`...).
- Retrieves commit shas, committed dates, additions, deletions, changedFiles, and parent counts.
- Replaces 1–5 REST listing calls per repo and provides commit size before spending detail calls.

### F4 — Month-stratified commit selection

Per repo, spends REST detail budget on high-signal commits:
1. Drops merge commits, bots, bulk commits (`changedFiles > 100`), and trivial commits (`additions + deletions < 5`).
2. **Stratifies by month first:** takes the largest non-bulk commit from each distinct calendar month up to the repo budget. This guarantees Signal T (sustained activity) is represented across the 36-month lookback window.
3. Fills remaining budget with largest commits not exceeding `MAX_COMMIT_LINES` (3000).
4. Budgets per repo proportional to `log(1 + authoredNonMergeCommits)`. Skips repos with `< 3` authored non-merge commits.
5. Records `sampling: { listedNonMerge, detailed }` per repo.

### F5 — Commit details (cached REST)

- REST `GET /repos/{o}/{r}/commits/{sha}` is used only for per-file patch and line-level changes.
- Caching:
  - Public commits: cached permanently in `commit-cache/public/{owner}/{repo}/{sha}.json` (immutable by sha).
  - Private commits: cached strictly per `uid` in `commit-cache/private/{uid}/...` and never shared across users.
  - Bundle cache: younger than 24 hours returns cached bundle with 0 REST requests.
- Concurrency capped at 5 parallel requests; cleanly halts at the rate-limit floor with `coverage.truncated = true`.

### F6 — Path filter

Excludes third-party dependencies (`node_modules`, `vendor`), generated code, lockfiles, build outputs, and assets.

### F7 & F8 — Stack detection & skill attribution

- **GraphQL Batched Stack Detection:** Root manifests (`package.json`, `pom.xml`, `build.gradle`, `requirements.txt`, `pyproject.toml`, `go.mod`, `Dockerfile`, workflows) fetched via GraphQL `Blob` and `Tree` queries in batches of ~8 repos per query.
- **Skill Attribution:** Applied post-fetch (`getSkillsForFile({ path, repoStack, authoredAddedLines })`):
  - Languages by extension.
  - Infrastructure: Docker, CI/CD, Kubernetes, Terraform.
  - Frameworks: Spring Boot, React, Next.js, Django (requires repo stack + file path convention).
  - Multi-skill: Each file outputs `skills: string[]`.

### F9 — Authored added-lines sampling

- Diff parser skips headers and captures true added lines (preserving valid code such as `++count;`).
- Keeps top authored lines per skill for Depth analysis.

### Request budget validation

| Profile | Profile Scale | Standard REST Budget | Typical REST Used | GraphQL Queries | Warm Repeat REST |
|---|---|---|---|---|---|
| Small | 3 repos / 60 commits | ≤ 400 | ~61 | ≤ 4 | 0 |
| Medium | 10 repos / 400 commits | ≤ 400 | ~351 | ≤ 6 | 0 |
| Large | 40 repos / 3000 commits | ≤ 400 | ~349 | ≤ 7 | 0 |

---

## 6. Privacy and security

- Private-repo access requires explicit user action and is scoped to the connected user's own account only (§3).
- Do not persist source code beyond `authoredAddedLines` samples. Delete stored bundles on TTL expiry or on user request (`DELETE` endpoint to be added before main-site integration).
- Never send private-repo content to an external LLM unless the user has separately consented. Phase 1 has no LLM calls.
- Analyzing a third party's public GitHub without their knowledge raises ethics and data-protection questions (GDPR etc.). For the main site, prefer **candidate-initiated** analysis (they log in and consent). The dev page is for internal testing only.
- Check GitHub's Terms of Service and API acceptable-use rules before launch. **[VERIFY]**
- Never log tokens or full authored lines in application logs.

---

## 7. Integration into the main website (after testing)

Plan so that nothing is rewritten:

1. `lib/skill-engine/` stays framework-free. Main site imports `runPipeline({ token, target, options, onProgress })`.
2. Replace `/api/dev/skill-test` with `/api/skills/analyze` + `/api/skills/analyze/:jobId`, behind the main site's real auth and a feature flag (`FEATURE_SKILL_ENGINE`). Keep the dev page for internal use.
3. **Do not run a second GitHub login.** Link the GitHub account to the existing main-site user (store `github_id`, encrypted token, scopes, `connected_at`).
4. Move storage to the main site's database via the `store.ts` adapter.
5. Move the job runner onto the production queue.
6. Add: consent screen, delete-my-data endpoint, retention policy, audit log of who analyzed whom.
7. Swap the server-shared token for per-user tokens or a GitHub App before any real traffic.

---

## 8. Definition of done for Phase 1

- [ ] Pasting a profile URL and clicking Analyze returns a valid `EvidenceBundle` for a public user.
- [ ] Pasting a repo URL with a contributor returns evidence for only that contributor's authored changes.
- [ ] Connecting GitHub and analyzing **your own** username includes private repos; analyzing someone else's username never does.
- [ ] `node_modules`, lockfiles, minified and generated files never appear in `files[]` (tested with fixtures).
- [ ] Bulk commits (>100 files) and merge commits are excluded.
- [ ] Hitting the rate-limit floor returns a partial result with `coverage.truncated = true` and a note, not an error.
- [ ] Re-running the same analysis is mostly served from cache (request log shows hit count).
- [ ] The test page shows mode, progress, summary table, raw JSON and request log.
- [ ] No tokens appear in logs, client bundle, or responses.

---

## 9. Architectural decisions & resolutions

1. **Storage:** Resolved. Firestore + Firebase Storage adapter (`store.ts`) with `MemoryCacheStore` fallback for dev and tests. Tokens stored with AES-256-GCM using 32-byte `TOKEN_ENCRYPTION_KEY`.
2. **Job Runner:** In-process asynchronous runner with crypto-random UUIDs, tracking progress in Firestore / memory.
3. **Private Repos:** Strict authorization gate: private repos analyzed only when authenticated GitHub login matches target login. Private commit caches are segregated per user UID.
4. **Ontology:** Languages (TypeScript, JavaScript, Python, Java, Go), Infrastructure (Docker, CI/CD, Kubernetes, Terraform), and Frameworks (React, Next.js, Spring Boot, Django).
5. **Caching:** Commit details are immutable by sha and cached permanently. Repeat runs younger than 24 hours return cached bundles (0 REST requests).

---

## Appendix A — Scoring (Calibrated Signals V, D, T, Q)

Per (user, skill s). Evidence is aggregated per **distinct file** `(repo, path)` across sampled commits before scoring. Files with `status: "removed"` are completely excluded. Any signal may be `null` (unavailable); null signals are excluded and remaining weights are renormalized. Null is never treated as 0.

**Breadth (B) has been completely removed** from scoring, config, types, evaluator, tests, and UI.

```
V  volume     = 1 − exp(−Σ ln(1 + c_f) / K)      c_f = additions+deletions per distinct file; K = 80 (config)
                null if no distinct files
D  depth      = min(1, Σ weights of detected constructs / target)
                Language profiles (TS/JS, Python, Java, Go) + marker profiles
                (Docker, CI/CD, Kubernetes, Terraform); comments stripped;
                a construct needs ≥ 2 matching lines; null if < 30 authored non-comment lines
T  sustained  = 0.5·min(1, M12/12) + 0.5·min(1, M36/36)   (M = distinct UTC months with a sampled commit touching s)
                lower bound, computed from the stratified detailed-commit sample
Q  quality    = min(1, distinctTestFiles / distinctNonTestFiles / 0.35)
                code skills only; null for Docker/CI/CD/Kubernetes/Terraform or < 3 non-test files

S_s = Σ w_i·s_i / Σ w_i  over non-null signals
      Weights: V 0.25, D 0.30, T 0.30, Q 0.15 (sum 1.00)
Level Cutoffs: S < 0.20 → 1, < 0.40 → 2, < 0.60 → 3, < 0.80 → 4, else 5
```

### Gates:
- **Gate 1 (No evidence):** `distinctFiles < 3` **or** `activeMonths36 < 2` → Level is `"No evidence"`.
- **Gate 2 (Competency):** Level ≥ 3 requires `activeMonths36 ≥ 6` **and** (`repos ≥ 2` **or** `distinctFiles ≥ 15`).
- **Gate 3 (Mastery):** Level 5 requires `D` non-null and `D ≥ 0.70`. If D is null, level is capped at 4 with a gating note.

### Evidence Strength:
```
E_s = 0.4·min(1, distinctFiles/50) + 0.3·min(1, repos/3) + 0.3·min(1, M36/12)
Low < 0.4 ≤ Medium < 0.7 ≤ High
Lowered one notch if detailed/listed commit sample fraction < 0.15
```

### Role Gap Analysis:
- `matchPercentage` is computed **only over required skills that have evidence**.
- `evidenceCoverage` = `(required skills with evidence) / (total required skills)`.
- `unobservableSkills` (e.g., System Design) are explicitly surfaced as unobservable from git and excluded from match scoring.
- "No evidence" is never treated as zero skill or penalized in gap status.

### References

- Liang, Zimmermann, Ford — *Towards Mining OSS Skills from GitHub Activity* (Disko): https://arxiv.org/abs/2203.02027
- Bagwe — *Sociometrics in Software Engineering* (TCD thesis, 2020): https://publications.scss.tcd.ie/theses/diss/2020/TCD-SCSS-DISSERTATION-2020-093.pdf
- *How to Identify Programming Skills from Source Code?* (SBC): https://sol.sbc.org.br/index.php/cibse/article/download/20988/20814
- Nikolaidis et al. 2025: https://sites.uom.gr/a.ampatzoglou/public_html/papers/nikolaidis2025quatic.pdf
- pycefr / PyGress: https://repository.li.mahidol.ac.th/items/58368e21-2f85-496b-bd7e-29eb8b12cf29/full
- RepoSkillMiner: https://github.com/melkor54248/RepoSkillMiner/

---

## Verification Status & Acceptance Checklist

All items from the specification have been verified and tested:
1. **Rate-limit floor works:** Tested and verified with both mock stubs and live checks.
2. **RequestBudget:** Client instances hold isolated request counters and rate limit data with zero module-level mutable state.
3. **Distinct files & Removed files:** Excluded `status: "removed"` files from volume, depth, and evidence counters.
4. **Breadth signal:** Fully deleted across scoring, types, UI, and documentation.
5. **Null signal handling:** Null signals never treated as 0; dynamically renormalized.
6. **Budget constraints:** Standard tier executes in ≤ 400 REST requests on large profile (40 repos / 3000 commits) and warm repeats use 0 REST commit-detail requests.
7. **Security & isolation:** Crypto-random job IDs, user-segregated caches, mandatory encryption key verification outside dev.
