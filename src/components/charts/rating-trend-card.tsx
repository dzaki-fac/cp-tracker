"use client";

import { useMemo } from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { LineChart as LineChartIcon } from "lucide-react";

import {
  ChartTooltipFrame,
  ChartTooltipLabel,
  ChartTooltipValue,
  type ChartTooltipProps,
} from "@/components/charts/chart-tooltip";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { formatAxisTick, xAxisTicks } from "@/lib/utils";
import type { RatingHistoryPoint } from "@/types/platform";

const ACCENT = "#0071e3";
const DELTA_UP = "#00a900";
const DELTA_DOWN = "#d0342c";

interface TrendPoint {
  at: number;
  rating: number;
  delta: number;
  contestName: string;
}

function RatingTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as TrendPoint | undefined;
  if (!point) return null;
  const up = point.delta >= 0;
  return (
    <ChartTooltipFrame>
      <ChartTooltipLabel>
        {new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          timeZone: "UTC",
        }).format(new Date(point.at))}
      </ChartTooltipLabel>
      <ChartTooltipValue>
        {point.rating}
        <span
          style={{ color: up ? DELTA_UP : DELTA_DOWN, marginLeft: 6 }}
          className="numeric"
        >
          {up ? "+" : ""}
          {point.delta}
        </span>
      </ChartTooltipValue>
      <div className="max-w-[220px] truncate text-steel">{point.contestName}</div>
    </ChartTooltipFrame>
  );
}

/**
 * Rating progression chart for the profile band, fed by the platform's rating
 * history endpoint. Ratings are shown as a step line (a rating is constant
 * between contests) with one dot per rated contest. Hidden — not zeroed —
 * when there is no history yet.
 */
export function RatingTrendCard({ history }: { history: RatingHistoryPoint[] }) {
  const data = useMemo<TrendPoint[]>(
    () =>
      history.map((point) => ({
        at: point.at * 1000,
        rating: point.rating,
        delta: point.delta,
        contestName: point.contestName,
      })),
    [history],
  );

  const { yDomain, yTicks, xTicks } = useMemo(() => {
    if (data.length < 2) {
      return {
        yDomain: [0, 100] as [number, number],
        yTicks: [] as number[],
        xTicks: [] as number[],
      };
    }
    const ratings = data.map((point) => point.rating);
    const min = Math.min(...ratings);
    const max = Math.max(...ratings);
    // Round the domain outwards to clean 100s (200-step when the span is wide).
    const lo = Math.floor((min - 60) / 100) * 100;
    const hi = Math.ceil((max + 60) / 100) * 100;
    const step = hi - lo > 800 ? 200 : 100;
    const yTicks: number[] = [];
    for (let value = lo; value <= hi; value += step) yTicks.push(value);
    const xTicks = xAxisTicks(data[0].at, data[data.length - 1].at);
    return { yDomain: [lo, hi] as [number, number], yTicks, xTicks };
  }, [data]);

  const firstTick = xTicks[0] ?? 0;

  return (
    <Card className="flex h-full flex-col gap-5 p-7">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LineChartIcon className="size-4 text-steel" aria-hidden />
          Rating progression
        </CardTitle>
        <CardDescription>Rated contests over time</CardDescription>
      </CardHeader>

      {/* Explicit height: percentage-height ResponsiveContainer needs a
          definite parent height (flex-1/min-h collapses to 0 in auto-height
          cards, which blanked the chart). */}
      <div className="h-52 w-full">
        {data.length < 2 ? (
          <div className="flex h-full items-center justify-center text-[14px] text-steel">
            {data.length === 0
              ? "No rated contests yet."
              : "Not enough rating history to plot yet."}
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={data}
              margin={{ top: 8, right: 8, bottom: 0, left: 0 }}
            >
              <defs>
                <linearGradient id="ratingFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={ACCENT} stopOpacity={0.14} />
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
                tickFormatter={(value: number) =>
                  formatAxisTick(value, firstTick)
                }
                tick={{ fontSize: 12, fill: "#707070" }}
                tickLine={false}
                axisLine={{ stroke: "#d6d6d6" }}
              />
              <YAxis
                domain={yDomain}
                ticks={yTicks}
                tick={{ fontSize: 12, fill: "#707070" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip content={<RatingTooltip />} cursor={{ stroke: "#d6d6d6" }} />
              <Area
                type="linear"
                dataKey="rating"
                stroke={ACCENT}
                strokeWidth={2}
                fill="url(#ratingFill)"
                dot={{ r: 3.5, fill: ACCENT, strokeWidth: 0 }}
                activeDot={{ r: 4.5, fill: ACCENT, strokeWidth: 2, stroke: "#ffffff" }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
