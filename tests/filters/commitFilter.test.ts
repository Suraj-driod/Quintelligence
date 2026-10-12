import { describe, it, expect } from "vitest";
import {
  isBotAuthor,
  isMergeCommit,
  isBulkCommit,
  shouldDropCommit,
} from "../../src/lib/skill-engine/filters/commitFilter";

describe("commitFilter", () => {
  describe("isBotAuthor", () => {
    it("identifies known bot patterns", () => {
      expect(isBotAuthor("dependabot[bot]")).toBe(true);
      expect(isBotAuthor("renovate[bot]")).toBe(true);
      expect(isBotAuthor("github-actions[bot]")).toBe(true);
      expect(isBotAuthor("codecov[bot]")).toBe(true);
      expect(isBotAuthor("greenkeeper[bot]")).toBe(true);
      expect(isBotAuthor("snyk-bot")).toBe(true);
    });

    it("identifies human developers as non-bot", () => {
      expect(isBotAuthor("torvalds")).toBe(false);
      expect(isBotAuthor("suraj-droid")).toBe(false);
      expect(isBotAuthor("octocat")).toBe(false);
    });
  });

  describe("isMergeCommit", () => {
    it("flags commits with more than 1 parent as merge commits", () => {
      expect(isMergeCommit(2)).toBe(true);
      expect(isMergeCommit(3)).toBe(true);
    });

    it("treats single-parent and root commits as non-merge", () => {
      expect(isMergeCommit(1)).toBe(false);
      expect(isMergeCommit(0)).toBe(false);
    });
  });

  describe("isBulkCommit", () => {
    it("flags commits touching > 100 files as bulk commits", () => {
      expect(isBulkCommit(101)).toBe(true);
      expect(isBulkCommit(500)).toBe(true);
    });

    it("allows standard commits <= 100 files", () => {
      expect(isBulkCommit(100)).toBe(false);
      expect(isBulkCommit(10)).toBe(false);
      expect(isBulkCommit(1)).toBe(false);
    });
  });

  describe("shouldDropCommit", () => {
    it("drops bots, merges, and bulk commits", () => {
      expect(
        shouldDropCommit({
          authorLogin: "dependabot[bot]",
          parentCount: 1,
          fileCount: 5,
        })
      ).toBe(true);

      expect(
        shouldDropCommit({
          authorLogin: "alice",
          parentCount: 2,
          fileCount: 5,
        })
      ).toBe(true);

      expect(
        shouldDropCommit({
          authorLogin: "alice",
          parentCount: 1,
          fileCount: 150,
        })
      ).toBe(true);

      expect(
        shouldDropCommit({
          authorLogin: "alice",
          parentCount: 1,
          fileCount: 12,
        })
      ).toBe(false);
    });
  });
});
