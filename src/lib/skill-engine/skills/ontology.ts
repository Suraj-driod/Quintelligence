/**
 * ontology.ts — Skill mapping rules (hand-written data).
 * Spec reference: Agents.md §5 F7 & CLAUDE_CODE_PROMPT.md §2.2
 *
 * This is DATA, not logic. Start with 8–10 skills.
 * File-level skills (language) come from extension.
 * Framework/tool skills come from repo-level manifests or path conventions.
 *
 * Phase 2 changes:
 *   - getPrimarySkill deleted (used singular skill; replaced by getSkillsForFile)
 *   - getSkillsByFilename: fixed substring bug — uses exact filename OR
 *     path-segment containment, NOT arbitrary substring match
 *   - getSkillsForFile is the canonical attribution entry point
 *   - augmentFileSkills was a dead no-op; removed
 */

import type { SkillDefinition } from "../types";

// ── Skill Definitions ────────────────────────────────────────────────

export const SKILL_ONTOLOGY: SkillDefinition[] = [
  // --- Language skills (from file extension) ---
  {
    skill: "Java",
    match: { ext: [".java"] },
  },
  {
    skill: "Python",
    match: { ext: [".py"] },
  },
  {
    skill: "TypeScript",
    match: { ext: [".ts", ".tsx"] },
  },
  {
    skill: "JavaScript",
    match: { ext: [".js", ".jsx", ".mjs", ".cjs"] },
  },
  {
    skill: "Go",
    match: { ext: [".go"] },
  },
  {
    skill: "Rust",
    match: { ext: [".rs"] },
  },
  {
    skill: "C#",
    match: { ext: [".cs"] },
  },
  {
    skill: "C/C++",
    match: { ext: [".c", ".cpp", ".cc", ".cxx", ".h", ".hpp", ".hxx"] },
  },

  // --- Framework / tool skills (from manifests + filenames) ---
  {
    skill: "Docker",
    match: {
      filename: [
        "Dockerfile",
        "docker-compose.yml",
        "docker-compose.yaml",
        ".dockerignore",
      ],
    },
  },
  {
    skill: "Kubernetes",
    match: {
      yamlContains: [
        "kind: Deployment",
        "kind: Service",
        "kind: StatefulSet",
        "kind: DaemonSet",
        "kind: ConfigMap",
        "kind: Ingress",
        "apiVersion: apps/v1",
        "apiVersion: networking.k8s.io",
      ],
    },
  },
  {
    skill: "React",
    match: {
      manifestContains: {
        "package.json": ['"react"'],
      },
    },
  },
  {
    skill: "Next.js",
    match: {
      manifestContains: {
        "package.json": ['"next"'],
      },
    },
  },
  {
    skill: "Spring Boot",
    match: {
      manifestContains: {
        "pom.xml": ["spring-boot-starter"],
        "build.gradle": ["org.springframework.boot"],
      },
    },
  },
  {
    skill: "Django",
    match: {
      manifestContains: {
        "requirements.txt": ["django", "Django"],
        "pyproject.toml": ["django", "Django"],
        Pipfile: ["django", "Django"],
      },
    },
  },
  {
    skill: "CI/CD",
    match: {
      filename: [
        // Note: matching is done by path-segment containment for directories,
        // and exact filename for files (see getSkillsByFilename below).
        ".github/workflows",
        "Jenkinsfile",
        ".gitlab-ci.yml",
        ".travis.yml",
        "azure-pipelines.yml",
      ],
    },
  },
  {
    skill: "Terraform",
    match: {
      ext: [".tf", ".tfvars"],
    },
  },
];

// ── Helpers ──────────────────────────────────────────────────────────

/**
 * Map a file path to matching language-level skills based on extension.
 */
export function getSkillsByExtension(filePath: string): string[] {
  const skills: string[] = [];
  const normalized = filePath.toLowerCase();

  for (const def of SKILL_ONTOLOGY) {
    if (def.match.ext) {
      for (const ext of def.match.ext) {
        if (normalized.endsWith(ext)) {
          skills.push(def.skill);
          break;
        }
      }
    }
  }

  return skills;
}

/**
 * Map a file path to matching skills based on exact filename.
 * Fixed: uses exact filename match OR path-segment match for directories.
 * Does NOT use substring match (which caused false positives on arbitrary paths).
 */
export function getSkillsByFilename(filePath: string): string[] {
  const skills: string[] = [];
  const normalized = filePath.replace(/\\/g, "/");
  const filename = normalized.split("/").pop() ?? "";
  const segments = normalized.split("/");

  for (const def of SKILL_ONTOLOGY) {
    if (def.match.filename) {
      for (const fn of def.match.filename) {
        // Exact filename match
        if (filename === fn) {
          skills.push(def.skill);
          break;
        }
        // Path-segment match: each segment of fn must appear in normalized path segments
        // e.g. ".github/workflows" is a two-segment prefix, not a bare substring
        const fnSegments = fn.split("/");
        const fnFilename = fnSegments[fnSegments.length - 1];
        if (fnSegments.length > 1) {
          // Check that all fn segments appear consecutively in the path
          const start = segments.indexOf(fnSegments[0]);
          if (start >= 0) {
            const match = fnSegments.every((seg, i) => segments[start + i] === seg);
            if (match) {
              skills.push(def.skill);
              break;
            }
          }
        } else if (filename === fnFilename) {
          skills.push(def.skill);
          break;
        }
      }
    }
  }

  return skills;
}

/**
 * Detect framework/tool skills from manifest file contents.
 * Returns a map of manifest filename → detected skills.
 */
