/**
 * Phase 0 Regression Tests — Tests 0.9, 0.10
 * Tests for isTestFile and getSkillsForFile
 */
import { describe, it, expect } from "vitest";
import { isTestFile } from "../scoring/signals/quality";
import { getSkillsForFile } from "../skills/ontology";

// ── Test 0.9: isTestFile edge cases ─────────────────────────────────

describe("0.9 — isTestFile edge cases", () => {
  it("should NOT match src/latest_results.py", () => {
    expect(isTestFile("src/latest_results.py")).toBe(false);
  });

  it("should NOT match src/contest_utils.py", () => {
    expect(isTestFile("src/contest_utils.py")).toBe(false);
  });

  it("should match tests/test_a.py", () => {
    expect(isTestFile("tests/test_a.py")).toBe(true);
  });

  it("should match a.test.ts", () => {
    expect(isTestFile("a.test.ts")).toBe(true);
  });

  it("should match FooTest.java", () => {
    expect(isTestFile("FooTest.java")).toBe(true);
  });

  it("should match src/test/java/X.java", () => {
    expect(isTestFile("src/test/java/X.java")).toBe(true);
  });

  it("should match tests/test_something.py", () => {
    expect(isTestFile("tests/test_something.py")).toBe(true);
  });

  it("should match something_test.go", () => {
    expect(isTestFile("something_test.go")).toBe(true);
  });

  it("should match spec/foo_spec.rb", () => {
    // specs directory
    expect(isTestFile("spec/foo_spec.rb")).toBe(true);
  });
});

// ── Test 0.10: getSkillsForFile ─────────────────────────────────────

describe("0.10 — getSkillsForFile skill attribution", () => {
  it("should return Docker for Dockerfile", () => {
    const skills = getSkillsForFile({ path: "Dockerfile" });
    expect(skills).toContain("Docker");
  });

  it("should return CI/CD for .github/workflows/ci.yml", () => {
    const skills = getSkillsForFile({ path: ".github/workflows/ci.yml" });
    expect(skills).toContain("CI/CD");
  });

  it("should return Kubernetes for k8s/deploy.yaml", () => {
    const skills = getSkillsForFile({
      path: "k8s/deploy.yaml",
      authoredAddedLines: [
        "apiVersion: apps/v1",
        "kind: Deployment",
        "metadata:",
        "  name: my-app",
      ],
    });
    expect(skills).toContain("Kubernetes");
  });

  it("should return Terraform for main.tf", () => {
    const skills = getSkillsForFile({ path: "main.tf" });
    expect(skills).toContain("Terraform");
  });

  it("should return TypeScript for app/page.tsx", () => {
    const skills = getSkillsForFile({ path: "app/page.tsx" });
    expect(skills).toContain("TypeScript");
  });

  it("should return TypeScript + Next.js + React for app/page.tsx when repo stack says so", () => {
    const skills = getSkillsForFile({
      path: "app/page.tsx",
      repoStack: ["Next.js", "React"],
    });
    expect(skills).toContain("TypeScript");
    expect(skills).toContain("Next.js");
    expect(skills).toContain("React");
  });
});
