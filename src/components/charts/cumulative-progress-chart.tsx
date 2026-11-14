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
import { formatNumber, formatDayKey } from "@/lib/utils";
import { dayKeyOffset, todayDayKey } from "@/lib/statistics";
import type { CumulativePoint } from "@/types/platform";

const ACCENT = "#0071e3";

type RangeId = "7d" | "30d" | "90d" | "1y" | "all";

const RANGES: Array<{ id: RangeId; label: string; days: number | null }> = [
  { id: "7d", label: "7 days", days: 7 },
  { id: "30d", label: "30 days", days: 30 },
  { id: "90d", label: "90 days", days: 90 },
  { id: "1y", label: "1 year", days: 365 },
  { id: "all", label: "All time", days: null },
];

interface SlicedSeries {
  points: CumulativePoint[];
  /** Cumulative total solved strictly before the range start. */
  before: number;
  gained: number;
}

function binarySearchStart(
  series: CumulativePoint[],
  startKey: string,
): number {
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
  const point = payload[0]?.payload as CumulativePoint | undefined;
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
 * Historical totals before the selected range are preserved as the baseline.
 */
export function CumulativeProgressChart({ series }: { series: CumulativePoint[] }) {
  const [range, setRange] = useState<RangeId>("30d");

  const today = useMemo(() => todayDayKey(), []);

  const sliced = useMemo<SlicedSeries>(() => {
    if (series.length === 0) {
      return { points: [], before: 0, gained: 0 };
    }
    if (range === "all") {
      const total = series[series.length - 1].total;
      return { points: series, before: 0, gained: total };
    }
    const days = RANGES.find((r) => r.id === range)?.days ?? 30;
    const startKey = dayKeyOffset(today, days - 1);
    const start = binarySearchStart(series, startKey);
    const before = start > 0 ? series[start - 1].total : 0;
    const endTotal = series[series.length - 1].total;
    return {
      points: series.slice(start),
      before,
      gained: endTotal - before,
    };
  }, [series, range, today]);

  const { points, before, gained } = sliced;
  const spanDays = RANGES.find((r) => r.id === range)?.days ?? null;
  const longSpan = range === "all" || range === "1y";
  const tickFormatter = (value: string) => {
    if (longSpan) {
      // "Nov 2025" style for long ranges.
      const [y, m] = value.split("-").map(Number);
      return new Intl.DateTimeFormat("en-US", {
        month: "short",
        year: "numeric",
        timeZone: "UTC",
      }).format(new Date(Date.UTC(y, m - 1, 1)));
    }
    return formatDayKey(value).slice(0, -6); // "Nov 15"
  };

  const isEmpty = points.length === 0;

  return (
    <Card className="flex flex-col gap-5 p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="size-4 text-steel" aria-hidden />
            Problem solving progress
          </CardTitle>
          <CardDescription className="numeric">
            {range === "all"
              ? `${formatNumber(gained)} problems solved in total`
              : `${formatNumber(gained)} problems solved · ${formatNumber(before + gained)} total`}
          </CardDescription>
        </CardHeader>

        {/* Segmented range control */}
        <div
          role="tablist"
          aria-label="Time range"
          className="flex w-fit items-center gap-0.5 rounded-pill bg-studio-mist p-1"
        >
          {RANGES.map((r) => (
            <button
              key={r.id}
              role="tab"
              aria-selected={range === r.id}
              onClick={() => setRange(r.id)}
              className={`rounded-pill px-3 py-1.5 text-[12px] leading-4 tracking-[-0.12px] transition-colors duration-200 ${
                range === r.id
                  ? "bg-gallery-white font-medium text-ink shadow-subtle"
                  : "text-slate hover:text-ink"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
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
              data={points}
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
                dataKey="date"
                tick={{ fontSize: 12, fill: "#707070" }}
                tickLine={false}
                axisLine={{ stroke: "#d6d6d6" }}
                minTickGap={48}
                interval="preserveStartEnd"
                tickFormatter={tickFormatter}
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#707070" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
                domain={[before, (max: number) => Math.ceil(max)]}
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
    </Card>
  );
}
