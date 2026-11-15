"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Flame } from "lucide-react";

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { computeStreaks } from "@/lib/statistics";
import { formatDayKey, formatNumber } from "@/lib/utils";
import type { DailyActivity } from "@/types/platform";

const CELL = 11; // px
const GAP = 3; // px
const STEP = CELL + GAP;

/**
 * 5-level intensity scale. Thresholds: 0, 1, 2–3, 4–6, 7+ solved per day.
 * Level 1 is clearly darker than the empty cell so a single solve stands out.
 */
const LEVELS = ["#e6e6e8", "#a9d3f5", "#7fb8ec", "#3d95e0", "#0071e3"];

function levelForCount(count: number): number {
  if (count >= 7) return 4;
  if (count >= 4) return 3;
  if (count >= 2) return 2;
  if (count >= 1) return 1;
  return 0;
}

interface WeekColumn {
  /** Null = leading/trailing padding cell. */
  cells: Array<DailyActivity | null>;
  monthLabel?: string;
}

interface TooltipState {
  x: number;
  y: number;
  date: string;
  count: number;
}

/**
 * GitHub-style activity heatmap of unique problems first solved each day,
 * covering the last 365 days. Day bucketing happens server-side in
 * Asia/Jakarta (see lib/statistics.ts); this component only renders.
 *
 * The grid is horizontally scrollable when it does not fit and auto-scrolls
 * to the right (most recent days) on mount. Every day cell is focusable and
 * shows its tooltip on hover or keyboard focus.
 */
