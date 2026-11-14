import { CodeforcesApiError } from "@/lib/codeforces/api";
import { getDashboardData } from "@/lib/dashboard";

import { DashboardError } from "@/components/dashboard/dashboard-error";
import { FreshnessBar } from "@/components/dashboard/freshness-bar";
import { ProfileCard } from "@/components/dashboard/profile-card";
import { StatsGrid } from "@/components/dashboard/stats-grid";
import { ActivityHeatmap } from "@/components/charts/activity-heatmap";
import { CumulativeProgressChart } from "@/components/charts/cumulative-progress-chart";
import { RatingDistributionChart } from "@/components/charts/rating-distribution-chart";
import { RatingTrendCard } from "@/components/charts/rating-trend-card";
import { SolvedProblemsTable } from "@/components/problems/solved-problems-table";

/**
 * Server component: fetches the normalized dashboard payload and composes
 * the presentation sections. All platform-specific logic stays behind
 * `lib/codeforces` — the sections below consume generic domain types.
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
    <div className="flex flex-col gap-10">
      {/* Profile band */}
      <section
        aria-label="Profile"
        className="flex flex-col gap-3"
      >
        <FreshnessBar ageMs={ageMs} stale={stale} />
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <ProfileCard profile={profile} />
          </div>
          <RatingTrendCard history={data.ratingHistory} />
        </div>
      </section>

      {/* Overview statistics */}
      <section aria-label="Overview statistics">
        <StatsGrid data={data} />
      </section>

      {/* Insights band — alternate studio-mist section */}
      <section
        aria-label="Insights"
        className="-mx-5 -my-6 bg-studio-mist px-5 py-12 sm:-mx-6 sm:px-6 lg:-mx-10 lg:px-10"
      >
        <div className="mx-auto flex max-w-6xl flex-col gap-5">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <RatingDistributionChart
              buckets={data.ratingDistribution}
              unrated={data.unratedSolved}
            />
            <ActivityHeatmap days={data.activity} total={data.activityTotal} />
          </div>
          <CumulativeProgressChart series={data.cumulative} />
          <SolvedProblemsTable problems={data.solvedProblems} />
        </div>
      </section>
    </div>
  );
}
