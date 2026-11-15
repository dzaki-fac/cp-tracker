import { CodeforcesApiError } from "@/lib/codeforces/api";
import { getDashboardData } from "@/lib/dashboard";

import { ActivityCalendar } from "@/components/charts/activity-calendar";
import { CumulativeProgressChart } from "@/components/charts/cumulative-progress-chart";
import { RatingTrendCard } from "@/components/charts/rating-trend-card";
import { WeeklyPerformanceChart } from "@/components/charts/weekly-performance-chart";
import { AllTimeStats } from "@/components/dashboard/all-time-stats";
import { DashboardError } from "@/components/dashboard/dashboard-error";
import { FreshnessBar } from "@/components/dashboard/freshness-bar";
import { PracticeSection } from "@/components/dashboard/practice-section";
import { ProfileCard } from "@/components/dashboard/profile-card";
import { RecentOverview } from "@/components/dashboard/recent-overview";

/**
 * Server component: fetches the normalized dashboard payload and composes
 * the redesigned training-tracker layout, in this exact order:
 *
 *   1. Profile header (compact)      6. Difficulty progress
 *   2. Recent activity overview      7. Topic breakdown
 *   3. 30-day activity calendar      8. Recent solved problems
 *   4. Weekly performance            9. All-time statistics
 *   5. Problem solving progress     10. Rating progression
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

        {/* 3 + 4. Calendar and weekly performance side by side on desktop */}
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
          />
        </section>

        {/* 5. Problem solving progress */}
        <section aria-label="Problem solving progress">
          <CumulativeProgressChart series={data.cumulative} />
        </section>
      </section>

      {/* Deeper data band — full-bleed Studio Mist */}
      <section aria-label="Practice insights" className="w-full bg-studio-mist">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-5 py-10 sm:px-6 lg:px-10">
          <PracticeSection
            weeklyActivity={data.weeklyActivity}
            solvedProblems={data.solvedProblems}
            activity={data.activity}
          />
        </div>
      </section>

      {/* All-time & rating band — gallery white, quiet by design */}
      <section
        aria-label="All-time statistics and rating"
        className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-5 py-10 sm:px-6 lg:px-10 lg:py-14"
      >
        {/* 9. All-Time Statistics */}
        <AllTimeStats data={data} />

        {/* 10. Rating progression */}
        <RatingTrendCard history={data.ratingHistory} />
      </section>
    </div>
  );
}
