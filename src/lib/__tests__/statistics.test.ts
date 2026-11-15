import { describe, expect, it } from "vitest";

import {
  averageDifficulty,
  buildCumulativeSeries,
  buildDailyActivity,
  buildRatingDistribution,
  buildWeeklyActivity,
  computeStreaks,
  countSolvedInRange,
  countSolvedPerDay,
  dayKeyDiff,
  dayKeyFromUnix,
  dayKeyOffset,
  dayKeyRange,
  fillRatingBuckets,
  monthKeyFromDayKey,
  weekStartDayKey,
} from "@/lib/statistics";
import type { SolvedProblem } from "@/types/platform";

/** Build a solved problem with a fixed first-acceptance timestamp. */
function solved(
  key: string,
  firstSolvedAt: number,
  rating: number | null = 1200,
): SolvedProblem {
  return {
    key,
    name: `Problem ${key}`,
    contestId: 1,
    index: key,
    rating,
    tags: [],
    firstSolvedAt,
    url: null,
  };
}

/** Day key -> unix seconds at 10:00 UTC on that day (safe in Jakarta). */
function at10Utc(dayKey: string): number {
  const [y, m, d] = dayKey.split("-").map(Number);
  return Date.UTC(y, m - 1, d, 10) / 1000;
}

describe("day bucketing (Asia/Jakarta)", () => {
  it("maps unix timestamps to Jakarta day keys", () => {
    // 2025-11-14 18:30 UTC == 2025-11-15 01:30 Asia/Jakarta.
    const ts = Date.UTC(2025, 10, 14, 18, 30) / 1000;
    expect(dayKeyFromUnix(ts)).toBe("2025-11-15");
  });

  it("does not shift days that end before Jakarta midnight", () => {
    // 2025-11-14 10:00 UTC == 17:00 Asia/Jakarta, same day.
    const ts = Date.UTC(2025, 10, 14, 10, 0) / 1000;
    expect(dayKeyFromUnix(ts)).toBe("2025-11-14");
  });

  it("derives month keys from day keys", () => {
    expect(monthKeyFromDayKey("2025-11-15")).toBe("2025-11");
  });

  it("offsets day keys across month and year boundaries", () => {
    expect(dayKeyOffset("2026-03-01", 1)).toBe("2026-02-28");
    expect(dayKeyOffset("2025-01-01", 1)).toBe("2024-12-31");
    expect(dayKeyOffset("2025-01-02", -2)).toBe("2025-01-04");
  });

  it("builds inclusive day ranges", () => {
    const range = dayKeyRange("2025-12-30", "2026-01-02");
    expect(range).toEqual([
      "2025-12-30",
      "2025-12-31",
      "2026-01-01",
      "2026-01-02",
    ]);
  });

  it("computes day differences across month boundaries", () => {
    expect(dayKeyDiff("2025-01-31", "2025-02-01")).toBe(1);
    expect(dayKeyDiff("2025-02-01", "2025-01-31")).toBe(-1);
    expect(dayKeyDiff("2025-11-10", "2025-11-15")).toBe(5);
  });
});

describe("weekStartDayKey (Monday-start weeks)", () => {
  it("maps every weekday of a week to the same Monday", () => {
    // 2025-11-10 is a Monday; 2025-11-16 is its Sunday.
    expect(weekStartDayKey("2025-11-10")).toBe("2025-11-10");
    expect(weekStartDayKey("2025-11-12")).toBe("2025-11-10");
    expect(weekStartDayKey("2025-11-16")).toBe("2025-11-10");
  });

  it("treats Sunday as the last day of the previous week, not the next", () => {
    // 2025-11-16 (Sunday) → Monday 2025-11-10, not 2025-11-17.
    expect(weekStartDayKey("2025-11-16")).toBe("2025-11-10");
    // Monday itself is unchanged.
    expect(weekStartDayKey("2025-11-17")).toBe("2025-11-17");
  });

  it("wraps backwards across month and year boundaries", () => {
    // 2026-03-01 is a Sunday → its Monday is 2026-02-23.
    expect(weekStartDayKey("2026-03-01")).toBe("2026-02-23");
    // 2025-01-01 is a Wednesday → Monday 2024-12-30.
    expect(weekStartDayKey("2025-01-01")).toBe("2024-12-30");
  });
});

