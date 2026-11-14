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
 *
 * Layout: white bands for the identity/overview chapters, then a full-bleed
 * Studio Mist band for the insights chapter (charts + table), per DESIGN.md.
 * Each section manages its own centered container so backgrounds can span
 * the full viewport width on large screens.
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
      {/* Identity & overview band — gallery white */}
      <section
        aria-label="Profile and overview"
        className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-10 sm:px-6 lg:px-10 lg:py-14"
      >
        <div className="flex flex-col gap-3">
          <FreshnessBar ageMs={ageMs} stale={stale} />
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
            <div className="lg:col-span-2">
              <ProfileCard profile={profile} />
            </div>
            <RatingTrendCard history={data.ratingHistory} />
          </div>
        </div>

        <section aria-label="Overview statistics">
          <StatsGrid data={data} />
        </section>
      </section>

      {/* Insights band — full-bleed Studio Mist */}
      <section aria-label="Insights" className="w-full bg-studio-mist">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-5 py-12 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <RatingDistributionChart
              buckets={data.ratingDistribution}
              unrated={data.unratedSolved}
            />
            <CumulativeProgressChart series={data.cumulative} />
          </div>
          <ActivityHeatmap days={data.activity} total={data.activityTotal} />
          <SolvedProblemsTable problems={data.solvedProblems} />
        </div>
      </section>
    </div>
  );
}