export function ActivityHeatmap({ days }: { days: DailyActivity[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);

  const streaks = useMemo(() => computeStreaks(days), [days]);

  // Start with the most recent days visible when the grid overflows.
  useEffect(() => {
    const container = containerRef.current;
    if (container) container.scrollLeft = container.scrollWidth;
  }, [days.length]);

  const columns = useMemo<WeekColumn[]>(() => {
    if (days.length === 0) return [];
    const weekday = (dayKey: string): number => {
      const [y, m, d] = dayKey.split("-").map(Number);
      return new Date(Date.UTC(y, m - 1, d)).getUTCDay(); // 0 = Sunday
    };
    const leading = weekday(days[0].date);

    const cols: WeekColumn[] = [];
    let current: Array<DailyActivity | null> = [];
    if (leading > 0) current = new Array(leading).fill(null);

    let lastMonth = "";
    let firstLabelDone = false;
    for (const day of days) {
      current.push(day);
      if (current.length === 7) {
        const firstCell = current.find(Boolean) as DailyActivity;
        const month = firstCell.date.slice(5, 7);
        if (month !== lastMonth) {
          const year = firstCell.date.slice(0, 4);
          const monthName = new Intl.DateTimeFormat("en-US", {
            month: "short",
            timeZone: "UTC",
          }).format(new Date(`${firstCell.date}T00:00:00Z`));
          // 11px+ labels; January and the first label carry the year.
          cols.push({
            cells: current,
            monthLabel:
              !firstLabelDone || month === "01"
                ? `${monthName} ${year}`
                : monthName,
          });
          firstLabelDone = true;
        } else {
          cols.push({ cells: current });
        }
        lastMonth = month;
        current = [];
      }
    }
    if (current.length > 0) {
      while (current.length < 7) current.push(null);
      cols.push({ cells: current });
    }
    return cols;
  }, [days]);

  const showTooltip = (cell: HTMLElement, day: DailyActivity) => {
    const container = containerRef.current;
    if (!container) return;
    const containerRect = container.getBoundingClientRect();
    const cellRect = cell.getBoundingClientRect();
    setTooltip({
      x: cellRect.left - containerRect.left + cellRect.width / 2,
      y: cellRect.top - containerRect.top,
      date: day.date,
      count: day.count,
    });
  };

  const tooltipLeft = tooltip
    ? Math.min(
        Math.max(tooltip.x, 44),
        Math.max(44, columns.length * STEP + 30 - 44),
      )
    : 0;

  return (
    <Card className="flex flex-col gap-5 p-7">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Flame className="size-4 text-steel" aria-hidden />
          Activity
        </CardTitle>
        <CardDescription className="numeric">
          Current streak: {formatNumber(streaks.current)} day
          {streaks.current === 1 ? "" : "s"} · Longest:{" "}
          {formatNumber(streaks.longest)} day{streaks.longest === 1 ? "" : "s"}
        </CardDescription>
      </CardHeader>

      <div ref={containerRef} className="relative overflow-x-auto pb-1">
        {columns.length === 0 ? (
          <div className="flex h-28 items-center justify-center text-[14px] text-steel">
            No activity yet.
          </div>
        ) : (
          <div
            className="relative mx-auto w-max"
            style={{ paddingLeft: 30, paddingTop: 16 }}
          >
            {/* Month labels */}
            <div className="relative" style={{ height: 14 }}>
              {columns.map((col, i) =>
                col.monthLabel ? (
                  <span
                    key={`m-${i}`}
                    className="absolute top-0 whitespace-nowrap text-[11px] leading-[14px] text-steel"
                    style={{ left: i * STEP }}
                  >
                    {col.monthLabel}
                  </span>
                ) : null,
              )}
            </div>

            <div className="flex gap-[3px]">
              {/* Weekday labels */}
              <div
                className="absolute flex flex-col gap-[3px]"
                style={{ left: 0, top: 30 }}
              >
                {["", "Mon", "", "Wed", "", "Fri", ""].map((label, i) => (
                  <span
                    key={i}
                    className="text-[10px] leading-[11px] text-steel"
                    style={{ height: CELL }}
                  >
                    {label}
                  </span>
                ))}
              </div>

              {columns.map((col, i) => (
                <div key={i} className="flex flex-col gap-[3px]">
                  {col.cells.map((day, j) =>
                    day ? (
                      <div
                        key={day.date}
                        className="rounded-[3px] outline-none transition-transform duration-100 focus-visible:ring-2 focus-visible:ring-apple-blue/60"
                        style={{
                          width: CELL,
                          height: CELL,
                          background: LEVELS[levelForCount(day.count)],
                        }}
                        role="img"
                        tabIndex={0}
                        aria-label={`${formatDayKey(day.date)}: ${day.count} solved`}
                        onMouseEnter={(e) => showTooltip(e.currentTarget, day)}
                        onMouseLeave={() => setTooltip(null)}
                        onFocus={(e) => showTooltip(e.currentTarget, day)}
                        onBlur={() => setTooltip(null)}
                      />
                    ) : (
                      <div
                        key={`pad-${i}-${j}`}
                        style={{ width: CELL, height: CELL }}
                      />
                    ),
                  )}
                </div>
              ))}
            </div>

            {/* Hover / focus tooltip */}
            {tooltip ? (
              <div
                className="pointer-events-none absolute z-10 -translate-x-1/2 whitespace-nowrap"
                style={{
                  left: tooltipLeft,
                  top: tooltip.y - 34,
                }}
              >
                <div className="rounded-[8px] bg-ink px-2.5 py-1.5 text-[12px] leading-4 tracking-[-0.12px] text-white shadow-[0_4px_16px_rgb(0_0_0/0.24)]">
                  <span className="numeric">{formatDayKey(tooltip.date)}</span>
                  <span className="text-white/60"> · </span>
                  {tooltip.count === 0
                    ? "No solves"
                    : `${formatNumber(tooltip.count)} solved`}
                </div>
              </div>
            ) : null}
          </div>
        )}
      </div>

      {/* Level legend */}
      <div className="flex items-center justify-end gap-1.5 text-[10px] text-steel">
        Less
        {LEVELS.map((color) => (
          <span
            key={color}
            className="inline-block size-[11px] rounded-[3px]"
            style={{ background: color }}
          />
        ))}
        More
      </div>
    </Card>
  );
}