describe("countSolvedInRange / averageDifficulty", () => {
  it("counts unique problems inside an inclusive day-key range", () => {
    const problems = [
      solved("A", at10Utc("2025-11-10")),
      solved("B", at10Utc("2025-11-12")),
      solved("C", at10Utc("2025-11-15")),
    ];
    expect(countSolvedInRange(problems, "2025-11-10", "2025-11-12")).toBe(2);
    expect(countSolvedInRange(problems, "2025-11-11", "2025-11-15")).toBe(2);
    expect(countSolvedInRange(problems, "2025-11-13", "2025-11-14")).toBe(0);
  });

  it("averages only rated problems and rounds to an integer", () => {
    const problems = [
      solved("A", 1, 1000),
      solved("B", 2, 1201),
      solved("C", 3, null),
    ];
    // (1000 + 1201) / 2 = 1100.5 → 1101 (rounded), unrated ignored.
    expect(averageDifficulty(problems)).toBe(1101);
  });

  it("returns null when there are no rated problems", () => {
    expect(averageDifficulty([solved("A", 1, null)])).toBeNull();
    expect(averageDifficulty([])).toBeNull();
  });
});

describe("buildWeeklyActivity (Monday-start buckets)", () => {
  it("zero-fills weeks and sums counts per Monday-start week", () => {
    // "Now": 2025-11-15 (a Saturday), so the current week started Mon 11-10.
    const now = Date.UTC(2025, 10, 15, 3, 0); // 10:00 Jakarta
    const weeks = buildWeeklyActivity(
      [
        solved("A", at10Utc("2025-11-11")),
        solved("B", at10Utc("2025-11-12")),
        solved("C", at10Utc("2025-11-09")), // previous week (Mon 11-03)
      ],
      3,
      now,
    );

    expect(weeks.map((w) => w.weekStart)).toEqual([
      "2025-10-27",
      "2025-11-03",
      "2025-11-10",
    ]);
    expect(weeks.map((w) => w.count)).toEqual([0, 1, 2]);
    expect(weeks[2].isCurrent).toBe(true);
    expect(weeks[1].isCurrent).toBe(false);
  });

  it("tracks the rated-only average difficulty per week", () => {
    const now = Date.UTC(2025, 10, 15, 3, 0);
    const weeks = buildWeeklyActivity(
      [
        solved("A", at10Utc("2025-11-10"), 1000),
        solved("B", at10Utc("2025-11-11"), 1201),
        solved("C", at10Utc("2025-11-12"), null), // unrated: ignored
        solved("D", at10Utc("2025-11-04"), null), // prev week: ratedCount 0
      ],
      2,
      now,
    );

    const current = weeks[1];
    expect(current.avgDifficulty).toBe(1101);
    expect(current.ratedCount).toBe(2);

    const previous = weeks[0];
    expect(previous.count).toBe(1);
    expect(previous.ratedCount).toBe(0);
    expect(previous.avgDifficulty).toBeNull(); // missing data, not zero
  });
});

describe("countSolvedPerDay / activity", () => {
  it("counts unique problems on the day of first acceptance", () => {
    const sameDay = Date.UTC(2025, 10, 14, 2, 0) / 1000; // 2025-11-14 in Jakarta
    const counts = countSolvedPerDay([
      solved("A", sameDay),
      solved("B", sameDay + 3600),
    ]);
    expect(counts.get("2025-11-14")).toBe(2);
  });

  it("zero-fills the activity window and sums the in-window total", () => {
    // Fixed "now": 2025-11-15 10:00 Jakarta.
    const now = Date.UTC(2025, 10, 15, 3, 0);
    const threeDaysAgo = Date.UTC(2025, 10, 12, 3, 0) / 1000; // 2025-11-12
    const beforeWindow = Date.UTC(2025, 10, 10, 3, 0) / 1000; // 2025-11-10

    const { days, total } = buildDailyActivity(
      [solved("A", threeDaysAgo), solved("B", beforeWindow)],
      5,
      now,
    );

    expect(days).toHaveLength(5);
    expect(days.map((d) => d.date)).toEqual([
      "2025-11-11",
      "2025-11-12",
      "2025-11-13",
      "2025-11-14",
      "2025-11-15",
    ]);
    // Only the solve inside the window counts towards the heatmap total.
    expect(total).toBe(1);
    expect(days[1]).toEqual({ date: "2025-11-12", count: 1 });
  });
});

