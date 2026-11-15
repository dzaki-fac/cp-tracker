/**
 * Statistics: reusable aggregation utilities over the normalized domain types.
 *
 * All day/month/year bucketing uses `DISPLAY_TIMEZONE` (Asia/Jakarta) so
 * "this week", the calendar and the heatmap are consistent regardless of the
 * server timezone. Weeks start on Monday.
 */

import { DISPLAY_TIMEZONE } from "@/lib/config";
import type {
  RatingBucket,
  SolvedProblem,
  WeeklyActivityPoint,
} from "@/types/platform";

/** en-CA yields ISO-like day keys ("2026-11-15") — used for stable bucketing. */
const dayFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: DISPLAY_TIMEZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

/** Stable day key ("YYYY-MM-DD") for a unix timestamp (seconds). */
export function dayKeyFromUnix(timestampSeconds: number): string {
  return dayFormatter.format(new Date(timestampSeconds * 1000));
}

/** Month key ("YYYY-MM") derived from a day key. */
export function monthKeyFromDayKey(dayKey: string): string {
  return dayKey.slice(0, 7);
}

/** Today's day key in the display timezone. */
export function todayDayKey(nowMs: number = Date.now()): string {
  return dayFormatter.format(new Date(nowMs));
}

/** Day key exactly `days` days before `nowDayKey` (calendar-safe via UTC math). */
export function dayKeyOffset(dayKey: string, minusDays: number): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() - minusDays);
  const yy = String(date.getUTCFullYear()).padStart(4, "0");
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
  const dd = String(date.getUTCDate()).padStart(2, "0");
  return `${yy}-${mm}-${dd}`;
}

/** All day keys in the inclusive range [startDayKey, endDayKey], ascending. */
export function dayKeyRange(startDayKey: string, endDayKey: string): string[] {
  const keys: string[] = [];
  const [ys, ms, ds] = startDayKey.split("-").map(Number);
  const [ye, me, de] = endDayKey.split("-").map(Number);
  const cursor = new Date(Date.UTC(ys, ms - 1, ds));
  const end = new Date(Date.UTC(ye, me - 1, de));
  while (cursor.getTime() <= end.getTime()) {
    const y = cursor.getUTCFullYear();
    const m = String(cursor.getUTCMonth() + 1).padStart(2, "0");
    const d = String(cursor.getUTCDate()).padStart(2, "0");
    keys.push(`${y}-${m}-${d}`);
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return keys;
}

/** Day count from day key `a` to day key `b` (b - a, positive when b later). */
export function dayKeyDiff(a: string, b: string): number {
  const toUtc = (key: string) => {
    const [y, m, d] = key.split("-").map(Number);
    return Date.UTC(y, m - 1, d);
  };
  return Math.round((toUtc(b) - toUtc(a)) / 86_400_000);
}

/**
 * Monday-start week: shift a day key back to the Monday of its week.
 * Sunday (weekday 0) belongs to the week that started six days earlier.
 */
export function weekStartDayKey(dayKey: string): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  const weekday = new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sunday
  return dayKeyOffset(dayKey, weekday === 0 ? 6 : weekday - 1);
}

/**
 * Number of unique problems first solved in the inclusive day-key range
 * [startDayKey, endDayKey] (display timezone).
 */
export function countSolvedInRange(
  solved: SolvedProblem[],
  startDayKey: string,
  endDayKey: string,
): number {
  let count = 0;
  for (const problem of solved) {
    const key = dayKeyFromUnix(problem.firstSolvedAt);
    if (key >= startDayKey && key <= endDayKey) count += 1;
  }
  return count;
}

/**
 * Average Codeforces rating of rated problems in a solved list, null when the
 * list contains no rated problems (unrated problems are excluded, not zeroed).
 */
