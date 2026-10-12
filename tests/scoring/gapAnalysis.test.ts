/**
 * Gap Analysis Tests — Phase 2 updated
 * Uses updated SignalScores (no breadth), SignalMetrics (distinctFiles),
 * CollaborationEvidence (null fields), and unobservableSkills.
 */
import { describe, it, expect } from "vitest";
import { analyzeRoleGap, analyzeAllRoleGaps } from "../../src/lib/skill-engine/scoring/gapAnalysis";
import type { SkillProfile, RoleBenchmark } from "../../src/lib/skill-engine/scoring/types";

describe("Role Gap Analysis Engine", () => {
  const mockProfile: SkillProfile = {
    target: { login: "candidate1", id: 201, mode: "public" },
    evaluatedAt: new Date().toISOString(),
    skills: [
      {
        skill: "TypeScript",
        level: 4,
        rawScore: 0.68,
        evidenceStrength: "High",
        signals: { volume: 0.7, depth: 0.75, sustained: 0.8, quality: 0.6 },
        metrics: {
          distinctFiles: 40,
          fileChangeEvents: 80,
          totalAdditions: 3000,
          totalDeletions: 200,
          reposCount: 4,
          activeMonths12: 10,
          activeMonths36: 24,
          depthFeaturesDetected: ["asynchronous_concurrency", "generics_typing"],
          testFilesCount: 8,
          sourceFilesCount: 32,
          unavailableSignals: [],
        },
        gatingNotes: [],
      },
      {
        skill: "React",
        level: 3,
        rawScore: 0.52,
        evidenceStrength: "Medium",
        signals: { volume: 0.5, depth: 0.55, sustained: 0.5, quality: 0.5 },
        metrics: {
          distinctFiles: 15,
          fileChangeEvents: 30,
          totalAdditions: 1200,
          totalDeletions: 80,
          reposCount: 2,
          activeMonths12: 6,
          activeMonths36: 12,
          depthFeaturesDetected: ["functions_methods"],
          testFilesCount: 2,
          sourceFilesCount: 13,
          unavailableSignals: [],
        },
        gatingNotes: [],
      },
    ],
    collaboration: { prsOpened: 5, prsMerged: 4, reviewsGiven: 10, issuesOpened: 2, comments: 20, windowMonths: 36 },
    coverage: { reposDiscovered: 4, reposAnalyzed: 4, commitsListed: 50, commitsDetailed: 30, truncated: false, notes: [] },
  };

  const mockRole: RoleBenchmark = {
    roleId: "test-frontend",
    roleName: "Frontend Engineer",
    description: "Builds client apps",
    requirements: [
      { skill: "TypeScript", requiredLevel: 4, importance: "required" }, // L4 → Meets (0)
      { skill: "React",      requiredLevel: 4, importance: "required" }, // L3 → Developing (-1)
      { skill: "Next.js",    requiredLevel: 3, importance: "preferred" }, // Missing Evidence (-3)
    ],
  };

  it("calculates status and deltas for each role requirement", () => {
    const analysis = analyzeRoleGap(mockProfile, mockRole);

    expect(analysis.roleId).toBe("test-frontend");
    expect(analysis.gaps).toHaveLength(3);

    const tsGap = analysis.gaps.find((g) => g.skill === "TypeScript")!;
    expect(tsGap.currentLevel).toBe(4);
    expect(tsGap.requiredLevel).toBe(4);
    expect(tsGap.delta).toBe(0);
    expect(tsGap.status).toBe("Meets");

    const reactGap = analysis.gaps.find((g) => g.skill === "React")!;
    expect(reactGap.currentLevel).toBe(3);
    expect(reactGap.requiredLevel).toBe(4);
    expect(reactGap.delta).toBe(-1);
    expect(reactGap.status).toBe("Developing");

    const nextGap = analysis.gaps.find((g) => g.skill === "Next.js")!;
    expect(nextGap.currentLevel).toBe("No evidence");
    expect(nextGap.status).toBe("Missing Evidence");
  });

  it("calculates weighted match percentage ONLY over requirements with evidence", () => {
    const analysis = analyzeRoleGap(mockProfile, mockRole);
    // matchPercentage only over TS (required) and React (required) — both have evidence
    // Next.js has no evidence → excluded from matchPercentage
    // Target: 2*4 (TS) + 2*4 (React) = 16
    // Achieved: 2*4 (TS meets) + 2*3 (React developing) = 14
    // 14/16 = 87.5% → rounded to 88
    expect(analysis.matchPercentage).toBe(88);
    // Both required skills with evidence: 2/2 = 1.0
    expect(analysis.evidenceCoverage).toBe(1);
  });

  it("extracts strengths and targeted learning recommendations", () => {
    const analysis = analyzeRoleGap(mockProfile, mockRole);
    expect(analysis.strengths.length).toBeGreaterThan(0);
    expect(analysis.strengths[0]).toContain("TypeScript");
    expect(analysis.recommendations.length).toBeGreaterThan(0);
    expect(analysis.recommendations.some((r) => r.includes("Next.js"))).toBe(true);
  });

  it("excludes unobservableSkills from all percentages", () => {
    const roleWithUnobservable: RoleBenchmark = {
      roleId: "system-design-role",
      roleName: "Senior Engineer",
      description: "Senior role with non-code skills",
      requirements: [
        { skill: "TypeScript", requiredLevel: 4, importance: "required" },
        { skill: "System Design", requiredLevel: 4, importance: "required" }, // unobservable
      ],
      unobservableSkills: ["System Design"],
    };

    const analysis = analyzeRoleGap(mockProfile, roleWithUnobservable);

    // System Design should NOT appear in gaps (unobservable)
    const sdGap = analysis.gaps.find((g) => g.skill === "System Design");
    expect(sdGap).toBeUndefined();

    // It should appear in unobservableSkills
    expect(analysis.unobservableSkills).toContain("System Design");

    // matchPercentage only over TypeScript (the only observable)
    expect(analysis.matchPercentage).toBe(100); // TS L4 meets L4
  });

  it("analyzes all standard benchmarks successfully", () => {
    const all = analyzeAllRoleGaps(mockProfile);
    expect(all.length).toBeGreaterThanOrEqual(4);
    for (const res of all) {
      expect(res.matchPercentage).toBeGreaterThanOrEqual(0);
      expect(res.matchPercentage).toBeLessThanOrEqual(100);
      expect(Array.isArray(res.unobservableSkills)).toBe(true);
    }
  });
});