describe("computeStreaks", () => {
  const days = (counts: number[]) =>
    counts.map((count, i) => ({
      date: `2025-11-${String(1 + i).padStart(2, "0")}`,
      count,
    }));

  it("counts the current streak ending on the last active day", () => {
    // Last day active → current = trailing run.
    expect(computeStreaks(days([1, 0, 2, 1, 3]))).toEqual({
      current: 3,
      longest: 3,
    });
  });

  it("keeps the current streak alive when today has no solves yet", () => {
    // Today (last entry) empty → streak continues from yesterday.
    expect(computeStreaks(days([2, 1, 0]))).toEqual({
      current: 2,
      longest: 2,
    });
  });

  it("reports the longest streak even when it is in the past", () => {
    expect(computeStreaks(days([1, 1, 1, 1, 0, 0]))).toEqual({
      current: 0, // today + yesterday both empty
      longest: 4,
    });
  });

  it("returns zeros for an empty window", () => {
    expect(computeStreaks([])).toEqual({ current: 0, longest: 0 });
  });
});

describe("fillRatingBuckets", () => {
  it("fills empty 100-step buckets between min and max with count 0", () => {
    const filled = fillRatingBuckets([
      { rating: 800, count: 2 },
      { rating: 1200, count: 5 },
    ]);
    expect(filled).toEqual([
      { rating: 800, count: 2 },
      { rating: 900, count: 0 },
      { rating: 1000, count: 0 },
      { rating: 1100, count: 0 },
      { rating: 1200, count: 5 },
    ]);
  });

  it("merges unusual non-multiple ratings into the nearest bucket", () => {
    const filled = fillRatingBuckets([
      { rating: 1197, count: 1 },
      { rating: 1603, count: 2 },
    ]);
    expect(filled[0]).toEqual({ rating: 1200, count: 1 });
    expect(filled[filled.length - 1]).toEqual({ rating: 1600, count: 2 });
    expect(filled.map((b) => b.rating)).toEqual([
      1200, 1300, 1400, 1500, 1600,
    ]);
  });

  it("returns an empty array when there are no rated problems", () => {
    expect(fillRatingBuckets([{ rating: null, count: 3 }])).toEqual([]);
    expect(fillRatingBuckets([])).toEqual([]);
  });
});

describe("buildCumulativeSeries", () => {
  it("accumulates totals across days in order", () => {
    const t1 = Date.UTC(2025, 10, 12, 2, 0) / 1000; // 2025-11-12
    const t2 = Date.UTC(2025, 10, 12, 8, 0) / 1000; // same day
    const t3 = Date.UTC(2025, 10, 13, 8, 0) / 1000; // 2025-11-13
    const now = Date.UTC(2025, 10, 13, 12, 0); // today: 2025-11-13

    const series = buildCumulativeSeries(
      [solved("A", t2), solved("B", t1), solved("C", t3)],
      now,
    );

    expect(series).toEqual([
      { date: "2025-11-12", total: 2 },
      { date: "2025-11-13", total: 3 },
    ]);
  });

  it("zero-fills days without solves so the time axis is complete", () => {
    const t1 = Date.UTC(2025, 10, 12, 2, 0) / 1000; // 2025-11-12
    const t2 = Date.UTC(2025, 10, 14, 2, 0) / 1000; // 2025-11-14
    const now = Date.UTC(2025, 10, 14, 12, 0); // today: 2025-11-14

    const series = buildCumulativeSeries([solved("A", t1), solved("B", t2)], now);

    expect(series).toEqual([
      { date: "2025-11-12", total: 1 },
      { date: "2025-11-13", total: 1 }, // no change — flat day
      { date: "2025-11-14", total: 2 },
    ]);
  });

  it("returns an empty series when nothing is solved", () => {
    expect(buildCumulativeSeries([], Date.UTC(2025, 10, 14, 12, 0))).toEqual([]);
  });
});

describe("buildRatingDistribution", () => {
  it("groups by rating and reports unrated problems separately", () => {
    const { buckets, unrated } = buildRatingDistribution([
      solved("A", 1, 800),
      solved("B", 2, 800),
      solved("C", 3, 900),
      solved("D", 4, null),
      solved("E", 5, null),
      solved("F", 6, null),
    ]);

    expect(buckets).toEqual([
      { rating: 800, count: 2 },
      { rating: 900, count: 1 },
    ]);
    expect(unrated).toBe(3);
  });

  it("sorts buckets ascending by rating", () => {
    const { buckets } = buildRatingDistribution([
      solved("A", 1, 1400),
      solved("B", 2, 800),
      solved("C", 3, 1100),
    ]);
    expect(buckets.map((b) => b.rating)).toEqual([800, 1100, 1400]);
  });
});
