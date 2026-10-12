# Phase 2 Implementation Plan — Scoring, Skill Profiling & Role Gap Engine

## Overview
Phase 2 transforms the raw `EvidenceBundle` collected in Phase 1 into an objective, validated **Skill Profile** and **Role Gap Analysis**, following the specification in [Agents.md](file:///e:/SURAJ/Code/Hackthons/Quintelligence/Agents.md) (Appendix A and Section 1 hard rules).

```
Evidence bundle (Phase 1) ──► Signal Extraction (V, B, D, T, Q) ──► Scoring & Gating ──► Skill Profile ──► Role Gap Analysis
```

---

## 1. Core Principles & Hard Rules (Agents.md §1)

1. **"No evidence" is not "low skill"**: Never assign Level 1 to a skill that simply wasn't observed or doesn't meet minimum coverage thresholds.
2. **Honest Evidence Strength (not fake confidence)**: Replace arbitrary percentages (e.g. "92% confidence") with a computed **Evidence Strength** (Low / Medium / High) based on observable coverage ($files$, $repos$, $months$).
3. **Commit count is never a skill level**: Commits only signal sustained activity ($T$), never depth or competence.
4. **Transparent Gating**: Gates must be strictly enforced and explicitly explained to the user (e.g., *"Capped at Level 2: requires $\ge 2$ repositories and $\ge 6$ active months for Level 3"*).
5. **Zero Hardcoded Constants**: All weights, score cutoffs, gating thresholds, and normalization parameters live in `config.ts`.

---

## 2. Mathematical Specifications (Appendix A)

### A. Signal Formulation (Normalized to $[0, 1]$)

| Signal | Name | Formula & Definition | Input Source |
|---|---|---|---|
| **$V$** | **Volume** | $V_s = f\left(\sum_{f \in s} \ln(1 + \text{additions}_f + \text{deletions}_f)\right)$ | File change volumes from `CommitEvidence` |
| **$B$** | **Breadth** | $B_s = f(\text{distinct libraries/imports used in } s)$ | Authored code imports + repo manifest deps |
| **$D$** | **Depth** | $D_s = \text{construct sophistication index} \in [0, 1]$ | Authored lines (`authoredAddedLines`) |
| **$T$** | **Sustained Activity** | $T_s = 0.5 \cdot \min\left(1, \frac{M_{12}}{12}\right) + 0.5 \cdot \min\left(1, \frac{M_{36}}{36}\right)$ | Qualifying commit calendar months |
| **$Q$** | **Quality & Testing** | $Q_s = 0.5 \cdot \min\left(1, \frac{files_{\text{test}}}{files_{\text{src}}}\right) + 0.5 \cdot \text{refactor\_ratio}$ | Test file presence and modification ratios |

### B. Composite Score
$$S_s = 0.30 \cdot V + 0.20 \cdot B + 0.25 \cdot D + 0.15 \cdot T + 0.10 \cdot Q$$

### C. Level Mapping
- $S_s < 0.15 \implies \mathbf{Level\ 1}$ (Beginner / Novice)
- $S_s < 0.35 \implies \mathbf{Level\ 2}$ (Junior / Developing)
- $S_s < 0.55 \implies \mathbf{Level\ 3}$ (Intermediate / Competent)
- $S_s < 0.75 \implies \mathbf{Level\ 4}$ (Advanced / Proficient)
- $S_s \ge 0.75 \implies \mathbf{Level\ 5}$ (Expert / Mastery)

### D. Hard Gating Rules
1. **"No evidence" Gate**: If $files_s < 3$ OR $M_{36\_s} < 2$, output **"No evidence"** (never Level 1).
2. **Level 3+ Gate**: Level $\ge 3$ requires $M_{36} \ge 6$ active months AND $\ge 2$ distinct repositories.
3. **Level 5 Gate**: Level 5 requires Depth score $D \ge 0.70$.

### E. Evidence Strength
$$E_s = 0.4 \cdot \min\left(1, \frac{files_s}{50}\right) + 0.3 \cdot \min\left(1, \frac{repos_s}{3}\right) + 0.3 \cdot \min\left(1, \frac{M_{36\_s}}{12}\right)$$
- $E_s < 0.4 \implies \mathbf{Low}$
- $0.4 \le E_s < 0.7 \implies \mathbf{Medium}$
- $E_s \ge 0.7 \implies \mathbf{High}$

---

## 3. Directory Layout & Deliverables

```
src/lib/skill-engine/
  ├── scoring/
  │   ├── types.ts              # SkillSignal, SkillRating, SkillProfile, RoleGap types
  │   ├── config.ts             # Signal weights, thresholds, gating cutoffs, role benchmark profiles
  │   ├── signals/
  │   │   ├── volume.ts         # V signal calculation
  │   │   ├── breadth.ts        # B signal (library & import extraction)
  │   │   ├── depth.ts          # D signal (construct sophistication analyzer)
  │   │   ├── sustained.ts      # T signal (12/36 month commit distribution)
  │   │   └── quality.ts        # Q signal (test ratio & refactor metrics)
  │   ├── evaluator.ts          # Orchestrates signal calculation, scoring, gating, & evidence strength
  │   └── gapAnalysis.ts        # Benchmarks SkillProfile against target roles
  └── ...
src/app/dev/skill-test/
  └── page.tsx                  # Adds 2 tabs: "Skill Profile" & "Role Gap Analysis"
tests/scoring/
  ├── volume.test.ts
  ├── breadth.test.ts
  ├── depth.test.ts
  ├── sustained.test.ts
  ├── quality.test.ts
  ├── evaluator.test.ts
  └── gapAnalysis.test.ts
```

---

## 4. Step-by-Step Execution Plan

### Step 1: Types & Configuration
- Create `src/lib/skill-engine/scoring/types.ts` defining:
  - `SignalScores` ($V, B, D, T, Q$)
  - `SkillRating` (Level 1–5 or "No evidence", Evidence Strength, Gate Notes)
  - `SkillProfile` (Target, Skills, Collaboration rankings)
  - `RoleBenchmark` and `RoleGapResult`
- Create `src/lib/skill-engine/scoring/config.ts` defining:
  - Default weights ($0.30, 0.20, 0.25, 0.15, 0.10$)
  - Level thresholds ($0.15, 0.35, 0.55, 0.75$)
  - Standard role profiles:
    - *Full-Stack Engineer* (TypeScript L4, React/Next.js L4, Node/Python L3, Docker L2)
    - *Backend Specialist* (Java/Go/Python L4, Spring Boot/Django L4, Docker L3, Kubernetes L2, CI/CD L3)
    - *Frontend Engineer* (TypeScript L4, React/Next.js L5, JavaScript L4)
    - *DevOps / Cloud Engineer* (Docker L4, Kubernetes L4, Terraform L3, CI/CD L4)

### Step 2: Signal Extractors (`scoring/signals/`)
1. **`volume.ts`**:
   - Aggregate additions + deletions for all qualifying files belonging to each skill.
   - Apply logarithmic smoothing with sigmoid curve mapping against standard developer cohorts.
2. **`breadth.ts`**:
   - Extract `import` and `require` statements from `authoredAddedLines`.
   - Augment with repo-level manifest dependencies (e.g. from `package.json`, `pom.xml`, `requirements.txt`).
   - Count distinct libraries normalized against expected ecosystem diversity.
3. **`depth.ts`**:
   - Analyze construct sophistication in authored code:
     - Control structures, pattern matching, async/await, generators
     - Type annotations, generics, interfaces (TypeScript/Java/Rust)
     - OOP/Functional abstractions, decorators, error handling patterns
   - Compute normalized sophistication index $D \in [0, 1]$.
4. **`sustained.ts`**:
   - Group commit timestamps by month ($YYYY-MM$).
   - Count distinct months in last 12 months ($M_{12}$) and last 36 months ($M_{36}$).
   - Compute $T = 0.5 \cdot (M_{12}/12) + 0.5 \cdot (M_{36}/36)$.
5. **`quality.ts`**:
   - Identify test files (`*.test.*`, `*.spec.*`, `test/`, `tests/`, `__tests__/`).
   - Calculate test-to-source ratio and refactoring activity (ratio of modifications vs pure additions).

### Step 3: Evaluator & Gating Engine (`scoring/evaluator.ts`)
- Group evidence files and commits by mapped skill.
- Run all 5 signal extractors per skill.
- Calculate raw composite score $S_s = \sum w_i \cdot \text{signal}_i$.
- Enforce hard gating conditions:
  - If $files < 3$ or $M_{36} < 2 \implies \text{Level} = \text{"No evidence"}$.
  - If Level $\ge 3$ but $M_{36} < 6$ or $repos < 2 \implies$ clamp to Level 2 with explicit gate note.
  - If Level $= 5$ but $D < 0.70 \implies$ clamp to Level 4 with explicit gate note.
- Compute Evidence Strength ($E_s \in \{\text{"Low"}, \text{"Medium"}, \text{"High"}\}$).

### Step 4: Role Gap Analyzer (`scoring/gapAnalysis.ts`)
- Compare the developer's computed `SkillProfile` against target `RoleBenchmark` templates.
- Calculate:
  - Per-skill delta: $\text{Current Level} - \text{Required Level}$.
  - Gap status: `Exceeds` ($+1$), `Meets` ($0$), `Developing` ($-1$), `Missing Evidence` (No evidence).
  - Overall role readiness match percentage.
  - Recommended focus areas (skills with the largest negative deltas).

### Step 5: Test Harness UI Enhancement (`src/app/dev/skill-test/page.tsx`)
- Add **Skill Profile** tab:
  - Visual skill cards with Level badges (Level 1–5 or "No evidence").
  - Evidence strength tags with color coding (Green: High, Yellow: Medium, Slate: Low).
  - Interactive signal breakdown bars ($V, B, D, T, Q$) with explanatory tooltips.
  - Gating transparency banner showing why any caps were applied.
- Add **Role Gap Analysis** tab:
  - Role dropdown selector (Full-Stack, Backend, Frontend, DevOps).
  - Comparative gap visualizer showing Current Level vs Required Level.
  - Role match percentage meter and actionable learning recommendations.

### Step 6: Automated Vitest Test Suite
- Write unit tests covering:
  - Each individual signal extractor ($V, B, D, T, Q$) with synthetic fixtures.
  - All 3 gating conditions (No evidence, Level 3 clamp, Level 5 clamp).
  - Evidence strength calculation edge cases.
  - Gap analysis delta calculations and match percentage.
- Ensure 100% test pass rate and clean build (`tsc --noEmit`, `next build`).

---

## 5. Definition of Done for Phase 2

- [x] Every skill in the bundle produces normalized signals: $V, B, D, T, Q \in [0, 1]$.
- [x] Gating rules correctly prevent over-attribution:
  - Skills with $<3$ files or $<2$ months produce **"No evidence"** (never Level 1).
  - Level 3+ requires $\ge 6$ active months and $\ge 2$ repos.
  - Level 5 requires $D \ge 0.70$.
- [x] Evidence strength is computed honestly as Low, Medium, or High.
- [x] Role gap analysis compares the profile against predefined role templates.
- [x] The test page renders both the Skill Profile and the Role Gap visualizer.
- [x] Comprehensive Vitest unit tests pass for all scoring and gating logic (50/50 tests passing).
- [x] Next.js production build succeeds with 0 TypeScript errors.
