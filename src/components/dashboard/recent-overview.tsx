import type { LucideIcon } from "lucide-react";
import {
  CalendarDays,
  CheckCircle2,
  Flame,
  Gauge,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import type { ReactNode } from "react";

import { Card } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import type { DashboardData } from "@/types/platform";

const UP = "#00a900";
const DOWN = "#d0342c";
const FLAT = "#86868b";

/**
 * Quiet comparison row used under each overview card's main value.
 * A null previous value renders a neutral "first period" note instead of a
 * misleading percentage.
 */
function DeltaRow({
  delta,
  suffix,
  emptyLabel,
}: {
  /** Current - previous in the card's unit. */
  delta: number | null;
  suffix: string;
  emptyLabel: string;
}) {
  if (delta == null) {
    return (
      <span className="text-[12px] leading-4 text-steel">{emptyLabel}</span>
    );
  }
  const up = delta > 0;
  const flat = delta === 0;
  const color = flat ? FLAT : up ? UP : DOWN;
  const Icon = flat ? Gauge : up ? TrendingUp : TrendingDown;
  return (
    <span
      className="inline-flex items-center gap-1 text-[12px] leading-4 font-medium"
      style={{ color }}
    >
      <Icon className="size-3.5" aria-hidden />
      {flat ? "Same as last period" : `${up ? "+" : "−"}${formatNumber(Math.abs(delta))}${suffix}`}
    </span>
  );
}

function OverviewCard({
  label,
  value,
  caption,
  icon: Icon,
  children,
}: {
  label: string;
  value: string;
  caption?: string;
  icon: LucideIcon;
  children?: ReactNode;
}) {
  return (
    <Card className="flex flex-col gap-3 p-6 transition-colors duration-200 hover:shadow-subtle-steel">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[14px] leading-[1.29] text-slate">{label}</span>
        <Icon className="size-4 shrink-0 text-steel" aria-hidden />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="font-display numeric text-[28px] leading-[1.05] font-semibold text-ink">
          {value}
        </span>
        {caption ? (
          <span className="text-[12px] leading-4 text-steel">{caption}</span>
        ) : null}
        {children}
      </div>
    </Card>
  );
}

/** Percentage change vs a previous value; null when no baseline exists. */
function percentChange(current: number, previous: number): number | null {
  if (previous <= 0) return current > 0 ? null : 0;
  return Math.round(((current - previous) / previous) * 100);
}

/**
 * Recent Activity Overview — the four primary "how am I doing lately" cards,
 * all computed in the display timezone from unique first-solves.
 */
export function RecentOverview({ data }: { data: DashboardData }) {
  const weekDelta = data.solvedThisWeek - data.lastWeekSameElapsed;
  const monthDelta = data.solvedLast30Days - data.solvedPrev30Days;
  const weekPercent = percentChange(data.solvedThisWeek, data.lastWeekSameElapsed);
  const monthPercent = percentChange(data.solvedLast30Days, data.solvedPrev30Days);

  const difficultyDelta =
    data.avgDifficultyLast30Days != null && data.avgDifficultyPrev30Days != null
      ? data.avgDifficultyLast30Days - data.avgDifficultyPrev30Days
      : null;

  const weekCaption =
    data.elapsedDaysThisWeek < 7
      ? `vs same span last week (of ${data.elapsedDaysThisWeek} day${data.elapsedDaysThisWeek === 1 ? "" : "s"} elapsed)`
      : "vs last week (full week)";

  return (
    <div className="grid grid-cols-2 gap-5 lg:grid-cols-4">
      <OverviewCard
        label="Solved this week"
        value={formatNumber(data.solvedThisWeek)}
        caption={weekCaption}
        icon={CheckCircle2}
      >
        <DeltaRow
          delta={weekDelta}
          suffix=""
          emptyLabel={`+${formatNumber(data.solvedThisWeek)} this week`}
        />
        {weekPercent != null && weekDelta !== 0 ? (
          <span className="text-[12px] leading-4 text-steel">
            {weekPercent > 0 ? "+" : "−"}
            {formatNumber(Math.abs(weekPercent))}% WoW
          </span>
        ) : null}
      </OverviewCard>

      <OverviewCard
        label="Solved in last 30 days"
        value={formatNumber(data.solvedLast30Days)}
        caption="vs the preceding 30 days"
        icon={CalendarDays}
      >
        <DeltaRow delta={monthDelta} suffix="" emptyLabel="First 30-day period" />
        {monthPercent != null && monthDelta !== 0 ? (
          <span className="text-[12px] leading-4 text-steel">
            {monthPercent > 0 ? "+" : "−"}
            {formatNumber(Math.abs(monthPercent))}% change
          </span>
        ) : null}
      </OverviewCard>

      <OverviewCard
        label="Active days this week"
        value={`${formatNumber(data.activeDaysThisWeek)} / ${formatNumber(data.elapsedDaysThisWeek)} days`}
        caption={
          data.elapsedDaysThisWeek < 7
            ? "Week in progress (Mon–Sun)"
            : "Monday–Sunday week"
        }
        icon={Flame}
      >
        <span className="text-[12px] leading-4 text-steel">
          Current streak: {formatNumber(data.currentStreakDays)} day
          {data.currentStreakDays === 1 ? "" : "s"}
        </span>
      </OverviewCard>

      <OverviewCard
        label="Avg difficulty (30 days)"
        value={
          data.avgDifficultyLast30Days == null
            ? "N/A"
            : formatNumber(data.avgDifficultyLast30Days)
        }
        caption="Rated problems only"
        icon={Gauge}
      >
        <DeltaRow
          delta={difficultyDelta}
          suffix=" pts"
          emptyLabel={
            data.avgDifficultyLast30Days == null
              ? "No rated problems yet"
              : "First 30-day period"
          }
        />
      </OverviewCard>
    </div>
  );
}
