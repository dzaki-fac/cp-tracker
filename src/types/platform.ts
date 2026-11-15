/**
 * Platform-agnostic domain types.
 *
 * Generic dashboard components consume these shapes only — platform-specific
 * code (Codeforces today, AtCoder/LeetCode/VJudge later) is responsible for
 * producing them in its own `lib/<platform>/` module.
 */

/** Union of supported competitive programming platforms. */
export type PlatformId = "codeforces";

/** Normalized user identity shared by all platform adapters. */
export interface PlatformIdentity {
  platform: PlatformId;
  handle: string;
  avatarUrl: string | null;
  profileUrl: string;
  ratingCurrent: number | null;
  ratingMax: number | null;
  rankCurrent: string | null;
  rankMax: string | null;
  /** Unix seconds, null when the platform does not expose it. */
  memberSince: number | null;
}

/** A single unique problem with the user's first accepted submission. */
export interface SolvedProblem {
  /** Stable unique identifier, e.g. "contestId-index" or a safe fallback. */
  key: string;
  name: string;
  contestId: number | null;
  index: string | null;
  /** Difficulty rating, null when the problem is unrated. */
  rating: number | null;
  tags: string[];
  /** Unix seconds of the user's first accepted submission. */
  firstSolvedAt: number;
  /** Direct URL to the problem, null when it cannot be constructed. */
  url: string | null;
}

/** Count of unique solved problems in one difficulty-rating bucket. */
export interface RatingBucket {
  /** Bucket rating (e.g. 1200), or null for the "unrated" bucket. */
  rating: number | null;
  count: number;
}

/** Unique problems first solved on a single day (zero-filled over a window). */
export interface DailyActivity {
  /** ISO day key in the display timezone, e.g. "2026-11-15". */
  date: string;
  count: number;
}

/**
 * Unique problems first solved in one Monday-start week. `inProgress` marks
 * the current week before its Sunday — comparisons against it must use the
 * equivalent elapsed span of the previous week, not the full week.
 */
export interface WeeklyActivityPoint {
  /** ISO day key of the week's Monday, e.g. "2026-11-09". */
  weekStart: string;
  count: number;
  /** Rated problems behind `avgDifficulty` (0 = no average available). */
  ratedCount: number;
  avgDifficulty: number | null;
  isCurrent: boolean;
  /** True while the week's Sunday has not been reached yet. */
  inProgress: boolean;
}

/** A point of the cumulative unique-solved curve. */
export interface CumulativePoint {
  date: string;
  /** Cumulative total including every solve up to and including this day. */
  total: number;
}

/** A point of the public rating progression curve. */
export interface RatingHistoryPoint {
  /** Unix seconds of the rating update. */
  at: number;
  /** New public rating after the contest. */
  rating: number;
  /** Change from the previous rating (negative for a drop). */
  delta: number;
  /** Contest identifier for deep links, null when unavailable. */
  contestId: number | null;
  contestName: string;
}

/** Complete, normalized payload consumed by the dashboard UI. */
export interface DashboardData {
  platform: PlatformId;
  handle: string;
  profile: PlatformIdentity;

  /** Wall-clock time (ms) the upstream data was fetched. */
  fetchedAt: number;
  /** True when upstream fetches failed and cached data was served instead. */
  stale: boolean;

  submissionsTotal: number;
  acceptedSubmissions: number;
  /** Accepted submissions / total submissions × 100, null with no submissions. */
  acceptanceRate: number | null;
  uniqueSolved: number;
  uniqueAttempted: number;

  // --- Recent activity overview -------------------------------------------

  /** Unique problems first solved in the current Monday-start week. */
  solvedThisWeek: number;
  /** Unique problems first solved in the equivalent elapsed span of last week. */
  lastWeekSameElapsed: number;
  /** Unique problems first solved in the last 30 local calendar days. */
  solvedLast30Days: number;
  /** Unique problems first solved in the 30 days before that window. */
  solvedPrev30Days: number;
  /** Days of the current week (Mon..today) with at least one first-solve. */
  activeDaysThisWeek: number;
  /** Days elapsed in the current week, Monday..today inclusive (1..7). */
  elapsedDaysThisWeek: number;
  /** Average rating of rated problems first solved in the last 30 days. */
  avgDifficultyLast30Days: number | null;
  /** Same average for the preceding 30-day window. */
  avgDifficultyPrev30Days: number | null;

  /** Last 8 Monday-start weeks (zero-filled, current week flagged). */
  weeklyActivity: WeeklyActivityPoint[];

  /** Buckets sorted by rating ascending; unrated problems listed separately. */
  ratingDistribution: RatingBucket[];
  unratedSolved: number;

  /** Last 365 days of activity, zero-filled, oldest first. */
  activity: DailyActivity[];
  activityTotal: number;

  /** Full cumulative solved series (zero-filled daily), oldest first. */
  cumulative: CumulativePoint[];

  ratingHistory: RatingHistoryPoint[];

  solvedProblems: SolvedProblem[];

  // --- All-time statistics --------------------------------------------------

  /** All-time distinct days with at least one first-solve. */
  activeDays: number;
  /** uniqueSolved ÷ activeDays, null with no activity. */
  avgPerActiveDay: number | null;
  /** Consecutive active days ending today (or yesterday if today is empty). */
  currentStreakDays: number;
  /** Longest run of consecutive active days, all-time. */
  longestStreakDays: number;
}
