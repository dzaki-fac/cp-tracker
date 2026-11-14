import {
  CalendarDays,
  CalendarRange,
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
  const yearLabel = String(now.getFullYear());

  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
      <StatCard
        label="Problems solved"
        value={data.uniqueSolved}
        icon={CheckCircle2}
        caption="Unique accepted problems"
      />
      <StatCard
        label="Submissions"
        value={data.submissionsTotal}
        icon={Send}
        caption="All-time submissions"
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
        caption={`${data.acceptedSubmissions.toLocaleString("en-US")} accepted submissions`}
      />
      <StatCard
        label="Solved this month"
        value={data.solvedThisMonth}
        icon={CalendarDays}
        caption={`First solved in ${monthLabel}`}
      />
      <StatCard
        label="Solved this year"
        value={data.solvedThisYear}
        icon={CalendarRange}
        caption={`First solved in ${yearLabel}`}
      />
    </div>
  );
}
