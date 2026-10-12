/**
 * signals/breadth.ts — Library extraction (display-only, NOT a scored signal)
 * Spec reference: CLAUDE_CODE_PROMPT.md §Decisions — Breadth removed from scoring.
 *
 * Breadth (B) has been removed from the composite score. Counting distinct
 * imported libraries against a cap of 8 measures name-dropping, was buggy,
 * and duplicates what Depth and Volume already capture.
 *
 * This module is kept as a DISPLAY-ONLY helper that produces `librariesObserved`
 * for the UI. It does NOT produce a signal score and is NOT called by the evaluator.
 */

import type { FileEvidence } from "../../types";

// ── Common standard library modules to filter out ───────────────────
const STANDARD_LIBRARIES = new Set([
  // Python stdlib
  "os", "sys", "re", "json", "time", "datetime", "math", "random", "logging",
  "collections", "itertools", "functools", "typing", "pathlib", "subprocess",
  "unittest", "io", "copy", "shutil", "urllib", "http",
  // Node.js stdlib
  "fs", "path", "crypto", "https", "url", "events", "stream", "util",
  "child_process", "assert", "buffer", "process",
  // Java stdlib
  "java", "javax",
]);

/**
 * Extract external library names from an authored patch line.
 * Used only for the display-only librariesObserved list.
 */
export function extractLibrariesFromLine(line: string): string[] {
  const trimmed = line.trim();
  const found: string[] = [];

  // 1. Rust: use pkg::...
  const rustMatch = trimmed.match(/^use\s+([a-zA-Z0-9_]+)::/);
  if (rustMatch) {
    if (rustMatch[1] !== "std" && rustMatch[1] !== "crate" && rustMatch[1] !== "super") {
      found.push(rustMatch[1]);
    }
    return found;
  }

  // 2. JS / TS: import ... from 'pkg' or require('pkg') or dynamic import('pkg')
  if (
    trimmed.includes("from ") ||
    trimmed.includes("require(") ||
    trimmed.includes("import(") ||
    trimmed.match(/^import\s+['"]/)
  ) {
    const jsMatch = trimmed.matchAll(
      /(?:import\s+.*?\s+from\s+['"]|require\(\s*['"]|import\(\s*['"]|^import\s+['"])([@a-zA-Z0-9_/-]+)['"]/g
    );
    for (const m of jsMatch) {
      let pkg = m[1];
      // Skip relative imports (local aliases and @/ path aliases)
      if (pkg.startsWith(".") || pkg.startsWith("@/")) continue;
      if (pkg.startsWith("node:")) {
        pkg = pkg.slice(5);
      }
      if (pkg.startsWith("@")) {
        const parts = pkg.split("/");
        pkg = parts.slice(0, 2).join("/");
      } else {
        pkg = pkg.split("/")[0];
      }
      if (!pkg.startsWith(".") && !STANDARD_LIBRARIES.has(pkg)) {
        found.push(pkg);
      }
    }
    return Array.from(new Set(found));
  }

  // 3. Java: import [static] com.example.Class; (contains dots for package hierarchy)
  const javaMatch = trimmed.match(
    /^import\s+(?:static\s+)?([a-zA-Z0-9_]+(?:\.[a-zA-Z0-9_]+)+);?/
  );
  if (javaMatch) {
    const fullPath = javaMatch[1];
    const parts = fullPath.split(".");
    const pkg = parts.length > 1 ? `${parts[0]}.${parts[1]}` : parts[0];
    if (!pkg.startsWith("java.") && !pkg.startsWith("javax.")) {
      found.push(pkg);
    }
    return Array.from(new Set(found));
  }

  // 4a. Python: from pkg.sub import ...
  const pyFromMatch = trimmed.match(/^from\s+([a-zA-Z0-9_]+)/);
  if (pyFromMatch) {
    const pkg = pyFromMatch[1];
    if (!STANDARD_LIBRARIES.has(pkg)) {
      found.push(pkg);
    }
    return Array.from(new Set(found));
  }

  // 4b. Python: import pkg1, pkg2 or import pkg as alias
  const pyImportMatch = trimmed.match(/^import\s+([a-zA-Z0-9_,\s]+)(?:\s+as\s+[a-zA-Z0-9_]+)?$/);
  if (pyImportMatch && !trimmed.includes(";")) {
    const rawPkgs = pyImportMatch[1].split(",");
    for (const raw of rawPkgs) {
      const pkg = raw.trim().split(/\s+as\s+/)[0].trim();
      if (pkg && !STANDARD_LIBRARIES.has(pkg)) {
        found.push(pkg);
      }
    }
    return Array.from(new Set(found));
  }

  return Array.from(new Set(found));
}

/**
 * Extract a display-only list of observed libraries from files' authored lines.
 * NOT used for scoring — only for UI display.
 */
export function getObservedLibraries(files: FileEvidence[]): string[] {
  const libraries = new Set<string>();

  for (const file of files) {
    if (!file.authoredAddedLines) continue;
    for (const line of file.authoredAddedLines) {
      const libs = extractLibrariesFromLine(line);
      for (const lib of libs) {
        libraries.add(lib);
      }
    }
  }

  return Array.from(libraries).sort();
}
