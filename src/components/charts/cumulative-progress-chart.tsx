"use client";

import { useMemo, useState } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { TrendingUp } from "lucide-react";

import {
  ChartTooltipFrame,
  ChartTooltipLabel,
  ChartTooltipValue,
  type ChartTooltipProps,
} from "@/components/charts/chart-tooltip";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { dayKeyOffset, todayDayKey } from "@/lib/statistics";
import {
  formatAxisTick,
  formatDayKey,
  formatNumber,
  niceTicks,
  xAxisTicks,
} from "@/lib/utils";
import type { CumulativePoint } from "@/types/platform";

const ACCENT = "#0071e3";

type RangeId = "7d" | "30d" | "90d" | "all";

const RANGES: Array<{ id: RangeId; label: string; days: number | null }> = [
  { id: "7d", label: "7 days", days: 7 },
  { id: "30d", label: "30 days", days: 30 },
  { id: "90d", label: "90 days", days: 90 },
  { id: "all", label: "All time", days: null },
];

interface ChartPoint {
  /** Milliseconds timestamp (UTC midnight of the day). */
  at: number;
  date: string;
  total: number;
}

function binarySearchStart(series: CumulativePoint[], startKey: string): number {
  let lo = 0;
  let hi = series.length;
  while (lo < hi) {
    const mid = (lo + hi) >>> 1;
    if (series[mid].date < startKey) lo = mid + 1;
    else hi = mid;
  }
  return lo;
}

function CumulativeTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as ChartPoint | undefined;
  if (!point) return null;
  return (
    <ChartTooltipFrame>
      <ChartTooltipLabel>{formatDayKey(point.date)}</ChartTooltipLabel>
      <ChartTooltipValue>
        {formatNumber(point.total)} problems solved
      </ChartTooltipValue>
    </ChartTooltipFrame>
  );
}

/**
 * Cumulative unique problems solved over time, with time-range filters.
 *
 * The series is zero-filled per calendar day server-side (flat segments on
 * days without solves), rendered on a numeric time axis with evenly spaced
 * day/week/month ticks, and a 0-based Y axis with "nice" rounded ticks.
 * Range tabs whose window already covers the entire series are hidden, since
 * they would look identical to "All time".
 */
export function CumulativeProgressChart({ series }: { series: CumulativePoint[] }) {
  const [range, setRange] = useState<RangeId>("30d");
  const today = useMemo(() => todayDayKey(), []);

  // Ranges whose window starts at/before the first data point are redundant.
  const availableRanges = useMemo(() => {
    const first = series[0]?.date;
    if (!first) return RANGES;
    return RANGES.filter(
      (r) => r.days == null || dayKeyOffset(today, r.days - 1) > first,
    );
  }, [series, today]);
  const effectiveRange = availableRanges.some((r) => r.id === range)
    ? range
    : "all";

  const { points, before, gained } = useMemo(() => {
    if (series.length === 0) {
      return { points: [] as CumulativePoint[], before: 0, gained: 0 };
    }
    if (effectiveRange === "all") {
      const total = series[series.length - 1].total;
      return { points: series, before: 0, gained: total };
    }
    const days = RANGES.find((r) => r.id === effectiveRange)?.days ?? 30;
    const startKey = dayKeyOffset(today, days - 1);
    const start = binarySearchStart(series, startKey);
    const before = start > 0 ? series[start - 1].total : 0;
    const endTotal = series[series.length - 1].total;
    return {
      points: series.slice(start),
      before,
      gained: endTotal - before,
    };
  }, [series, effectiveRange, today]);

  const data = useMemo<ChartPoint[]>(
    () =>
      points.map((point) => ({
        at: Date.parse(`${point.date}T00:00:00Z`),
        date: point.date,
        total: point.total,
      })),
    [points],
  );

  const maxTotal = points.length > 0 ? points[points.length - 1].total : 0;
  const yTicks = useMemo(() => niceTicks(Math.max(maxTotal, 1)), [maxTotal]);
  const xTicks = useMemo(
    () => (data.length > 0 ? xAxisTicks(data[0].at, data[data.length - 1].at) : []),
    [data],
  );
  const firstTick = xTicks[0] ?? 0;

  const isEmpty = data.length === 0;
  const spanDays = RANGES.find((r) => r.id === effectiveRange)?.days ?? null;

  return (
    <Card className="flex flex-col gap-5 p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-4 text-steel" aria-hidden />
            Problem solving progress
          </CardTitle>
          <CardDescription className="numeric">
            +{formatNumber(gained)} solved in this range
            {gained === 0 && spanDays !== null
              ? ` (last ${spanDays} days)`
              : ""}
          </CardDescription>
        </CardHeader>

        {/* Segmented range control — hidden when only one range applies. */}
        {availableRanges.length > 1 ? (
          <div
            role="tablist"
            aria-label="Time range"
            className="flex w-fit items-center gap-0.5 rounded-pill bg-studio-mist p-1"
          >
            {availableRanges.map((r) => (
              <button
                key={r.id}
                role="tab"
                aria-selected={effectiveRange === r.id}
                onClick={() => setRange(r.id)}
                className={`rounded-pill px-3 py-1.5 text-[12px] leading-4 tracking-[-0.12px] transition-colors duration-200 ${
                  effectiveRange === r.id
                    ? "bg-gallery-white font-medium text-ink shadow-subtle"
                    : "text-slate hover:text-ink"
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div className="h-72 w-full">
        {isEmpty ? (
          <div className="flex h-full items-center justify-center text-[14px] text-steel">
            No problems were first solved in this period
            {spanDays ? ` (last ${spanDays} days)` : ""}.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient id="cumulativeFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={ACCENT} stopOpacity={0.16} />
                  <stop offset="100%" stopColor={ACCENT} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="#e6e6e8" />
              <XAxis
                dataKey="at"
                type="number"
                scale="time"
                domain={["dataMin", "dataMax"]}
                ticks={xTicks}
                tickFormatter={(value: number) => formatAxisTick(value, firstTick)}
                tick={{ fontSize: 12, fill: "#707070" }}
                tickLine={false}
                axisLine={{ stroke: "#d6d6d6" }}
              />
              <YAxis
                ticks={yTicks}
                domain={[0, yTicks[yTicks.length - 1] ?? 1]}
                allowDecimals={false}
                tick={{ fontSize: 12, fill: "#707070" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<CumulativeTooltip />} cursor={{ stroke: "#d6d6d6" }} />
              <Area
                type="monotone"
                dataKey="total"
                stroke={ACCENT}
                strokeWidth={2}
                fill="url(#cumulativeFill)"
                activeDot={{ r: 4, fill: ACCENT, strokeWidth: 0 }}
                dot={false}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
      {before > 0 && gained > 0 ? (
        <p className="numeric -mt-3 text-[12px] leading-4 text-steel">
          {formatNumber(before)} solved before this range
        </p>
      ) : null}
    </Card>
  );
}
