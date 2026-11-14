/**
 * Parser: turns raw Codeforces API payloads into normalized, platform-agnostic
 * domain types. All counting rules live here / in `lib/statistics.ts`.
 */

import type { PlatformIdentity, SolvedProblem } from "@/types/platform";
import type {
  CodeforcesProblem,
  CodeforcesRatingChange,
  CodeforcesSubmission,
  CodeforcesUserInfo,
} from "@/lib/codeforces/types";

/** Verdict that counts a submission as solved, per the Codeforces API. */
export const ACCEPTED_VERDICT = "OK";

/** Build a stable unique identifier for a problem. */
export function problemKey(problem: CodeforcesProblem): string | null {
  // Preferred identity: contestId + index (e.g. "1454-D").
  if (problem.contestId != null && problem.index) {
    return `${problem.contestId}-${problem.index}`;
  }
  // Problemset-only records still expose a problemsetName + index.
  if (problem.problemsetName && problem.index) {
    return `${problem.problemsetName}-${problem.index}`;
  }
  // Last resort: the problem name itself (metadata is incomplete).
  if (problem.name) return `name:${problem.name}`;
  return null;
}

/** Build a deep link to a problem, or null when it cannot be constructed. */
export function problemUrl(problem: CodeforcesProblem): string | null {
  if (problem.contestId == null || !problem.index) return null;
  // contestIds >= 100000 are gym problems served under /gym/.
  const base =
    problem.contestId >= 100000
      ? `https://codeforces.com/gym/${problem.contestId}`
      : `https://codeforces.com/contest/${problem.contestId}`;
  return `${base}/problem/${problem.index}`;
}

/**
 * Deduplicate submissions into unique solved problems.
 *
 * - Only `verdict === "OK"` submissions count as solved.
 * - Each problem is counted once; `firstSolvedAt` is the earliest accepted
 *   submission timestamp for that problem.
 * - Problem metadata is merged across accepted submissions, preferring the
 *   record with the richest data (a rating) in case older records are partial.
 */
export function buildSolvedProblems(
  submissions: CodeforcesSubmission[],
): SolvedProblem[] {
  interface Entry {
    firstSolvedAt: number;
    meta: CodeforcesProblem;
    metaComplete: boolean;
  }

  const byKey = new Map<string, Entry>();

  for (const submission of submissions) {
    if (submission?.verdict !== ACCEPTED_VERDICT) continue;
    if (typeof submission.creationTimeSeconds !== "number") continue;
    const problem = submission.problem;
    if (!problem?.name) continue;

    const key = problemKey(problem);
    if (!key) continue;

    const existing = byKey.get(key);
    const complete = problem.rating != null;

    if (!existing) {
      byKey.set(key, {
        firstSolvedAt: submission.creationTimeSeconds,
        meta: problem,
        metaComplete: complete,
      });
      continue;
    }

    if (submission.creationTimeSeconds < existing.firstSolvedAt) {
      existing.firstSolvedAt = submission.creationTimeSeconds;
    }
    // Upgrade partial metadata (e.g. rating assigned later) but never downgrade.
    if (complete && !existing.metaComplete) {
      existing.meta = problem;
      existing.metaComplete = true;
    }
  }

  const solved: SolvedProblem[] = [];
  for (const [key, entry] of byKey) {
    solved.push({
      key,
      name: entry.meta.name,
      contestId: entry.meta.contestId ?? null,
      index: entry.meta.index ?? null,
      rating: entry.meta.rating ?? null,
      tags: Array.isArray(entry.meta.tags) ? [...entry.meta.tags] : [],
      firstSolvedAt: entry.firstSolvedAt,
      url: problemUrl(entry.meta),
    });
  }

  // Sort by first solve time ascending — the natural timeline order.
  solved.sort((a, b) => a.firstSolvedAt - b.firstSolvedAt);
  return solved;
}

/** Unique problems the user submitted to at least once (any verdict). */
export function buildAttemptedProblemKeys(
  submissions: CodeforcesSubmission[],
): Set<string> {
  const keys = new Set<string>();
  for (const submission of submissions) {
    const problem = submission?.problem;
    if (!problem?.name) continue;
    const key = problemKey(problem);
    if (key) keys.add(key);
  }
  return keys;
}

/** Map the raw Codeforces profile into the normalized identity shape. */
export function buildIdentity(
  user: CodeforcesUserInfo,
  profileUrl: string,
): PlatformIdentity {
  return {
    platform: "codeforces",
    handle: user.handle,
    avatarUrl: user.titlePhoto ?? user.avatar ?? null,
    profileUrl,
    ratingCurrent: user.rating ?? null,
    ratingMax: user.maxRating ?? null,
    rankCurrent: user.rank ?? null,
    rankMax: user.maxRank ?? null,
    memberSince: user.registrationTimeSeconds ?? null,
  };
}

/** Map raw rating changes into the normalized progression curve. */
export function buildRatingHistory(
  changes: CodeforcesRatingChange[],
): { at: number; rating: number; contestName: string }[] {
  return changes
    .filter((c) => typeof c?.ratingUpdateTimeSeconds === "number")
    .map((c) => ({
      at: c.ratingUpdateTimeSeconds,
      rating: c.newRating,
      contestName: c.contestName,
    }))
    .sort((a, b) => a.at - b.at);
}