export function averageDifficulty(solved: SolvedProblem[]): number | null {
  let sum = 0;
  let rated = 0;
  for (const problem of solved) {
    if (problem.rating != null) {
      sum += problem.rating;
      rated += 1;
    }
  }
  return rated > 0 ? Math.round(sum / rated) : null;
}

/**
 * Weekly buckets for the last `weeks` weeks (including the current,
 * possibly incomplete week), oldest first, zero-filled.
 *
 * Each bucket counts unique problems first solved Monday..Sunday of that
 * week, plus the rated-only average difficulty and the number of rated
 * problems behind that average (0 for a "no data" week).
 */
export function buildWeeklyActivity(
  solved: SolvedProblem[],
  weeks: number,
  nowMs: number = Date.now(),
): WeeklyActivityPoint[] {
  const today = todayDayKey(nowMs);
  const currentWeekStart = weekStartDayKey(today);
  const firstStart = dayKeyOffset(currentWeekStart, (weeks - 1) * 7);

  interface Bucket {
    count: number;
    ratingSum: number;
    ratedCount: number;
  }
  const byWeek = new Map<string, Bucket>();
  for (const problem of solved) {
    const start = weekStartDayKey(dayKeyFromUnix(problem.firstSolvedAt));
    if (start < firstStart) continue; // outside the requested window
    const bucket = byWeek.get(start) ?? { count: 0, ratingSum: 0, ratedCount: 0 };
    bucket.count += 1;
    if (problem.rating != null) {
      bucket.ratingSum += problem.rating;
      bucket.ratedCount += 1;
    }
    byWeek.set(start, bucket);
  }

  const points: WeeklyActivityPoint[] = [];
  for (let i = 0; i < weeks; i += 1) {
    // Walk forward from the oldest week (negative offset = add days).
    const weekStart = dayKeyOffset(firstStart, -i * 7);
    const bucket = byWeek.get(weekStart) ?? { count: 0, ratingSum: 0, ratedCount: 0 };
    const isCurrent = weekStart === currentWeekStart;
    // In progress until the week's Sunday (weekStart + 6) has been reached.
    const inProgress = isCurrent && today < dayKeyOffset(weekStart, -6);
    points.push({
      weekStart,
      count: bucket.count,
      ratedCount: bucket.ratedCount,
      avgDifficulty: bucket.ratedCount > 0 ? Math.round(bucket.ratingSum / bucket.ratedCount) : null,
      isCurrent,
      inProgress,
    });
  }
  return points;
}

/**
 * Current and longest solving streaks from a zero-filled, ascending daily
 * activity array (must end at "today" for the current streak to be current).
 * A day counts towards a streak when at least one problem was first solved.
 * If today has no solves yet, the current streak continues from yesterday.
 */
export function computeStreaks(days: { date: string; count: number }[]): {
  current: number;
  longest: number;
} {
  let longest = 0;
  let run = 0;
  for (const day of days) {
    if (day.count > 0) {
      run += 1;
      longest = Math.max(longest, run);
    } else {
      run = 0;
    }
  }

  let current = 0;
  const lastIndex = days.length - 1;
  const startBack = days[lastIndex]?.count ? 0 : 1; // today empty → count from yesterday
  for (let i = lastIndex - startBack; i >= 0; i -= 1) {
    if ((days[i]?.count ?? 0) <= 0) break;
    current += 1;
  }

  return { current, longest };
}

