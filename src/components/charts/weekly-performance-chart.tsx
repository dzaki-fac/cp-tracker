"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  LabelList,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { CalendarRange } from "lucide-react";

import {
  ChartTooltipFrame,
  ChartTooltipLabel,
  ChartTooltipValue,
  type ChartTooltipProps,
} from "@/components/charts/chart-tooltip";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { dayKeyOffset } from "@/lib/statistics";
import { formatDayKey, formatNumber } from "@/lib/utils";
import type { WeeklyActivityPoint } from "@/types/platform";

const ACCENT = "#0071e3"; // current week
const MUTED = "#c9d6ea"; // completed weeks

interface WeekPoint {
  weekStart: string;
  label: string;
  count: number;
  inProgress: boolean;
}

function WeekTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as WeekPoint | undefined;
  if (!point) return null;
  const end = dayKeyOffset(point.weekStart, -6);
  return (
    <ChartTooltipFrame>
      <ChartTooltipLabel>
        {formatDayKey(point.weekStart)} – {formatDayKey(end)}
      </ChartTooltipLabel>
      <ChartTooltipValue>
        {formatNumber(point.count)} solved
      </ChartTooltipValue>
      {point.inProgress ? (
        <div className="text-steel">Week in progress</div>
      ) : null}
    </ChartTooltipFrame>
  );
}

/** Compact count label above each bar with a non-zero count. */
function CountLabel(props: { x?: number; y?: number; value?: unknown }) {
  const { x, y, value } = props;
  const count = typeof value === "number" ? value : Number(value);
  if (x == null || y == null || !Number.isFinite(count) || count <= 0) return null;
  return (
    <text
      x={x}
      y={y - 5}
      textAnchor="middle"
      fontSize={11}
      fill="#707070"
      className="numeric"
    >
      {formatNumber(count)}
    </text>
  );
}

/** "Nov 9" style short label for a Monday week start. */
function shortWeekLabel(dayKey: string): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${dayKey}T00:00:00Z`));
}

interface WeeklyPerformanceChartProps {
  weeks: WeeklyActivityPoint[];
  currentStreakDays: number;
  /** Last week's count over the same elapsed span (fair baseline). */
  lastWeekSameElapsed: number;
}

/**
 * Weekly Performance — unique problems first solved per week over the last
 * 8 weeks (Monday-start). The current week is highlighted in blue; while it
 * is still in progress the summary compares it with the equivalent elapsed
 * span of last week, never with the full week, so the comparison stays fair.
 */
export function WeeklyPerformanceChart({
  weeks,
  currentStreakDays,
  lastWeekSameElapsed,
}: WeeklyPerformanceChartProps) {
  const data = useMemo<WeekPoint[]>(
    () =>
      weeks.map((week) => ({
        weekStart: week.weekStart,
        label: shortWeekLabel(week.weekStart),
        count: week.count,
        inProgress: week.inProgress,
      })),
    [weeks],
  );

  const current = weeks.find((w) => w.isCurrent);
  const previous = weeks.filter((w) => !w.isCurrent).at(-1);
  const inProgress = current?.inProgress ?? false;

  // Fair baseline: while the current week is incomplete, compare with the
  // same span of last week instead of its full total.
  const lastWeekBaseline = inProgress ? lastWeekSameElapsed : previous?.count ?? 0;
  const wow = current != null ? current.count - lastWeekBaseline : null;

  const maxCount = data.reduce((max, point) => Math.max(max, point.count), 0);
  const yTop = Math.max(1, Math.ceil(maxCount / 2) * 2);

  return (
    <Card className="flex h-full flex-col gap-5 p-7">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CalendarRange className="size-4 text-steel" aria-hidden />
          Weekly performance
        </CardTitle>
        <CardDescription>Unique problems first solved per week</CardDescription>
      </CardHeader>

      {/* Explicit height: percentage-height ResponsiveContainer needs a
          definite parent height (min-h-0 flex-1 collapses to 0 inside an
          auto-height card). */}
      <div className="h-56 w-full py-1">
        {data.every((point) => point.count === 0) ? (
          <div className="flex h-full min-h-40 items-center justify-center rounded-[10px] text-[14px] text-steel">
            No weekly activity yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 16, right: 4, bottom: 0, left: -26 }}
            >
              <CartesianGrid vertical={false} stroke="#e6e6e8" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 10, fill: "#707070" }}
                tickLine={false}
                axisLine={{ stroke: "#d6d6d6" }}
                interval={0}
                angle={-35}
                textAnchor="end"
                height={32}
              />
              <YAxis
                domain={[0, yTop]}
                allowDecimals={false}
                tick={{ fontSize: 12, fill: "#707070" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={<WeekTooltip />}
                cursor={{ fill: "rgba(0, 113, 227, 0.06)" }}
              />
              <Bar
                dataKey="count"
                radius={[6, 6, 0, 0]}
                maxBarSize={36}
                isAnimationActive={false}
              >
                {data.map((point) => (
                  <Cell
                    key={point.weekStart}
                    fill={point.inProgress || point.weekStart === current?.weekStart ? ACCENT : MUTED}
                  />
                ))}
                <LabelList dataKey="count" content={<CountLabel />} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* Compact week-over-week summary */}
      <div className="grid grid-cols-3 gap-3 border-t border-hairline-silver pt-4">
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] leading-4 text-steel">This week</span>
          <span className="numeric text-[15px] leading-[1.2] font-semibold text-ink">
            {formatNumber(current?.count ?? 0)}
          </span>
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] leading-4 text-steel">
            Last week{inProgress ? " · same span" : ""}
          </span>
          <span className="numeric text-[15px] leading-[1.2] font-semibold text-ink">
            {formatNumber(lastWeekBaseline)}
          </span>
          {!inProgress ? null : (
            <span className="numeric text-[11px] leading-4 text-steel">
              full week: {formatNumber(previous?.count ?? 0)}
            </span>
          )}
        </div>
        <div className="flex flex-col gap-0.5">
          <span className="text-[11px] leading-4 text-steel">Change</span>
          <span
            className="numeric text-[15px] leading-[1.2] font-semibold"
            style={{
              color:
                wow == null
                  ? "#86868b"
                  : wow > 0
                    ? "#00a900"
                    : wow < 0
                      ? "#d0342c"
                      : "#86868b",
            }}
          >
            {wow == null
              ? "—"
              : wow === 0
                ? "±0"
                : `${wow > 0 ? "+" : "−"}${formatNumber(Math.abs(wow))}`}
          </span>
        </div>
      </div>

      <p className="text-[12px] leading-4 text-steel">
        {inProgress
          ? `The blue bar is the current week (still in progress) — streak: ${formatNumber(currentStreakDays)} day${currentStreakDays === 1 ? "" : "s"}`
          : `Current streak: ${formatNumber(currentStreakDays)} day${currentStreakDays === 1 ? "" : "s"}`}
      </p>
    </Card>
  );
}
