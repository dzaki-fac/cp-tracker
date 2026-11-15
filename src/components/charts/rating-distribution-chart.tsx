"use client";

import { useMemo, useState } from "react";
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
  type LabelProps,
} from "recharts";
import { BarChart3 } from "lucide-react";

import {
  ChartTooltipFrame,
  ChartTooltipLabel,
  ChartTooltipValue,
  type ChartTooltipProps,
} from "@/components/charts/chart-tooltip";
import { RangeTabs, type PracticeRangeId } from "@/components/charts/range-tabs";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getRankColor } from "@/lib/cf-rank";
import {
  buildRatingDistribution,
  dayKeyFromUnix,
  dayKeyOffset,
  fillRatingBuckets,
  todayDayKey,
} from "@/lib/statistics";
import { formatNumber, niceTicks } from "@/lib/utils";
import type { SolvedProblem } from "@/types/platform";

interface DistributionPoint {
  rating: number;
  count: number;
}

function RatingTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as DistributionPoint | undefined;
  if (!point) return null;
  return (
    <ChartTooltipFrame>
      <ChartTooltipLabel>
        <span style={{ color: getRankColor(point.rating) }}>●</span>{" "}
        {formatNumber(point.rating)} rating
      </ChartTooltipLabel>
      <ChartTooltipValue>
        {formatNumber(point.count)} unique solved
      </ChartTooltipValue>
    </ChartTooltipFrame>
  );
}

/**
 * Count label above each bar. Extends Recharts' `LabelProps` (the declared
 * content-function contract) with the runtime rectangle props so we stay
 * strictly typed without `any`.
 */
interface CountLabelProps extends LabelProps {
  x?: number;
  y?: number;
}

function CountLabel(props: CountLabelProps) {
  const { x, y, value } = props;
  const count = typeof value === "number" ? value : Number(value);
  if (x == null || y == null || !Number.isFinite(count) || count <= 0) {
    return null;
  }
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

/**
 * Chart B of the Difficulty Progress section: unique solved problems grouped
 * by their actual Codeforces difficulty rating, filterable to the recent
 * windows (default 30 days). Bars keep the rank-band colors; empty 100-step
 * buckets are filled so the full range appears. Unrated problems are counted
 * separately and never shown as a bar.
 */
export function RatingDistributionChart({
  problems,
  defaultRange = "30d",
}: {
  problems: SolvedProblem[];
  defaultRange?: PracticeRangeId;
}) {
  const [range, setRange] = useState<PracticeRangeId>(defaultRange);
  const days = PRACTICE_RANGE_DAYS[range];

  // Day-key cutoff in the display timezone, matching server-side windows.
  const filtered = useMemo(() => {
    if (days == null) return problems;
    const startKey = dayKeyOffset(todayDayKey(), days - 1);
    return problems.filter((p) => dayKeyFromUnix(p.firstSolvedAt) >= startKey);
  }, [problems, days]);

  const distribution = useMemo(
    () => buildRatingDistribution(filtered),
    [filtered],
  );

  const data = useMemo<DistributionPoint[]>(
    () =>
      fillRatingBuckets(distribution.buckets).map((bucket) => ({
        rating: bucket.rating as number,
        count: bucket.count,
      })),
    [distribution],
  );

  const maxCount = useMemo(
    () => data.reduce((max, point) => Math.max(max, point.count), 0),
    [data],
  );
  const yTicks = useMemo(() => niceTicks(maxCount), [maxCount]);

  const totalRated = data.reduce((sum, point) => sum + point.count, 0);
  const isEmpty = filtered.length === 0;

  return (
    <Card className="flex flex-col gap-5 p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="size-4 text-steel" aria-hidden />
            Difficulty distribution
          </CardTitle>
          <CardDescription>
            Unique problems by rating, colored by rank band
          </CardDescription>
        </CardHeader>
        <RangeTabs value={range} onChange={setRange} label="Difficulty window" />
      </div>

      <div className="h-72 w-full">
        {isEmpty ? (
          <div className="flex h-full items-center justify-center text-[14px] text-steel">
            No solved problems in this window.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              margin={{ top: 18, right: 8, bottom: 0, left: -14 }}
            >
              <CartesianGrid vertical={false} stroke="#e6e6e8" />
              <XAxis
                dataKey="rating"
                tick={{ fontSize: 12, fill: "#707070" }}
                tickLine={false}
                axisLine={{ stroke: "#d6d6d6" }}
                minTickGap={8}
                interval="preserveStartEnd"
              />
              <YAxis
                ticks={yTicks}
                domain={[0, yTicks[yTicks.length - 1] ?? 1]}
                allowDecimals={false}
                tick={{ fontSize: 12, fill: "#707070" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={<RatingTooltip />}
                cursor={{ fill: "rgba(0, 113, 227, 0.06)" }}
              />
              <Bar
                dataKey="count"
                radius={[6, 6, 0, 0]}
                maxBarSize={42}
                isAnimationActive={false}
              >
                {data.map((point) => (
                  <Cell
                    key={point.rating}
                    fill={point.count > 0 ? getRankColor(point.rating) : "#e6e6e8"}
                  />
                ))}
                <LabelList dataKey="count" content={<CountLabel />} />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      <p className="text-[12px] leading-4 tracking-[-0.12px] text-steel">
        {formatNumber(totalRated)} rated · {formatNumber(distribution.unrated)}{" "}
        unrated problem{distribution.unrated === 1 ? "" : "s"} not shown
      </p>
    </Card>
  );
}

const PRACTICE_RANGE_DAYS: Record<PracticeRangeId, number | null> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  all: null,
};