/** Count of unique solved problems per day key. */
export function countSolvedPerDay(
  solved: SolvedProblem[],
): Map<string, number> {
  const counts = new Map<string, number>();
  for (const problem of solved) {
    const key = dayKeyFromUnix(problem.firstSolvedAt);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return counts;
}

/**
 * Activity for the last `windowDays` days (inclusive of today), zero-filled.
 * Returns the day-by-day array plus the in-window total.
 */
export function buildDailyActivity(
  solved: SolvedProblem[],
  windowDays: number,
  nowMs: number = Date.now(),
): { days: { date: string; count: number }[]; total: number } {
  const today = todayDayKey(nowMs);
  const start = dayKeyOffset(today, windowDays - 1);
  const counts = countSolvedPerDay(solved);

  let total = 0;
  const days = dayKeyRange(start, today).map((date) => {
    const count = counts.get(date) ?? 0;
    total += count;
    return { date, count };
  });

  return { days, total };
}

/**
 * Unique solved problems grouped by difficulty rating, sorted ascending.
 * Problems without a rating are excluded and returned separately.
 */
export function buildRatingDistribution(solved: SolvedProblem[]): {
  buckets: { rating: number; count: number }[];
  unrated: number;
} {
  const counts = new Map<number, number>();
  let unrated = 0;

  for (const problem of solved) {
    if (problem.rating == null) {
      unrated += 1;
      continue;
    }
    counts.set(problem.rating, (counts.get(problem.rating) ?? 0) + 1);
  }

  const buckets = [...counts.entries()]
    .map(([rating, count]) => ({ rating, count }))
    .sort((a, b) => a.rating - b.rating);

  return { buckets, unrated };
}

/**
 * Fill missing rating buckets with count 0 so the difficulty chart shows the
 * complete 100-step range between the lowest and highest rated problem
 * (e.g. 800, 900, … 1800) instead of a sparse set of occupied buckets.
 * Unrated problems are never part of the returned buckets.
 */
export function fillRatingBuckets(
  buckets: RatingBucket[],
  step = 100,
): RatingBucket[] {
  const rated = buckets.filter(
    (bucket): bucket is RatingBucket & { rating: number } =>
      bucket.rating != null && bucket.count > 0,
  );
  if (rated.length === 0) return [];

  // Normalize each rating onto the step grid (nearest bucket) so unusual
  // non-multiple ratings merge into their bucket instead of being dropped.
  const counts = new Map<number, number>();
  for (const bucket of rated) {
    const rating = Math.round(bucket.rating / step) * step;
    counts.set(rating, (counts.get(rating) ?? 0) + bucket.count);
  }
  const min = Math.min(...counts.keys());
  const max = Math.max(...counts.keys());

  const filled: RatingBucket[] = [];
  for (let rating = min; rating <= max; rating += step) {
    filled.push({ rating, count: counts.get(rating) ?? 0 });
  }
  return filled;
}

/**
 * Cumulative unique-solved series: one point per calendar day from the first
 * solve through today (in the display timezone), ascending, where `total`
 * includes every solve up to and including that day. Days without solves are
 * zero-filled so time axes show the complete timeline, including flat
 * periods without changes.
 */
export function buildCumulativeSeries(
  solved: SolvedProblem[],
  nowMs: number = Date.now(),
): { date: string; total: number }[] {
  if (solved.length === 0) return [];

  const counts = countSolvedPerDay(solved);
  const firstDay = [...counts.keys()].sort()[0];
  const today = todayDayKey(nowMs);

  let total = 0;
  return dayKeyRange(firstDay, today).map((date) => {
    total += counts.get(date) ?? 0;
    return { date, total };
  });
}

/** Distinct difficulty ratings present in a solved list, ascending. */
export function distinctRatings(solved: SolvedProblem[]): number[] {
  const ratings = new Set<number>();
  for (const problem of solved) {
    if (problem.rating != null) ratings.add(problem.rating);
  }
  return [...ratings].sort((a, b) => a - b);
}

/** Distinct tags with their frequency across a solved list, most common first. */
export function distinctTags(solved: SolvedProblem[]): { tag: string; count: number }[] {
  const counts = new Map<string, number>();
  for (const problem of solved) {
    for (const tag of problem.tags) counts.set(tag, (counts.get(tag) ?? 0) + 1);
  }
  return [...counts.entries()]
    .map(([tag, count]) => ({ tag, count }))
    .sort((a, b) => b.count - a.count || a.tag.localeCompare(b.tag));
}
