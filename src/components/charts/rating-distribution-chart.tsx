"use client";

import { useMemo } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { BarChart3 } from "lucide-react";

import {
  ChartTooltipFrame,
  ChartTooltipLabel,
  ChartTooltipValue,
  type ChartTooltipProps,
} from "@/components/charts/chart-tooltip";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import type { RatingBucket } from "@/types/platform";

const ACCENT = "#0071e3";

function RatingTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as { rating: number; count: number } | undefined;
  if (!point) return null;
  return (
    <ChartTooltipFrame>
      <ChartTooltipLabel>{formatNumber(point.rating)} rating</ChartTooltipLabel>
      <ChartTooltipValue>
        {formatNumber(point.count)} unique solved
      </ChartTooltipValue>
    </ChartTooltipFrame>
  );
}

interface RatingDistributionChartProps {
  buckets: RatingBucket[];
  unrated: number;
}

/**
 * Interactive bar chart of unique solved problems by difficulty rating.
 * Unrated problems are excluded from the distribution and reported separately.
 */
export function RatingDistributionChart({
  buckets,
  unrated,
}: RatingDistributionChartProps) {
  const data = useMemo(
    () => buckets.map((b) => ({ rating: b.rating, count: b.count })),
    [buckets],
  );

  const totalRated = data.reduce((sum, b) => sum + b.count, 0);
  const isEmpty = totalRated === 0 && unrated === 0;

  return (
    <Card className="flex flex-col gap-5 p-7">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <BarChart3 className="size-4 text-steel" aria-hidden />
          Solved by difficulty
        </CardTitle>
        <CardDescription>
          Unique problems grouped by rating
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
              margin={{ top: 8, right: 8, bottom: 0, left: -14 }}
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
                tick={{ fontSize: 12, fill: "#707070" }}
                tickLine={false}
                axisLine={false}
                allowDecimals={false}
              />
              <Tooltip
                content={<RatingTooltip />}
                cursor={{ fill: "rgba(0, 113, 227, 0.06)" }}
              />
              <Bar
                dataKey="count"
                fill={ACCENT}
                radius={[6, 6, 0, 0]}
                maxBarSize={42}
                isAnimationActive={false}
              />
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
