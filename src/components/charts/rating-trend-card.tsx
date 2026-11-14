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
import type { RatingHistoryPoint } from "@/types/platform";

const ACCENT = "#0071e3";

function RatingTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as RatingHistoryPoint | undefined;
  if (!point) return null;
  return (
    <ChartTooltipFrame>
      <ChartTooltipLabel>
        {/* `at` is already in milliseconds in the chart data. */}
        {new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
          timeZone: "UTC",
        }).format(new Date(point.at))}
      </ChartTooltipLabel>
      <ChartTooltipValue>{point.rating}</ChartTooltipValue>
      <div className="max-w-[200px] truncate text-steel">{point.contestName}</div>
    </ChartTooltipFrame>
  );
}

/**
 * Compact rating-progression chart for the profile band, fed by the platform's
 * rating history endpoint. Hidden (not zeroed) when there is no history yet.
 */
export function RatingTrendCard({ history }: { history: RatingHistoryPoint[] }) {
  const data = useMemo(
    () =>
      history.map((p) => ({
        at: p.at * 1000,
        rating: p.rating,
        contestName: p.contestName,
      })),
    [history],
  );

  const min = data.length ? Math.min(...data.map((d) => d.rating)) : 0;
  const max = data.length ? Math.max(...data.map((d) => d.rating)) : 0;

  return (
    <Card className="flex flex-col gap-5 p-7">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <LineChartIcon className="size-4 text-steel" aria-hidden />
          Rating progression
        </CardTitle>
        <CardDescription>Rated contests over time</CardDescription>
      </CardHeader>

      <div className="h-[168px] w-full">
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
              margin={{ top: 8, right: 8, bottom: 0, left: -24 }}
            >
              <defs>
                <linearGradient id="ratingFill" x1="0" y1="0" x2="0" y2="1">
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
                tick={{ fontSize: 12, fill: "#707070" }}
                tickLine={false}
                axisLine={{ stroke: "#d6d6d6" }}
                minTickGap={40}
                tickFormatter={(value: number) =>
                  new Intl.DateTimeFormat("en-US", {
                    day: "numeric",
                    month: "short",
                    timeZone: "UTC",
                  }).format(new Date(value))
                }
              />
              <YAxis
                tick={{ fontSize: 12, fill: "#707070" }}
                tickLine={false}
                axisLine={false}
                domain={[
                  Math.floor((min - 80) / 50) * 50,
                  Math.ceil((max + 80) / 50) * 50,
                ]}
              />
              <Tooltip content={<RatingTooltip />} cursor={{ stroke: "#d6d6d6" }} />
              <Area
                type="monotone"
                dataKey="rating"
                stroke={ACCENT}
                strokeWidth={2}
                fill="url(#ratingFill)"
                dot={false}
                activeDot={{ r: 4, fill: ACCENT, strokeWidth: 0 }}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </Card>
  );
}
