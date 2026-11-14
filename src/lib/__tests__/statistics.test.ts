import { describe, expect, it } from "vitest";

import {
  buildCumulativeSeries,
  buildDailyActivity,
  buildRatingDistribution,
  countSolvedPerDay,
  countSolvedThisMonth,
  countSolvedThisYear,
  dayKeyFromUnix,
  dayKeyOffset,
  dayKeyRange,
  monthKeyFromDayKey,
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

describe("buildCumulativeSeries", () => {
  it("accumulates totals across days in order", () => {
    const t1 = Date.UTC(2025, 10, 12, 2, 0) / 1000; // 2025-11-12
    const t2 = Date.UTC(2025, 10, 12, 8, 0) / 1000; // same day
    const t3 = Date.UTC(2025, 10, 13, 8, 0) / 1000; // 2025-11-13

    const series = buildCumulativeSeries([
      solved("A", t2),
      solved("B", t1),
      solved("C", t3),
    ]);

    expect(series).toEqual([
      { date: "2025-11-12", total: 2 },
      { date: "2025-11-13", total: 3 },
    ]);
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

describe("period counts", () => {
  // 2026-03-15 10:00 Jakarta.
  const now = Date.UTC(2026, 2, 15, 3, 0);

  it("counts first-solves inside the current month", () => {
    const inMonth = Date.UTC(2026, 2, 5, 10, 0) / 1000; // Jakarta: Mar 5
    const sameMonthLate = Date.UTC(2026, 2, 20, 18, 0) / 1000; // Jakarta: Mar 20 (future)
    const februaryUtc = Date.UTC(2026, 1, 28, 20, 0) / 1000; // Jakarta: Mar 1 03:00 — counts!
    const februaryUtcBeforeMidnight = Date.UTC(2026, 1, 28, 16, 30) / 1000; // Jakarta: Feb 28 23:30 — does not count

    expect(
      countSolvedThisMonth(
        [
          solved("A", inMonth),
          solved("B", sameMonthLate),
          solved("C", februaryUtc),
          solved("D", februaryUtcBeforeMidnight),
        ],
        now,
      ),
    ).toBe(3); // A, B, and C — UTC-February submissions can still land in March
  });

  it("counts first-solves inside the current year", () => {
    const inYear = Date.UTC(2026, 0, 1, 2, 0) / 1000; // Jan 1, 2026
    const prevYearEnd = Date.UTC(2025, 11, 31, 17, 0) / 1000; // Dec 31 17:00 UTC → Jan 1 Jakarta
    const prevYear = Date.UTC(2025, 5, 1, 0, 0) / 1000;

    expect(
      countSolvedThisYear(
        [solved("A", inYear), solved("B", prevYearEnd), solved("C", prevYear)],
        now,
      ),
    ).toBe(2);
  });
});
