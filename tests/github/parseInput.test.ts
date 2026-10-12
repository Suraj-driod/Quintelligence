import { describe, it, expect } from "vitest";
import { parseGitHubInput } from "../../src/lib/skill-engine/github/parseInput";

describe("parseGitHubInput", () => {
  it("parses user profile URLs", () => {
    const res = parseGitHubInput("https://github.com/torvalds");
    expect(res).toEqual({
      type: "user",
      owner: "torvalds",
      targetLogin: "torvalds",
    });
  });

  it("handles trailing slashes, .git, and www prefixes", () => {
    expect(parseGitHubInput("http://www.github.com/torvalds/")).toEqual({
      type: "user",
      owner: "torvalds",
      targetLogin: "torvalds",
    });
    expect(parseGitHubInput("github.com/torvalds.git")).toEqual({
      type: "user",
      owner: "torvalds",
      targetLogin: "torvalds",
    });
    expect(parseGitHubInput("https://github.com/torvalds?tab=repositories#foo")).toEqual({
      type: "user",
      owner: "torvalds",
      targetLogin: "torvalds",
    });
  });

  it("parses repository URLs", () => {
    const res = parseGitHubInput("https://github.com/facebook/react");
    expect(res).toEqual({
      type: "repo",
      owner: "facebook",
      repo: "react",
      targetLogin: "facebook",
    });
  });

  it("parses repository URLs with contributor parameter", () => {
    const res = parseGitHubInput("https://github.com/facebook/react", "gaearon");
    expect(res).toEqual({
      type: "repo",
      owner: "facebook",
      repo: "react",
      targetLogin: "gaearon",
    });
  });

  it("strips tree and blob paths", () => {
    expect(parseGitHubInput("https://github.com/vercel/next.js/tree/canary")).toEqual({
      type: "repo",
      owner: "vercel",
      repo: "next.js",
      targetLogin: "vercel",
    });
    expect(parseGitHubInput("https://github.com/vercel/next.js/blob/canary/README.md")).toEqual({
      type: "repo",
      owner: "vercel",
      repo: "next.js",
      targetLogin: "vercel",
    });
  });

  it("throws for non-GitHub URLs", () => {
    expect(() => parseGitHubInput("https://gitlab.com/user/repo")).toThrow(
      /Invalid GitHub URL/
    );
    expect(() => parseGitHubInput("https://google.com")).toThrow(
      /Invalid GitHub URL/
    );
    expect(() => parseGitHubInput("not-a-url")).toThrow(
      /Invalid GitHub URL/
    );
  });
});