export function getSkillsFromManifest(
  manifestFilename: string,
  content: string
): string[] {
  const skills: string[] = [];

  for (const def of SKILL_ONTOLOGY) {
    if (def.match.manifestContains) {
      const patterns = def.match.manifestContains[manifestFilename];
      if (patterns) {
        for (const pattern of patterns) {
          if (content.includes(pattern)) {
            skills.push(def.skill);
            break;
          }
        }
      }
    }
  }

  return skills;
}

/**
 * Detect Kubernetes-style skills from YAML content.
 */
export function getSkillsFromYaml(content: string): string[] {
  const skills: string[] = [];

  for (const def of SKILL_ONTOLOGY) {
    if (def.match.yamlContains) {
      for (const pattern of def.match.yamlContains) {
        if (content.includes(pattern)) {
          skills.push(def.skill);
          break;
        }
      }
    }
  }

  return skills;
}

/**
 * Get all skills for a file path, using repo stack context and authored lines.
 * This is the canonical file-level attribution entry point (Phase 2.2).
 *
 * Attribution is applied AFTER stack detection (stack is repo-level).
 * File-level attribution runs here; framework skills require repoStack.
 *
 * Returns string[] — may be empty for unmapped files.
 */
export function getSkillsForFile(params: {
  path: string;
  repoStack?: string[];
  authoredAddedLines?: string[];
}): string[] {
  const result = new Set<string>();
  const normalized = params.path.replace(/\\/g, "/");
  const filename = normalized.split("/").pop() ?? "";
  const repoStack = params.repoStack ?? [];

  // 1. Language by extension (e.g. .ts, .tsx, .py, .java, .tf, etc.)
  const extSkills = getSkillsByExtension(normalized);
  for (const s of extSkills) {
    result.add(s);
  }

  // 2. Docker: Dockerfile*, docker-compose*.y(a)ml, compose*.y(a)ml, .dockerignore
  if (
    /^Dockerfile(?:\..+)?$/i.test(filename) ||
    /^(?:docker-)?compose.*\.ya?ml$/i.test(filename) ||
    filename === ".dockerignore"
  ) {
    result.add("Docker");
  }

  // 3. CI/CD: .github/workflows/*.yml|yaml, Jenkinsfile, .gitlab-ci.yml,
  //           .circleci/config.yml, .travis.yml, azure-pipelines.yml
  if (
    /(?:^|\/)\.github\/workflows\/.*\.ya?ml$/i.test(normalized) ||
    filename === "Jenkinsfile" ||
    filename === ".gitlab-ci.yml" ||
    /(?:^|\/)\.circleci\/config\.ya?ml$/i.test(normalized) ||
    filename === ".travis.yml" ||
    filename === "azure-pipelines.yml"
  ) {
    result.add("CI/CD");
  }

  // 4. Kubernetes: *.y(a)ml under k8s/, kubernetes/, manifests/, helm/, charts/, deploy/
  //    OR authored lines containing both apiVersion: and a kind: of a known K8s kind
  const isK8sDir = /(?:^|\/)(?:k8s|kubernetes|manifests|helm|charts|deploy)\/.*\.ya?ml$/i.test(normalized);
  let hasK8sLines = false;
  if (params.authoredAddedLines && params.authoredAddedLines.length > 0) {
    const text = params.authoredAddedLines.join("\n");
    const hasApiVersion = /apiVersion:\s*[\w.\/]+/i.test(text);
    const hasKind = /kind:\s*(?:Deployment|Service|StatefulSet|DaemonSet|ConfigMap|Ingress|Pod|Job|CronJob|PersistentVolumeClaim|Secret|Namespace)/i.test(text);
    hasK8sLines = hasApiVersion && hasKind;
  }
  if (/\.ya?ml$/i.test(normalized) && (isK8sDir || hasK8sLines)) {
    result.add("Kubernetes");
  }

  // 5. Framework skills (precondition: repoStack includes the framework)
  if (repoStack.length > 0) {
    // Spring Boot: .java under src/main/java|src/test/java and repo stack has Spring Boot
    if (
      repoStack.includes("Spring Boot") &&
      /\.java$/i.test(normalized) &&
      /(?:^|\/)src\/(?:main|test)\/java\//i.test(normalized)
    ) {
      result.add("Spring Boot");
    }

    // React: .tsx|.jsx and repo stack has React
    if (
      repoStack.includes("React") &&
      /\.[jt]sx$/i.test(normalized)
    ) {
      result.add("React");
    }

    // Next.js: repo stack has Next.js and path under app/, pages/, src/app/, src/pages/, or next.config.*
    if (
      repoStack.includes("Next.js") &&
      (/(?:^|\/)(?:src\/)?(?:app|pages)\//i.test(normalized) || /^next\.config\./i.test(filename))
    ) {
      result.add("Next.js");
    }

    // Django: repo stack has Django and path matches specific filenames or directories
    if (
      repoStack.includes("Django") &&
      /\.py$/i.test(normalized) &&
      (/(?:views|models|urls|admin|forms|serializers|settings|apps|middleware)\.py$/i.test(filename) ||
        /(?:^|\/)(?:migrations|management\/commands)\//i.test(normalized))
    ) {
      result.add("Django");
    }
  }

  // 6. Also include filename-based skills (Jenkinsfile etc.) using fixed matching
  const filenameSkills = getSkillsByFilename(normalized);
  for (const s of filenameSkills) {
    result.add(s);
  }

  return Array.from(result);
}

/**
 * @deprecated Legacy helper for single-skill lookup. Returns first mapped skill or null.
 * Use getSkillsForFile instead.
 */
export function getPrimarySkill(filePath: string): string | null {
  const skills = getSkillsForFile({ path: filePath });
  return skills.length > 0 ? skills[0] : null;
}
