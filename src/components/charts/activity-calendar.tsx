"use client";

import { useMemo } from "react";
import * as Popover from "@radix-ui/react-popover";
import { CalendarRange, ExternalLink } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getRankColor } from "@/lib/cf-rank";
import { computeStreaks, dayKeyFromUnix } from "@/lib/statistics";
import { cn, formatDayKey, formatNumber } from "@/lib/utils";
import type { DailyActivity, SolvedProblem } from "@/types/platform";

const WEEKDAY_HEADERS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"] as const;

/** Subtle green intensity scale: 0 is neutral gray, higher is darker green. */
const LEVELS = ["#f0f0f2", "#d7ecdb", "#a9d9b5", "#67bd80", "#00a900"] as const;

function levelForCount(count: number): number {
  if (count >= 7) return 4;
  if (count >= 4) return 3;
  if (count >= 2) return 2;
  if (count >= 1) return 1;
  return 0;
}

/** "November 2026" style title for the day key's month, UTC-safe. */
function monthTitle(dayKey: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${dayKey}T00:00:00Z`));
}

interface ActivityCalendarProps {
  /** Ascending zero-filled daily activity (server-side, display timezone). */
  activity: DailyActivity[];
  solvedProblems: SolvedProblem[];
}

/**
 * Monthly activity calendar covering the current month, starting at the 1st
 * (day keys are computed server-side in the display timezone; the last entry
 * of `activity` is "today", so no client clock is needed). Each past/today
 * cell opens a popover listing the unique problems first solved that day;
 * future days of the month render as quiet, non-interactive placeholders.
 */
export function ActivityCalendar({
  activity,
  solvedProblems,
}: ActivityCalendarProps) {
  // "Today" comes from the server-built activity array — hydration-safe.
  const todayKey = activity[activity.length - 1]?.date ?? "";
  const month = todayKey.slice(0, 7); // "YYYY-MM"

  // Counts for every day of the displayed month, straight from activity.
  const byDay = useMemo(() => {
    const map = new Map<string, DailyActivity>();
    for (const day of activity) {
      if (day.date.startsWith(month)) map.set(day.date, day);
    }
    return map;
  }, [activity, month]);

  // Problems grouped per day key for the popovers.
  const problemsByDay = useMemo(() => {
    const map = new Map<string, SolvedProblem[]>();
    for (const problem of solvedProblems) {
      const key = dayKeyFromUnix(problem.firstSolvedAt);
      if (!key.startsWith(month)) continue;
      const list = map.get(key) ?? [];
      list.push(problem);
      map.set(key, list);
    }
    // Newest first inside each day.
    for (const list of map.values()) {
      list.sort((a, b) => b.firstSolvedAt - a.firstSolvedAt);
    }
    return map;
  }, [solvedProblems, month]);

  // Calendar rows: leading blanks from the 1st's weekday (Monday-first),
  // trailing cells up to a full week row for a rectangular grid.
  const rows = useMemo(() => {
    const first = `${month}-01`;
    const [y, m, d] = first.split("-").map(Number);
    const leading = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7; // Mon=0
    const lastDayNumber = Number(
      new Date(Date.UTC(y, m, 0)).getUTCDate(), // last day of the month
    );
    const cells: Array<string | null> = new Array(leading).fill(null);
    for (let day = 1; day <= lastDayNumber; day += 1) {
      cells.push(`${month}-${String(day).padStart(2, "0")}`);
    }
    while (cells.length % 7 !== 0) cells.push(null);
    const out: Array<Array<string | null>> = [];
    for (let i = 0; i < cells.length; i += 7) out.push(cells.slice(i, i + 7));
    return out;
  }, [month]);

  // Month-to-date summary (today inclusive).
  const summary = useMemo(() => {
    const days = [...byDay.values()].filter((day) => day.date <= todayKey);
    const total = days.reduce((sum, day) => sum + day.count, 0);
    const activeDays = days.reduce(
      (count, day) => (day.count > 0 ? count + 1 : count),
      0,
    );
    const bestStreak = computeStreaks(days).longest;
    return {
      total,
      activeDays,
      bestStreak,
      avgPerActiveDay: activeDays > 0 ? Math.round((total / activeDays) * 10) / 10 : 0,
    };
  }, [byDay, todayKey]);

  const summaryItems = [
    { label: "Solved this month", value: formatNumber(summary.total) },
    { label: "Active days", value: `${formatNumber(summary.activeDays)} / ${formatNumber(Number(todayKey.slice(8)))}` },
    {
      label: "Avg per active day",
      value: summary.avgPerActiveDay > 0 ? summary.avgPerActiveDay.toFixed(1) : "—",
    },
    {
      label: "Best streak",
      value: `${formatNumber(summary.bestStreak)} day${summary.bestStreak === 1 ? "" : "s"}`,
    },
  ];

  return (
    <Card className="flex h-full flex-col gap-5 p-7">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarRange className="size-4 text-steel" aria-hidden />
          {todayKey ? monthTitle(todayKey) : "Activity"}
        </CardTitle>
        <CardDescription>
          Unique problems first solved per day — click a date for details
        </CardDescription>
      </CardHeader>

      {/* Weekday headers, Monday-first */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {WEEKDAY_HEADERS.map((label) => (
          <div
            key={label}
            className="text-center text-[11px] leading-4 font-medium text-steel"
          >
            {label}
          </div>
        ))}
        {rows.flatMap((row, rowIndex) =>
          row.map((date, colIndex) => {
            if (!date) return <div key={`blank-${rowIndex}-${colIndex}`} aria-hidden />;
            const day = byDay.get(date);
            const count = day?.count ?? 0;
            const isToday = date === todayKey;
            const isFuture = date > todayKey;
            const dayProblems = problemsByDay.get(date) ?? [];

            if (isFuture) {
              return (
                <div
                  key={date}
                  aria-hidden
                  className="flex aspect-square flex-col items-center justify-center rounded-[10px] bg-transparent"
                >
                  <span className="numeric text-[10px] leading-none text-slate/40">
                    {Number(date.slice(8))}
                  </span>
                </div>
              );
            }

            return (
              <Popover.Root key={date}>
                <Popover.Trigger asChild>
                  <button
                    type="button"
                    aria-label={`${formatDayKey(date)}: ${count} solved`}
                    className={cn(
                      "flex aspect-square cursor-pointer flex-col items-center justify-center gap-0.5 rounded-[10px] outline-none transition-all duration-150",
                      "hover:scale-[1.04] focus-visible:ring-2 focus-visible:ring-apple-blue/50",
                      "data-[state=open]:ring-2 data-[state=open]:ring-apple-blue data-[state=open]:ring-offset-1",
                      isToday && "ring-1 ring-slate/60",
                    )}
                    style={{
                      background: LEVELS[levelForCount(count)],
                    }}
                  >
                    <span
                      className={cn(
                        "numeric text-[10px] leading-none",
                        count > 0
                          ? isToday || levelForCount(count) >= 3
                            ? "text-ink font-medium"
                            : "text-ink/70"
                          : "text-slate/70",
                      )}
                    >
                      {Number(date.slice(8))}
                    </span>
                    <span
                      className={cn(
                        "numeric text-[13px] leading-none font-semibold",
                        count > 0 ? "text-ink" : "text-transparent",
                      )}
                    >
                      {count > 0 ? formatNumber(count) : "0"}
                    </span>
                  </button>
                </Popover.Trigger>
                <Popover.Portal>
                  <Popover.Content
                    side="top"
                    align="center"
                    sideOffset={8}
                    collisionPadding={12}
                    className="z-50 w-80 max-w-[calc(100vw-2rem)] rounded-[14px] border border-hairline-silver bg-gallery-white p-4 shadow-[0_12px_40px_rgb(0_0_0/0.16)] focus:outline-none"
                  >
                    <div className="mb-2 flex items-center justify-between gap-2">
                      <span className="text-[13px] leading-[1.2] font-medium text-ink">
                        {formatDayKey(date)}
                        {isToday ? (
                          <span className="ml-1.5 font-normal text-steel">· today</span>
                        ) : null}
                      </span>
                      <span className="numeric text-[13px] leading-[1.2] text-slate">
                        {formatNumber(dayProblems.length)} solved
                      </span>
                    </div>

                    {dayProblems.length === 0 ? (
                      <p className="text-[13px] leading-[1.4] text-steel">
                        No problems were first solved on this day.
                      </p>
                    ) : (
                      <ul className="flex max-h-64 flex-col gap-1 overflow-y-auto pr-1">
                        {dayProblems.map((problem) => (
                          <li key={problem.key}>
                            <a
                              href={problem.url ?? undefined}
                              target="_blank"
                              rel="noopener noreferrer"
                              aria-label={`Open ${problem.name} on Codeforces`}
                              className="group flex items-center gap-2 rounded-[8px] px-2 py-1.5 transition-colors hover:bg-studio-mist focus-visible:bg-studio-mist focus-visible:outline-none"
                            >
                              <ExternalLink
                                className="size-3 shrink-0 text-steel opacity-0 transition-opacity group-hover:opacity-100"
                                aria-hidden
                              />
                              <span className="min-w-0 flex-1 truncate text-[13px] leading-[1.3] text-ink group-hover:text-apple-blue">
                                {problem.name}
                              </span>
                              <span className="hidden shrink-0 sm:block">
                                {problem.tags.slice(0, 2).map((tag) => (
                                  <Badge
                                    key={tag}
                                    variant="default"
                                    className="mr-1 max-w-24 truncate last:mr-0"
                                  >
                                    {tag}
                                  </Badge>
                                ))}
                              </span>
                              {problem.rating != null ? (
                                <span
                                  className="numeric shrink-0 text-[12px] font-medium"
                                  style={{ color: getRankColor(problem.rating) }}
                                >
                                  {formatNumber(problem.rating)}
                                </span>
                              ) : (
                                <span className="shrink-0 text-[12px] text-steel">—</span>
                              )}
                            </a>
                          </li>
                        ))}
                      </ul>
                    )}
                    <Popover.Arrow
                      className="fill-gallery-white"
                      width={12}
                      height={6}
                    />
                  </Popover.Content>
                </Popover.Portal>
              </Popover.Root>
            );
          }),
        )}
      </div>

      {/* Month-to-date summary */}
      <div className="mt-auto grid grid-cols-2 gap-x-4 gap-y-3 border-t border-hairline-silver pt-4 sm:grid-cols-4">
        {summaryItems.map((item) => (
          <div key={item.label} className="flex flex-col gap-0.5">
            <span className="text-[11px] leading-4 text-steel">{item.label}</span>
            <span className="numeric text-[15px] leading-[1.2] font-semibold text-ink">
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </Card>
  );
}
