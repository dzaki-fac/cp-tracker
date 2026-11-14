import { describe, expect, it } from "vitest";

import { problemKey, buildSolvedProblems } from "@/lib/codeforces/parser";
import type { CodeforcesSubmission } from "@/lib/codeforces/types";

/** Factory for a raw Codeforces submission. */
function submission(overrides: Partial<CodeforcesSubmission> & { id: number }) {
  return {
    contestId: 1234,
    creationTimeSeconds: 1_700_000_000,
    problem: {
      contestId: 1234,
      index: "A",
      name: "Test Problem",
      type: "PROGRAMMING",
      rating: 1200,
      tags: ["greedy"],
    },
    verdict: "OK",
    ...overrides,
  } satisfies CodeforcesSubmission;
}

describe("problemKey", () => {
  it("uses contestId + index as the stable identifier", () => {
    expect(problemKey({ contestId: 1454, index: "D", name: "X" })).toBe(
      "1454-D",
    );
  });

  it("falls back to problemsetName + index when contestId is missing", () => {
    expect(
      problemKey({ problemsetName: "problemset", index: "A", name: "Y" }),
    ).toBe("problemset-A");
  });

  it("falls back to the name when metadata is incomplete", () => {
    expect(problemKey({ name: "Only name" })).toBe("name:Only name");
  });

  it("returns null when nothing usable exists", () => {
    expect(problemKey({} as Parameters<typeof problemKey>[0])).toBeNull();
  });
});

describe("buildSolvedProblems", () => {
  it("counts each problem only once despite multiple accepted submissions", () => {
    const solved = buildSolvedProblems([
      submission({ id: 1, verdict: "OK" }),
      submission({ id: 2, verdict: "OK", creationTimeSeconds: 1_700_000_500 }),
      submission({ id: 3, verdict: "OK", creationTimeSeconds: 1_700_001_000 }),
    ]);
    expect(solved).toHaveLength(1);
  });

  it("ignores non-OK verdicts", () => {
    const solved = buildSolvedProblems([
      submission({ id: 1, verdict: "WRONG_ANSWER" }),
      submission({ id: 2, verdict: "TIME_LIMIT_EXCEEDED" }),
      submission({ id: 3, verdict: null }),
    ]);
    expect(solved).toHaveLength(0);
  });

  it("uses the earliest accepted submission as the first-solve date", () => {
    const solved = buildSolvedProblems([
      submission({ id: 1, creationTimeSeconds: 1_700_000_500 }),
      submission({ id: 2, creationTimeSeconds: 1_700_000_100 }),
      submission({ id: 3, creationTimeSeconds: 1_700_001_000 }),
    ]);
    expect(solved[0].firstSolvedAt).toBe(1_700_000_100);
  });

  it("upgrades missing rating metadata from a later accepted submission", () => {
    const solved = buildSolvedProblems([
      submission({
        id: 1,
        creationTimeSeconds: 1_700_000_100,
        problem: {
          contestId: 1234,
          index: "A",
          name: "Test Problem",
          rating: null,
          tags: [],
        },
      }),
      submission({
        id: 2,
        creationTimeSeconds: 1_700_000_900,
        problem: {
          contestId: 1234,
          index: "A",
          name: "Test Problem",
          rating: 1200,
          tags: ["greedy"],
        },
      }),
    ]);
    expect(solved).toHaveLength(1);
    expect(solved[0].rating).toBe(1200);
    // First-solve date must remain the earliest acceptance.
    expect(solved[0].firstSolvedAt).toBe(1_700_000_100);
  });

  it("treats distinct problems independently", () => {
    const solved = buildSolvedProblems([
      submission({ id: 1, contestId: 1234, verdict: "OK" }),
      submission({
        id: 2,
        contestId: 1234,
        verdict: "OK",
        problem: {
          contestId: 1234,
          index: "B",
          name: "Test Problem B",
          rating: 1500,
          tags: [],
        },
      }),
    ]);
    expect(solved).toHaveLength(2);
  });

  it("sorts results by first solve time ascending", () => {
    const solved = buildSolvedProblems([
      submission({
        id: 1,
        contestId: 1235,
        creationTimeSeconds: 1_700_010_000,
        problem: {
          contestId: 1235,
          index: "A",
          name: "Later",
          rating: 1000,
          tags: [],
        },
      }),
      submission({
        id: 2,
        contestId: 1234,
        creationTimeSeconds: 1_690_000_000,
        problem: {
          contestId: 1234,
          index: "A",
          name: "Earlier",
          rating: 900,
          tags: [],
        },
      }),
    ]);
    expect(solved.map((p) => p.name)).toEqual(["Earlier", "Later"]);
  });
});
