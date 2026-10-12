import { describe, it, expect } from "vitest";
import { sampleFilesBySkill } from "../../src/lib/skill-engine/github/ownership";
import type { CommitEvidence } from "../../src/lib/skill-engine/types";

describe("ownership & authored sampling", () => {
  it("samples and ranks files per skill based on authored added lines", () => {
    const dummyCommits: CommitEvidence[] = [
      {
        sha: "abc1234",
        date: "2024-01-01T00:00:00Z",
        files: [
          {
            path: "src/a.ts",
            status: "modified",
            additions: 15,
            deletions: 2,
            skills: ["TypeScript"],
            authoredAddedLines: ["const a = 1;", "const b = 2;"],
          },
          {
            path: "src/b.ts",
            status: "added",
            additions: 50,
            deletions: 0,
            skills: ["TypeScript"],
            authoredAddedLines: [
              "line 1",
              "line 2",
              "line 3",
              "line 4",
              "line 5",
            ],
          },
          {
            path: "backend/server.py",
            status: "added",
            additions: 20,
            deletions: 0,
            skills: ["Python"],
            authoredAddedLines: ["import os", "def start(): pass"],
          },
        ],
      },
    ];

    const sampled = sampleFilesBySkill(dummyCommits);
    expect(sampled.has("TypeScript")).toBe(true);
    expect(sampled.has("Python")).toBe(true);

    const tsFiles = sampled.get("TypeScript")!;
    expect(tsFiles).toHaveLength(2);
    // src/b.ts has 5 lines, src/a.ts has 2 lines -> src/b.ts ranked first
    expect(tsFiles[0].path).toBe("src/b.ts");
    expect(tsFiles[1].path).toBe("src/a.ts");

    const pyFiles = sampled.get("Python")!;
    expect(pyFiles).toHaveLength(1);
    expect(pyFiles[0].path).toBe("backend/server.py");
  });
});
