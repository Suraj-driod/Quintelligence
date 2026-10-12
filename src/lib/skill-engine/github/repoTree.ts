/**
 * repoTree.ts — Stack detection per repo (F8)
 * Spec reference: Agents.md §5 F8, Phase 3.3 item 4
 *
 * Phase 3 optimization:
 * - Stack detection via batched GraphQL across up to ~8 repos per query.
 * - Requests root manifest blobs (package.json, pom.xml, build.gradle, requirements.txt,
 *   pyproject.toml, go.mod, Dockerfile, docker-compose.yml) and .github/workflows tree.
 * - Replaces recursive tree + up to 10 content calls per repo (~11 REST/repo)
 *   with ~1 GraphQL call per 8 repos.
 * - Limitation note: nested manifests in monorepos are missed unless fallback used.
 */

import type { GitHubClient } from "./client";
import type { CoverageInfo, DiscoveredRepo } from "../types";
import { ENGINE_CONFIG } from "../config";
import { getSkillsFromManifest, getSkillsFromYaml } from "../skills/ontology";

// ── GraphQL Batched Stack Detection (Phase 3.3.4) ────────────────────

export async function detectStacksBatchedGraphQL(
  client: GitHubClient,
  repos: DiscoveredRepo[],
  coverage: CoverageInfo
): Promise<Map<string, string[]>> {
  const results = new Map<string, string[]>();
  if (repos.length === 0) return results;

  const batchSize = ENGINE_CONFIG.GRAPHQL_STACK_BATCH_SIZE;

  // Add limitation note
  coverage.notes.push(
    "Stack detection uses root manifests via GraphQL; nested manifests in monorepos may be missed."
  );

  for (let i = 0; i < repos.length; i += batchSize) {
    if (client.isRateLimited()) {
      coverage.truncated = true;
      coverage.notes.push(
        "Rate limit floor reached during GraphQL stack detection."
      );
      break;
    }

    const batch = repos.slice(i, i + batchSize);

    const repoFields = batch
      .map(
        (repo, idx) => `
      r${idx}: repository(owner: "${repo.owner}", name: "${repo.repo}") {
        pkgJson: object(expression: "HEAD:package.json") { ... on Blob { text } }
        pomXml: object(expression: "HEAD:pom.xml") { ... on Blob { text } }
        buildGradle: object(expression: "HEAD:build.gradle") { ... on Blob { text } }
        buildGradleKts: object(expression: "HEAD:build.gradle.kts") { ... on Blob { text } }
        reqsTxt: object(expression: "HEAD:requirements.txt") { ... on Blob { text } }
        pyproject: object(expression: "HEAD:pyproject.toml") { ... on Blob { text } }
        goMod: object(expression: "HEAD:go.mod") { ... on Blob { text } }
        dockerfile: object(expression: "HEAD:Dockerfile") { ... on Blob { text } }
        dockerComposeYml: object(expression: "HEAD:docker-compose.yml") { ... on Blob { text } }
        dockerComposeYaml: object(expression: "HEAD:docker-compose.yaml") { ... on Blob { text } }
        workflows: object(expression: "HEAD:.github/workflows") { ... on Tree { entries { name } } }
      }
    `
      )
      .join("\n");

    const query = `
      query {
        ${repoFields}
        rateLimit {
          cost
          remaining
          resetAt
        }
      }
    `;

    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data: any = await client.graphqlClient(query);

      for (let idx = 0; idx < batch.length; idx++) {
        const repo = batch[idx];
        const rData = data?.[`r${idx}`];
        const skills = new Set<string>();

        if (rData) {
          // Check package.json
          if (rData.pkgJson?.text) {
            for (const s of getSkillsFromManifest("package.json", rData.pkgJson.text)) {
              skills.add(s);
            }
          }
          // Check pom.xml
          if (rData.pomXml?.text) {
            for (const s of getSkillsFromManifest("pom.xml", rData.pomXml.text)) {
              skills.add(s);
            }
          }
          // Check build.gradle / build.gradle.kts
          if (rData.buildGradle?.text) {
            for (const s of getSkillsFromManifest("build.gradle", rData.buildGradle.text)) {
              skills.add(s);
            }
          }
          if (rData.buildGradleKts?.text) {
            for (const s of getSkillsFromManifest("build.gradle.kts", rData.buildGradleKts.text)) {
              skills.add(s);
            }
          }
          // Check requirements.txt
          if (rData.reqsTxt?.text) {
            for (const s of getSkillsFromManifest("requirements.txt", rData.reqsTxt.text)) {
              skills.add(s);
            }
          }
          // Check pyproject.toml
          if (rData.pyproject?.text) {
            for (const s of getSkillsFromManifest("pyproject.toml", rData.pyproject.text)) {
              skills.add(s);
            }
          }
          // Check go.mod
          if (rData.goMod?.text) {
            for (const s of getSkillsFromManifest("go.mod", rData.goMod.text)) {
              skills.add(s);
            }
          }
          // Check Docker
          if (rData.dockerfile?.text || rData.dockerComposeYml?.text || rData.dockerComposeYaml?.text) {
            skills.add("Docker");
          }
          // Check CI/CD workflows
          const workflowEntries = rData.workflows?.entries ?? [];
          if (workflowEntries.length > 0) {
            skills.add("CI/CD");
          }
        }

        results.set(repo.fullName, Array.from(skills));
      }
    } catch (err) {
      console.warn(
        `[skill-engine] GraphQL stack detection failed for batch, falling back to REST:`,
        err
      );
      // Fall back to REST single repo detection
      for (const repo of batch) {
        if (!client.isRateLimited()) {
          const restSkills = await detectRepoStack(
            client,
            repo.owner,
            repo.repo,
            repo.defaultBranch,
            coverage
          );
          results.set(repo.fullName, restSkills);
        }
      }
    }
  }

  return results;
}

