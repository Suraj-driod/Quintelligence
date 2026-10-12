import { describe, it, expect } from "vitest";
import {
  getSkillsByExtension,
  getSkillsByFilename,
  getSkillsFromManifest,
  getSkillsFromYaml,
  getPrimarySkill,
} from "../../src/lib/skill-engine/skills/ontology";

describe("ontology", () => {
  describe("getSkillsByExtension", () => {
    it("maps programming language extensions", () => {
      expect(getSkillsByExtension("src/index.ts")).toContain("TypeScript");
      expect(getSkillsByExtension("components/App.tsx")).toContain("TypeScript");
      expect(getSkillsByExtension("scripts/deploy.js")).toContain("JavaScript");
      expect(getSkillsByExtension("backend/server.py")).toContain("Python");
      expect(getSkillsByExtension("src/main/java/App.java")).toContain("Java");
      expect(getSkillsByExtension("main.go")).toContain("Go");
      expect(getSkillsByExtension("src/lib.rs")).toContain("Rust");
      expect(getSkillsByExtension("App.cs")).toContain("C#");
      expect(getSkillsByExtension("main.cpp")).toContain("C/C++");
      expect(getSkillsByExtension("main.tf")).toContain("Terraform");
    });

    it("returns empty for unmapped extensions", () => {
      expect(getSkillsByExtension("notes.txt")).toEqual([]);
      expect(getSkillsByExtension("data.csv")).toEqual([]);
    });
  });

  describe("getSkillsByFilename", () => {
    it("detects Docker from Dockerfile and docker-compose", () => {
      expect(getSkillsByFilename("Dockerfile")).toContain("Docker");
      expect(getSkillsByFilename("deploy/docker-compose.yml")).toContain("Docker");
    });

    it("detects CI/CD from workflow and config files", () => {
      expect(getSkillsByFilename(".github/workflows/deploy.yml")).toContain("CI/CD");
      expect(getSkillsByFilename("Jenkinsfile")).toContain("CI/CD");
    });
  });

  describe("getSkillsFromManifest", () => {
    it("detects Next.js and React from package.json", () => {
      const pkg = JSON.stringify({
        dependencies: {
          next: "^14.0.0",
          react: "^18.2.0",
        },
      });
      const skills = getSkillsFromManifest("package.json", pkg);
      expect(skills).toContain("Next.js");
      expect(skills).toContain("React");
    });

    it("detects Spring Boot from pom.xml", () => {
      const pom = `<project><dependencies><dependency><artifactId>spring-boot-starter-web</artifactId></dependency></dependencies></project>`;
      expect(getSkillsFromManifest("pom.xml", pom)).toContain("Spring Boot");
    });

    it("detects Django from requirements.txt", () => {
      const reqs = "django==4.2.0\npsycopg2-binary==2.9.6\n";
      expect(getSkillsFromManifest("requirements.txt", reqs)).toContain("Django");
    });
  });

  describe("getSkillsFromYaml", () => {
    it("detects Kubernetes from deployment yaml", () => {
      const yaml = `
apiVersion: apps/v1
kind: Deployment
metadata:
  name: nginx-deployment
`;
      expect(getSkillsFromYaml(yaml)).toContain("Kubernetes");
    });
  });

  describe("getPrimarySkill", () => {
    it("returns primary skill for recognized files", () => {
      expect(getPrimarySkill("index.ts")).toBe("TypeScript");
      expect(getPrimarySkill("server.py")).toBe("Python");
      expect(getPrimarySkill("Main.java")).toBe("Java");
      expect(getPrimarySkill("readme.md")).toBeNull();
    });
  });
});
