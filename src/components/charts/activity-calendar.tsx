"use client";

import { useMemo, useState } from "react";
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

/** Last `window` entries of an ascending activity array. */
function lastWindow(days: DailyActivity[], window: number): DailyActivity[] {
  return days.slice(Math.max(0, days.length - window));
}

interface ActivityCalendarProps {
  /** Ascending zero-filled daily activity (server-side, display timezone). */
  activity: DailyActivity[];
  solvedProblems: SolvedProblem[];
}

/**
 * Prominent interactive calendar of the last 30 days (including today),
 * Monday-first. Each cell shows the number of unique problems first solved
 * that day; clicking a date opens a detail panel listing those problems.
 */
export function ActivityCalendar({
  activity,
  solvedProblems,
}: ActivityCalendarProps) {
  const days = useMemo(() => lastWindow(activity, 30), [activity]);
  const todayKey = useMemo(() => days[days.length - 1]?.date ?? "", [days]);

  // Problems grouped per day key so the detail panel can list them.
  const problemsByDay = useMemo(() => {
    const map = new Map<string, SolvedProblem[]>();
    const windowStart = days[0]?.date;
    if (!windowStart) return map;
    for (const problem of solvedProblems) {
      const key = dayKeyFromUnix(problem.firstSolvedAt);
      if (key < windowStart) continue;
      const list = map.get(key) ?? [];
      list.push(problem);
      map.set(key, list);
    }
    // Newest first inside each day.
    for (const list of map.values()) {
      list.sort((a, b) => b.firstSolvedAt - a.firstSolvedAt);
    }
    return map;
  }, [days, solvedProblems]);

  // Calendar grid: Monday-first columns, leading blanks from the first day.
  const columns = useMemo(() => {
    if (days.length === 0) return [];
    const [y, m, d] = days[0].date.split("-").map(Number);
    const leading = (new Date(Date.UTC(y, m - 1, d)).getUTCDay() + 6) % 7; // Mon=0
    const cells: Array<DailyActivity | null> = new Array(leading).fill(null);
    cells.push(...days);
    while (cells.length % 7 !== 0) cells.push(null);
    const rows: Array<Array<DailyActivity | null>> = [];
    for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7));
    return rows;
  }, [days]);

  const [selected, setSelected] = useState<string>(todayKey);

  const selectedProblems = problemsByDay.get(selected) ?? [];

  // 30-day summary.
  const summary = useMemo(() => {
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
  }, [days]);

  const summaryItems = [
    { label: "Solved in 30 days", value: formatNumber(summary.total) },
    { label: "Active days", value: `${formatNumber(summary.activeDays)} / 30` },
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
          Last 30 days
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
        {columns.flatMap((row, rowIndex) =>
          row.map((day, colIndex) => {
            if (!day) return <div key={`blank-${rowIndex}-${colIndex}`} aria-hidden />;
            const isToday = day.date === todayKey;
            const isSelected = day.date === selected;
            const selectable = true;
            return (
              <button
                key={day.date}
                type="button"
                onClick={() => setSelected(day.date)}
                aria-pressed={isSelected}
                aria-label={`${formatDayKey(day.date)}: ${day.count} solved`}
                className={cn(
                  "flex aspect-square flex-col items-center justify-center gap-0.5 rounded-[10px] outline-none transition-all duration-150",
                  "focus-visible:ring-2 focus-visible:ring-apple-blue/50",
                  selectable && "hover:scale-[1.04] cursor-pointer",
                  isSelected && "ring-2 ring-apple-blue ring-offset-1",
                  isToday && !isSelected && "ring-1 ring-slate/60",
                )}
                style={{
                  background: LEVELS[levelForCount(day.count)],
                }}
              >
                <span
                  className={cn(
                    "numeric text-[10px] leading-none",
                    day.count > 0
                      ? isToday || levelForCount(day.count) >= 3
                        ? "text-ink font-medium"
                        : "text-ink/70"
                      : "text-slate/70",
                  )}
                >
                  {Number(day.date.slice(8))}
                </span>
                <span
                  className={cn(
                    "numeric text-[13px] leading-none font-semibold",
                    day.count > 0 ? "text-ink" : "text-transparent",
                  )}
                >
                  {day.count > 0 ? formatNumber(day.count) : "0"}
                </span>
              </button>
            );
          }),
        )}
      </div>

      {/* Daily detail panel */}
      <div className="rounded-[14px] bg-studio-mist p-4">
        <div className="mb-2 flex items-center justify-between gap-2">
          <span className="text-[13px] leading-[1.2] font-medium text-ink">
            {formatDayKey(selected)}
            {selected === todayKey ? (
              <span className="ml-1.5 text-steel font-normal">· today</span>
            ) : null}
          </span>
          <span className="numeric text-[13px] leading-[1.2] text-slate">
            {formatNumber(selectedProblems.length)} solved
          </span>
        </div>

        {selectedProblems.length === 0 ? (
          <p className="text-[13px] leading-[1.4] text-steel">
            No problems were first solved on this day.
          </p>
        ) : (
          <ul className="flex max-h-56 flex-col gap-1 overflow-y-auto pr-1">
            {selectedProblems.map((problem) => (
              <li key={problem.key}>
                <a
                  href={problem.url ?? undefined}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`Open ${problem.name} on Codeforces`}
                  className="group flex items-center gap-2 rounded-[8px] px-2 py-1.5 transition-colors hover:bg-gallery-white focus-visible:bg-gallery-white focus-visible:outline-none"
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
      </div>

      {/* 30-day summary */}
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
