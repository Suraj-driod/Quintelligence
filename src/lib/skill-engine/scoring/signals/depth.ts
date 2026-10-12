/**
 * signals/depth.ts — Signal D (Depth)
 * Spec reference: CLAUDE_CODE_PROMPT.md Phase 4.3
 *
 * D = min(1, Σ weights of detected constructs / target)
 * where target = DEPTH_TARGET_FRACTION × sum of all weights in profile
 *
 * Returns null (not 0) when:
 *   - No authored lines exist, OR
 *   - Fewer than DEPTH_MIN_LINES non-comment authored lines, OR
 *   - No constructs detected
 *
 * Construct counts only if it appears in ≥ DEPTH_MIN_MATCHES lines.
 *
 * Preprocessing:
 *   - Drop blank lines and comment lines before matching
 *   - Regexes fixed: no @ts- in decorators, proper TS type-predicate, go goroutine, etc.
 *
 * Tool skills (Docker, CI/CD, Kubernetes, Terraform) use marker profiles.
 * Skills with no language profile return null for D.
 */

import { SCORING_CONFIG } from "../config";
import type { FileEvidence } from "../../types";

export interface ConstructPattern {
  name: string;
  weight: number; // 1 to 4
  regex: RegExp;
}

// ── Comment-line patterns ────────────────────────────────────────────

const COMMENT_LINE_REGEXES = [
  /^\s*\/\//,       // JS/TS/Java/Go/C++: //
  /^\s*#/,          // Python/Ruby/Shell: #
  /^\s*\*/,         // JSDoc/block comment continuation: *
  /^\s*\/\*/,       // Block comment start: /*
  /^\s*\*\//,       // Block comment end: */
  /^\s*--/,         // SQL/Lua: --
  /^\s*<!--/,       // HTML/XML: <!--
  /^\s*"""/,        // Python docstring: """
  /^\s*'''/,        // Python docstring: '''
];

function isCommentLine(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed === "") return true; // blank lines
  return COMMENT_LINE_REGEXES.some((re) => re.test(trimmed));
}