// ── REST Fallback Tree Detection ─────────────────────────────────────

const MANIFEST_FILENAMES = new Set([
  "package.json",
  "pom.xml",
  "build.gradle",
  "build.gradle.kts",
  "requirements.txt",
  "pyproject.toml",
  "Pipfile",
  "Gemfile",
  "Cargo.toml",
  "go.mod",
  "composer.json",
  "Dockerfile",
  "docker-compose.yml",
  "docker-compose.yaml",
]);

const MANIFEST_PATH_PATTERNS = [
  /^\.github\/workflows\//,
  /^k8s\//,
  /^helm\//,
  /^deploy\//,
  /^\.gitlab-ci\.yml$/,
  /^Jenkinsfile$/,
  /^\.circleci\/config\.yml$/,
  /^\.travis\.yml$/,
  /^azure-pipelines\.yml$/,
];

/**
 * Detect stack using REST git tree API (fallback).
 */
export async function detectRepoStack(
  client: GitHubClient,
  owner: string,
  repo: string,
  defaultBranch: string,
  coverage: CoverageInfo
): Promise<string[]> {
  const skills = new Set<string>();

  if (client.isRateLimited()) {
    coverage.truncated = true;
    coverage.notes.push(
      `Rate limit floor reached before stack detection for ${owner}/${repo}.`
    );
    return [];
  }

  try {
    const { data: tree } = await client.rest.git.getTree({
      owner,
      repo,
      tree_sha: defaultBranch,
      recursive: "1",
    });

    if (tree.truncated) {
      coverage.notes.push(
        `Tree for ${owner}/${repo} was truncated by GitHub. Stack detection may be incomplete.`
      );
    }

    const manifestPaths: string[] = [];

    for (const item of tree.tree) {
      if (item.type !== "blob" || !item.path) continue;
      const filename = item.path.split("/").pop() ?? "";

      if (MANIFEST_FILENAMES.has(filename)) {
        manifestPaths.push(item.path);
        continue;
      }

      for (const pattern of MANIFEST_PATH_PATTERNS) {
        if (pattern.test(item.path)) {
          manifestPaths.push(item.path);
          break;
        }
      }
    }

    const toFetch = manifestPaths.slice(0, ENGINE_CONFIG.MAX_MANIFESTS_PER_REPO);

    for (const path of toFetch) {
      if (client.isRateLimited()) break;

      try {
        const { data: fileData } = await client.rest.repos.getContent({
          owner,
          repo,
          path,
        });

        if ("content" in fileData && fileData.encoding === "base64") {
          const content = Buffer.from(fileData.content, "base64").toString("utf-8");
          const filename = path.split("/").pop() ?? "";

          const manifestSkills = getSkillsFromManifest(filename, content);
          for (const s of manifestSkills) skills.add(s);

          if (filename.endsWith(".yml") || filename.endsWith(".yaml")) {
            const yamlSkills = getSkillsFromYaml(content);
            for (const s of yamlSkills) skills.add(s);
          }

          if (path.startsWith(".github/workflows/")) {
            skills.add("CI/CD");
          }

          if (filename === "Dockerfile" || filename.startsWith("docker-compose")) {
            skills.add("Docker");
          }
        }
      } catch (fileError) {
        console.warn(
          `[skill-engine] Could not fetch ${path} in ${owner}/${repo}:`,
          fileError
        );
      }
    }
  } catch (error) {
    console.warn(
      `[skill-engine] Error fetching tree for ${owner}/${repo}:`,
      error
    );
    coverage.notes.push(
      `Could not fetch tree for ${owner}/${repo}. Stack detection skipped.`
    );
  }

  return Array.from(skills);
}
