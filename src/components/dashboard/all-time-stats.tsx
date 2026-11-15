import { CalendarCheck, Flame, Percent, Send, Target } from "lucide-react";

import { Card } from "@/components/ui/card";
import { formatNumber } from "@/lib/utils";
import type { DashboardData } from "@/types/platform";

/**
 * All-Time Statistics — a quiet, compact band of lifetime numbers at the
 * bottom of the dashboard. Small cards keep lifetime data accessible without
 * competing with the recent-activity focus above.
 */
export function AllTimeStats({ data }: { data: DashboardData }) {
  const items: Array<{ label: string; value: string; caption?: string }> = [
    {
      label: "Unique problems solved",
      value: formatNumber(data.uniqueSolved),
    },
    {
      label: "Submissions",
      value: formatNumber(data.submissionsTotal),
      caption: `${formatNumber(data.acceptedSubmissions)} accepted`,
    },
    {
      label: "Acceptance rate",
      value: data.acceptanceRate == null ? "—" : `${formatNumber(data.acceptanceRate)}%`,
      caption: "All-time",
    },
    {
      label: "Problems attempted",
      value: formatNumber(data.uniqueAttempted),
      caption: "At least one submission",
    },
    {
      label: "Active days",
      value: formatNumber(data.activeDays),
      caption:
        data.avgPerActiveDay != null
          ? `${data.avgPerActiveDay.toFixed(1)} per active day`
          : undefined,
    },
    {
      label: "Current streak",
      value: `${formatNumber(data.currentStreakDays)} day${data.currentStreakDays === 1 ? "" : "s"}`,
    },
    {
      label: "Best streak",
      value: `${formatNumber(data.longestStreakDays)} day${data.longestStreakDays === 1 ? "" : "s"}`,
    },
    {
      label: "Current rating",
      value: data.profile.ratingCurrent == null ? "—" : formatNumber(data.profile.ratingCurrent),
      caption: data.profile.rankCurrent ?? undefined,
    },
    {
      label: "Max rating",
      value: data.profile.ratingMax == null ? "—" : formatNumber(data.profile.ratingMax),
      caption: data.profile.rankMax ?? undefined,
    },
  ];

  const icons = [CalendarCheck, Send, Percent, Target, Flame];

  return (
    <div>
      <h3 className="mb-4 text-[15px] leading-[1.3] font-semibold text-ink">
        All-time statistics
      </h3>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
        {items.map((item, index) => {
          const Icon = icons[index % icons.length];
          return (
            <Card
              key={item.label}
              className="flex flex-col gap-1.5 p-4 transition-colors duration-200 hover:shadow-subtle-steel"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[12px] leading-4 text-slate">
                  {item.label}
                </span>
                <Icon className="size-3.5 shrink-0 text-steel" aria-hidden />
              </div>
              <span className="numeric text-[18px] leading-[1.2] font-semibold text-ink">
                {item.value}
              </span>
              {item.caption ? (
                <span className="text-[11px] leading-4 text-steel">
                  {item.caption}
                </span>
              ) : null}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
