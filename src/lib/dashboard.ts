/**
 * Dashboard data service (server-side).
 *
 * Combines the Codeforces transport (`lib/codeforces/api.ts`) with parsing and
 * statistics aggregation, and adds a time-based cache on top of the snapshot
 * cache so repeated renders never hammer the upstream API.
 */

import { connection } from "next/server";

import {
  CACHE_TTL_SECONDS,
  DEFAULT_CODEFORCES_HANDLE,
} from "@/lib/config";
import { fetchPlatformSnapshot } from "@/lib/codeforces/api";
import type {
  CodeforcesRatingChange,
  CodeforcesSubmission,
  CodeforcesUserInfo,
} from "@/lib/codeforces/types";
import {
  buildAttemptedProblemKeys,
  buildIdentity,
  buildRatingHistory,
  buildSolvedProblems,
  ACCEPTED_VERDICT,
} from "@/lib/codeforces/parser";
import {
  buildCumulativeSeries,
  buildDailyActivity,
  buildRatingDistribution,
  computeStreaks,
  countSolvedThisMonth,
  countSolvedThisYear,
  dayKeyDiff,
  dayKeyFromUnix,
  todayDayKey,
} from "@/lib/statistics";
import type { DashboardData } from "@/types/platform";

/** How long a freshly-fetched dashboard payload is served without refetching. */
const TTL_MS = Math.max(60, CACHE_TTL_SECONDS) * 1000;

interface CachedPayload {
  data: DashboardData;
  fetchedAt: number;
  stale: boolean;
  expiresAt: number;
}

let cached: CachedPayload | null = null;

/** Aggregate raw API parts into the normalized dashboard payload. */
function aggregate(parts: {
  user: CodeforcesUserInfo;
  ratingHistory: CodeforcesRatingChange[];
  submissions: CodeforcesSubmission[];
}): DashboardData {
  const { user, ratingHistory, submissions } = parts;
  const handle = user.handle;

  const solved = buildSolvedProblems(submissions);
  const attempted = buildAttemptedProblemKeys(submissions);
  const acceptedSubmissions = submissions.filter(
    (s) => s.verdict === ACCEPTED_VERDICT,
  ).length;

  const activity = buildDailyActivity(solved, 365);
  const distribution = buildRatingDistribution(solved);
  const nowMs = Date.now();

  // All-time activity metrics: distinct active days, streaks and averages.
  let activeDays = 0;
  let currentStreakDays = 0;
  let longestStreakDays = 0;
  if (solved.length > 0) {
    const firstKey = dayKeyFromUnix(
      Math.min(...solved.map((problem) => problem.firstSolvedAt)),
    );
    const span = Math.max(1, dayKeyDiff(firstKey, todayDayKey(nowMs)) + 1);
    const allDays = buildDailyActivity(solved, span, nowMs).days;
    activeDays = allDays.reduce((count, day) => (day.count > 0 ? count + 1 : count), 0);
    const streaks = computeStreaks(allDays);
    currentStreakDays = streaks.current;
    longestStreakDays = streaks.longest;
  }
  const avgPerActiveDay =
    activeDays > 0
      ? Math.round((solved.length / activeDays) * 10) / 10
      : null;

  return {
    platform: "codeforces",
    handle,
    profile: buildIdentity(user, `https://codeforces.com/profile/${handle}`),
    fetchedAt: nowMs,
    stale: false,

    submissionsTotal: submissions.length,
    acceptedSubmissions,
    acceptanceRate:
      submissions.length > 0
        ? Math.round((acceptedSubmissions / submissions.length) * 1000) / 10
        : null,
    uniqueSolved: solved.length,
    uniqueAttempted: attempted.size,
    solvedThisMonth: countSolvedThisMonth(solved, nowMs),
    solvedThisYear: countSolvedThisYear(solved, nowMs),

    ratingDistribution: distribution.buckets,
    unratedSolved: distribution.unrated,

    activity: activity.days,
    activityTotal: activity.total,

    cumulative: buildCumulativeSeries(solved, nowMs),

    ratingHistory: buildRatingHistory(ratingHistory),
    solvedProblems: solved,

    activeDays,
    avgPerActiveDay,
    currentStreakDays,
    longestStreakDays,
  };
}

export interface DashboardResult {
  data: DashboardData;
  /** Age of the payload in milliseconds (relative to server time). */
  ageMs: number;
}

/**
 * Get the dashboard payload, serving from cache while it is fresh.
 *
 * The underlying snapshot cache keeps the site usable during upstream outages:
 * failed refetches degrade gracefully to the last good payload with
 * `stale: true`, which the UI surfaces as a freshness notice.
 */
export async function getDashboardData(
  handle: string = DEFAULT_CODEFORCES_HANDLE,
): Promise<DashboardResult> {
  // Timestamps make this per-request data: always resolve at request time,
  // never during the build-time prerender.
  await connection();
  const now = Date.now();

  if (cached && cached.data.handle === handle && now < cached.expiresAt) {
    return { data: cached.data, ageMs: now - cached.fetchedAt };
  }

  const result = await fetchPlatformSnapshot(handle, aggregate);
  cached = {
    data: result.data,
    fetchedAt: result.fetchedAt,
    stale: result.stale,
    expiresAt: now + TTL_MS,
  };

  return { data: cached.data, ageMs: now - cached.fetchedAt };
}

/** Force the next `getDashboardData` call to hit the upstream API. */
export function invalidateDashboardCache(): void {
  cached = null;
}
