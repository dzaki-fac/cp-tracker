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
  type LabelProps,
} from "recharts";
import { BarChart3 } from "lucide-react";

import {
  ChartTooltipFrame,
  ChartTooltipLabel,
  ChartTooltipValue,
  type ChartTooltipProps,
} from "@/components/charts/chart-tooltip";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { getRankColor } from "@/lib/cf-rank";
import { fillRatingBuckets } from "@/lib/statistics";
import { formatNumber, niceTicks } from "@/lib/utils";
import type { RatingBucket } from "@/types/platform";

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

interface RatingDistributionChartProps {
  buckets: RatingBucket[];
  unrated: number;
}

/**
 * Interactive bar chart of unique solved problems by difficulty rating.
 * Empty 100-point buckets are filled with 0 so the full range appears, and
 * each bar is colored with its Codeforces rank-band color. Unrated problems
 * are excluded from the distribution and reported separately.
 */
export function RatingDistributionChart({
  buckets,
  unrated,
}: RatingDistributionChartProps) {
  const data = useMemo<DistributionPoint[]>(
    () =>
      fillRatingBuckets(buckets).map((bucket) => ({
        rating: bucket.rating as number,
        count: bucket.count,
      })),
    [buckets],
  );

  const maxCount = useMemo(
    () => data.reduce((max, point) => Math.max(max, point.count), 0),
    [data],
  );
  const yTicks = useMemo(() => niceTicks(maxCount), [maxCount]);

  const totalRated = data.reduce((sum, point) => sum + point.count, 0);
  const isEmpty = totalRated === 0 && unrated === 0;

  return (
    <Card className="flex flex-col gap-5 p-7">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="size-4 text-steel" aria-hidden />
          Solved by difficulty
        </CardTitle>
        <CardDescription>
          Unique problems grouped by rating, colored by rank band
        </CardDescription>
      </CardHeader>

      <div className="h-80 w-full">
        {isEmpty ? (
          <div className="flex h-full items-center justify-center text-[14px] text-steel">
            No solved problems yet.
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

      {unrated > 0 ? (
        <p className="text-[12px] leading-4 tracking-[-0.12px] text-steel">
          {formatNumber(unrated)} unrated problem{unrated === 1 ? "" : "s"} not
          shown in the distribution.
        </p>
      ) : null}
    </Card>
  );
}
