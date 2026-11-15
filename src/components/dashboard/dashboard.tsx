import { CodeforcesApiError } from "@/lib/codeforces/api";
import { getDashboardData } from "@/lib/dashboard";

import { ActivityCalendar } from "@/components/charts/activity-calendar";
import { ActivityHeatmap } from "@/components/charts/activity-heatmap";
import { CumulativeProgressChart } from "@/components/charts/cumulative-progress-chart";
import { WeeklyPerformanceChart } from "@/components/charts/weekly-performance-chart";
import { DashboardError } from "@/components/dashboard/dashboard-error";
import { FreshnessBar } from "@/components/dashboard/freshness-bar";
import { LowerSections } from "@/components/dashboard/practice-section";
import { ProfileCard } from "@/components/dashboard/profile-card";
import { RecentOverview } from "@/components/dashboard/recent-overview";

/**
 * Server component: fetches the normalized dashboard payload and composes
 * the redesigned training-tracker layout:
 *
 *   1. Profile header (compact)      6. Difficulty progress
 *   2. Recent activity overview      7. Topic breakdown
 *   3. Activity heatmap (365d)       8. All-time statistics
 *   4. Monthly activity calendar     9. Rating progression
 *   5. Weekly performance           10. Recent solved problems
 *   — Problem solving progress between 5 and 6
 *
 * Layout: white bands for the personal "training" chapters, then a full-bleed
 * Studio Mist band for the deeper data chapters, per DESIGN.md. Each section
 * manages its own centered container so backgrounds can span the viewport.
 */
export default async function Dashboard() {
  let data;
  let ageMs: number;
  try {
    ({ data, ageMs } = await getDashboardData());
  } catch (error) {
    if (error instanceof CodeforcesApiError) {
      return <DashboardError message={error.message} />;
    }
    throw error;
  }

  const { profile, stale } = data;

  return (
    <div>
      {/* Personal training band — gallery white */}
      <section
        aria-label="Recent training activity"
        className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-5 py-8 sm:px-6 lg:px-10 lg:py-12"
      >
        <FreshnessBar ageMs={ageMs} stale={stale} />

        {/* 1. Profile header (compact) */}
        <ProfileCard profile={profile} />

        {/* 2. Recent Activity Overview */}
        <section aria-label="Recent activity overview">
          <RecentOverview data={data} />
        </section>

        {/* 3. Activity heatmap — sits above the monthly calendar */}
        <section aria-label="Activity heatmap">
          <ActivityHeatmap days={data.activity} />
        </section>

        {/* 4 + 5. Monthly calendar and weekly performance side by side */}
        <section
          aria-label="Activity calendar and weekly performance"
          className="grid grid-cols-1 gap-5 lg:grid-cols-2"
        >
          <ActivityCalendar
            activity={data.activity}
            solvedProblems={data.solvedProblems}
          />
          <WeeklyPerformanceChart
            weeks={data.weeklyActivity}
            currentStreakDays={data.currentStreakDays}
            lastWeekSameElapsed={data.lastWeekSameElapsed}
          />
        </section>

        {/* Problem solving progress */}
        <section aria-label="Problem solving progress">
          <CumulativeProgressChart series={data.cumulative} />
        </section>
      </section>

      {/* Insights + all-time + recent problems (client, two bands) */}
      <LowerSections data={data} />
    </div>
  );
}