// ── Multi-language Construct Sophistication Patterns ─────────────────
// These are evaluated against ALL authored lines (language-agnostic pass).
// Skills without a profile get null D.
const CONSTRUCT_PATTERNS: ConstructPattern[] = [
  // Tier 1: Basic structures (weight 1.0)
  {
    name: "functions_methods",
    weight: 1.0,
    regex: /(?:function\s+\w+|def\s+\w+|\bpublic\s+(?:void|\w+)\s+\w+|\bfn\s+\w+|\bfunc\s+\w+)/,
  },
  {
    name: "loops_conditionals",
    weight: 1.0,
    regex: /(?:for\s*\(|while\s*\(|if\s*\(|\bif\s+|\bwhile\s+|\bfor\s+\w+\s+in|switch\s*\(|match\s+\w+)/,
  },

  // Tier 2: Intermediate structures (weight 2.0)
  {
    name: "error_handling",
    weight: 2.0,
    regex: /(?:try\s*\{|catch\s*\(|except\s+\w+|finally\s*\{|throw\s+new|raise\s+\w+)/,
  },
  {
    name: "classes_interfaces",
    weight: 2.0,
    // Fixed: `type X =` only for TS; `implements` is not generics
    regex: /(?:class\s+\w+|interface\s+\w+|struct\s+\w+|enum\s+\w+)/,
  },
  {
    name: "data_transformations",
    weight: 2.0,
    regex: /(?:\.\s*map\(|\.\s*filter\(|\.\s*reduce\(|\[\s*\w+\s+for\s+\w+\s+in|\.stream\(\))/,
  },

  // Tier 3: Advanced structures (weight 3.0)
  {
    name: "asynchronous_concurrency",
    weight: 3.0,
    regex: /(?:async\s+(?:function|def|void|\w+)|await\s+\w+|Promise\.(?:all|resolve)|asyncio\.|CompletableFuture)/,
  },
  {
    name: "generics_typing",
    weight: 3.0,
    // Fixed: proper generic syntax only (not `is Type` false positives)
    regex: /(?:<[A-Z](?:,\s*[A-Z])*>\s*\(|<T(?:,\s*[A-Z])*>|type\s+\w+\s*<.*?>|Record<|Generic\[)/,
  },
  {
    name: "decorators_annotations",
    weight: 3.0,
    // Fixed: removed @ts- (TypeScript directives, not decorators)
    // Includes Python decorators (^@) and Java/Spring annotations
    regex: /(?:^\s*@(?!ts-)(?:Component|Injectable|Override|Autowired|dataclass|route|RestController|Service|Entity|Transactional|Repository|Controller|SpringBootApplication|Bean|Autowired|RequestMapping|GetMapping|PostMapping|\w+)\b)/,
  },

  // Tier 4: Mastery constructs (weight 4.0)
  {
    name: "advanced_concurrency_channels",
    weight: 4.0,
    // Fixed go pattern: requires `go func` or `go <ident>(`  (not `go ` as a word)
    regex: /(?:^\s*go\s+(?:func\b|\w+\()|chan\s+\w+|sync\.(?:Mutex|WaitGroup)|threading\.Thread|AtomicInteger|SharedPointer)/,
  },
  {
    name: "generators_metaprogramming",
    weight: 4.0,
    regex: /(?:yield\s+|function\*\s+|yield\s+from|Proxy\(|Reflect\.|__getattr__|__call__)/,
  },
  {
    name: "type_guards_conditional_types",
    weight: 4.0,
    // Fixed: require TS type-predicate pattern `): <param> is <Type>`
    // NOT bare `is\s+[A-Z]` which false-positives on "This is Important"
    regex: /(?:\)\s*:\s*\w+\s+is\s+\w+|infer\s+[A-Z]|keyof\s+\w+|extends\s+keyof|\btyping\.TypeVar\b)/,
  },
];

// ── Tool skill marker profiles ────────────────────────────────────────
// Skills with no language profile use these marker sets.
// Same minimum presence rule (DEPTH_MIN_MATCHES) applies.

const TOOL_SKILL_PATTERNS: Record<string, ConstructPattern[]> = {
  Docker: [
    { name: "multi_stage_build", weight: 3, regex: /FROM\s+\S+\s+AS\s+\w+/i },
    { name: "copy_from",         weight: 3, regex: /COPY\s+--from=/i },
    { name: "healthcheck",       weight: 3, regex: /^HEALTHCHECK\b/i },
    { name: "non_root_user",     weight: 2, regex: /^USER\s+(?!root)\S+/i },
    { name: "arg",               weight: 1, regex: /^ARG\s+\w+/i },
    { name: "layered_run",       weight: 2, regex: /RUN\s+.*&&/i },
  ],
  "CI/CD": [
    { name: "matrix",            weight: 2, regex: /matrix:/i },
    { name: "needs",             weight: 3, regex: /needs:/i },
    { name: "cache",             weight: 2, regex: /actions\/cache|cache:/i },
    { name: "secrets",           weight: 3, regex: /secrets\./i },
    { name: "environment",       weight: 2, regex: /environment:/i },
    { name: "reusable_workflow", weight: 4, regex: /workflow_call|workflow_dispatch/i },
    { name: "concurrency",       weight: 2, regex: /concurrency:/i },
  ],
  Kubernetes: [
    { name: "deploy_svc_ingress", weight: 3, regex: /kind:\s*(?:Deployment|Service|Ingress)/i },
    { name: "resource_limits",   weight: 3, regex: /resources:/i },
    { name: "probes",            weight: 3, regex: /(?:liveness|readiness)Probe/i },
    { name: "hpa",               weight: 4, regex: /kind:\s*HorizontalPodAutoscaler/i },
    { name: "config_secret",     weight: 2, regex: /kind:\s*(?:ConfigMap|Secret)/i },
  ],
  Terraform: [
    { name: "module",            weight: 3, regex: /\bmodule\s+"\w+"/i },
    { name: "variable",          weight: 1, regex: /\bvariable\s+"\w+"/i },
    { name: "output",            weight: 1, regex: /\boutput\s+"\w+"/i },
    { name: "for_each_count",    weight: 3, regex: /\b(?:for_each|count)\s+=/i },
    { name: "backend",           weight: 3, regex: /\bbackend\s+"\w+"/i },
    { name: "data_source",       weight: 2, regex: /\bdata\s+"\w+"\s+"\w+"/i },
  ],
};

// ── Known skills with language profiles ──────────────────────────────
// Skills NOT in this set and NOT in TOOL_SKILL_PATTERNS return D = null.
const LANGUAGE_SKILLS = new Set([
  "TypeScript", "JavaScript", "Python", "Java", "Go", "Rust",
  "C#", "C/C++", "Spring Boot", "React", "Next.js", "Django",
]);

/**
 * Calculate Signal D (Depth) for a set of files belonging to a skill.
 * Analyzes the user's own diff lines (`authoredAddedLines`).
 *
 * Returns null when D is unavailable (no authored lines, too few lines, or
 * no language profile for the skill).
 */
export function calculateDepthSignal(
  files: FileEvidence[],
  skill?: string
): {
  score: number | null;
  detectedFeatures: string[];
} {
  const { DEPTH_MIN_MATCHES, DEPTH_MIN_LINES, DEPTH_TARGET_FRACTION } =
    SCORING_CONFIG.NORMALIZATION;

  // Choose pattern set
  const isLanguageSkill = !skill || LANGUAGE_SKILLS.has(skill);
  const isToolSkill = skill && Object.prototype.hasOwnProperty.call(TOOL_SKILL_PATTERNS, skill);

  if (!isLanguageSkill && !isToolSkill) {
    // No depth profile for this skill
    return { score: null, detectedFeatures: [] };
  }

  const patterns = isToolSkill
    ? TOOL_SKILL_PATTERNS[skill!]
    : CONSTRUCT_PATTERNS;

  // Collect all non-comment authored lines
  const allLines: string[] = [];

  for (const file of files) {
    if (!file.authoredAddedLines || file.authoredAddedLines.length === 0) continue;

    for (const line of file.authoredAddedLines) {
      if (!isCommentLine(line)) {
        allLines.push(line);
      }
    }
  }

  // D = null if insufficient authored lines
  if (allLines.length < DEPTH_MIN_LINES) {
    return { score: null, detectedFeatures: [] };
  }

  // Count matches per construct
  const matchCounts = new Map<string, { count: number; weight: number }>();

  for (const line of allLines) {
    for (const pattern of patterns) {
      if (pattern.regex.test(line)) {
        const existing = matchCounts.get(pattern.name);
        if (existing) {
          existing.count++;
        } else {
          matchCounts.set(pattern.name, { count: 1, weight: pattern.weight });
        }
      }
    }
  }

  const detectedFeatures: string[] = [];
  let totalWeight = 0;

  for (const [name, { count, weight }] of matchCounts.entries()) {
    // A construct counts only if ≥ DEPTH_MIN_MATCHES matching lines
    if (count >= DEPTH_MIN_MATCHES) {
      detectedFeatures.push(name);
      totalWeight += weight;
    }
  }

  if (detectedFeatures.length === 0) {
    return { score: null, detectedFeatures: [] };
  }

  // Normalize: D = min(1, Σ weights / target)
  // target = DEPTH_TARGET_FRACTION × sum of all weights in the profile
  const maxPossibleWeight = patterns.reduce((sum, p) => sum + p.weight, 0);
  const target = DEPTH_TARGET_FRACTION * maxPossibleWeight;
  const score = Math.min(1.0, totalWeight / target);

  return {
    score: Number(score.toFixed(4)),
    detectedFeatures,
  };
}
