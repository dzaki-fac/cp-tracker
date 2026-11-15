import {
  CalendarDays,
  Gauge,
  CheckCircle2,
  Percent,
  Send,
  Target,
} from "lucide-react";

import { StatCard } from "@/components/dashboard/stat-card";
import type { DashboardData } from "@/types/platform";

const MONTH_FORMAT = new Intl.DateTimeFormat("en-US", { month: "long" });

/** The six overview statistic cards required by the dashboard spec. */
export function StatsGrid({ data }: { data: DashboardData }) {
  const now = new Date();
  const monthLabel = MONTH_FORMAT.format(now);

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        label="Problems solved"
        value={data.uniqueSolved}
        icon={CheckCircle2}
        caption={`Current streak: ${data.currentStreakDays} day${
          data.currentStreakDays === 1 ? "" : "s"
        }`}
      />
      <StatCard
        label="Submissions"
        value={data.submissionsTotal}
        icon={Send}
        caption={`${data.acceptedSubmissions.toLocaleString("en-US")} accepted all-time`}
      />
      <StatCard
        label="Problems attempted"
        value={data.uniqueAttempted}
        icon={Target}
        caption="At least one submission"
      />
      <StatCard
        label="Acceptance rate"
        value={data.acceptanceRate}
        icon={Percent}
        suffix="%"
        caption="Accepted submissions ÷ all submissions"
      />
      <StatCard
        label="Solved this month"
        value={data.solvedThisMonth}
        icon={CalendarDays}
        caption={`First solved in ${monthLabel}`}
      />
      <StatCard
        label="Avg per active day"
        value={
          data.avgPerActiveDay == null ? null : data.avgPerActiveDay.toFixed(1)
        }
        icon={Gauge}
        caption={`Across ${data.activeDays.toLocaleString("en-US")} active days${
          data.longestStreakDays > 0
            ? ` · best streak ${data.longestStreakDays} days`
            : ""
        }`}
      />
    </div>
  );
}
