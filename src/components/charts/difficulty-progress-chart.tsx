"use client";

import { useMemo } from "react";
import {
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Gauge } from "lucide-react";

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

const ACCENT = "#0071e3";

interface DifficultyPoint {
  weekStart: string;
  label: string;
  avg: number | null;
  ratedCount: number;
  isCurrent: boolean;
}

function DifficultyTooltip({ active, payload }: ChartTooltipProps) {
  if (!active || !payload?.length) return null;
  const point = payload[0]?.payload as DifficultyPoint | undefined;
  if (!point || point.avg == null) return null;
  const end = dayKeyOffset(point.weekStart, -6);
  return (
    <ChartTooltipFrame>
      <ChartTooltipLabel>
        {formatDayKey(point.weekStart)} – {formatDayKey(end)}
      </ChartTooltipLabel>
      <ChartTooltipValue>
        Avg {formatNumber(point.avg)}
      </ChartTooltipValue>
      <div className="text-steel">
        from {formatNumber(point.ratedCount)} rated problem
        {point.ratedCount === 1 ? "" : "s"}
      </div>
      {point.isCurrent ? <div className="text-steel">Week in progress</div> : null}
    </ChartTooltipFrame>
  );
}

/**
 * Chart A of the Difficulty Progress section: the average Codeforces rating
 * of rated unique problems first solved each week over the last 8 weeks.
 * Weeks without rated solves are missing data (a gap in the line), never 0.
 */
export function DifficultyProgressChart({
  weeks,
}: {
  weeks: WeeklyActivityPoint[];
}) {
  const data = useMemo<DifficultyPoint[]>(
    () =>
      weeks.map((week) => ({
        weekStart: week.weekStart,
        label: new Intl.DateTimeFormat("en-US", {
          month: "short",
          day: "numeric",
          timeZone: "UTC",
        }).format(new Date(`${week.weekStart}T00:00:00Z`)),
        avg: week.avgDifficulty,
        ratedCount: week.ratedCount,
        isCurrent: week.isCurrent,
      })),
    [weeks],
  );

  const ratedPoints = data.filter(
    (point): point is DifficultyPoint & { avg: number } => point.avg != null,
  );
  const values = ratedPoints.map((point) => point.avg);
  const hasData = ratedPoints.length > 0;
  const lo = hasData ? Math.floor((Math.min(...values) - 100) / 200) * 200 : 800;
  const hi = hasData ? Math.ceil((Math.max(...values) + 100) / 200) * 200 : 2200;
  const yTicks: number[] = [];
  const step = hi - lo > 1000 ? 400 : 200;
  for (let v = lo; v <= hi; v += step) yTicks.push(v);

  return (
    <Card className="flex h-full flex-col gap-5 p-7">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Gauge className="size-4 text-steel" aria-hidden />
          Average difficulty per week
        </CardTitle>
        <CardDescription>
          Mean rating of rated problems first solved weekly (8 weeks)
        </CardDescription>
      </CardHeader>

      <div className="h-52 w-full">
        {!hasData ? (
          <div className="flex h-full items-center justify-center text-[14px] text-steel">
            No rated problems solved in this window.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <LineChart
              data={data}
              margin={{ top: 8, right: 8, bottom: 0, left: -8 }}
            >
              <CartesianGrid vertical={false} stroke="#e6e6e8" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 11, fill: "#707070" }}
                tickLine={false}
                axisLine={{ stroke: "#d6d6d6" }}
                interval={0}
                angle={-35}
                textAnchor="end"
                height={30}
              />
              <YAxis
                domain={[lo, hi]}
                ticks={yTicks}
                tick={{ fontSize: 12, fill: "#707070" }}
                tickLine={false}
                axisLine={false}
              />
              <Tooltip
                content={<DifficultyTooltip />}
                cursor={{ stroke: "#d6d6d6" }}
              />
              {/* connectNulls={false}: weeks without rated solves stay gaps */}
              <Line
                type="monotone"
                dataKey="avg"
                stroke={ACCENT}
                strokeWidth={2}
                dot={{
                  r: 3.5,
                  fill: ACCENT,
                  strokeWidth: 0,
                }}
                activeDot={{ r: 4.5, fill: ACCENT, strokeWidth: 2, stroke: "#ffffff" }}
                connectNulls={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>

      <p className="text-[12px] leading-4 text-steel">
        Gaps are weeks without rated solves — unrated problems never pull the
        average down to zero.
      </p>
    </Card>
  );
}
