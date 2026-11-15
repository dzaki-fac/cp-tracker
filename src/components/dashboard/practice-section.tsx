"use client";

import { useState } from "react";

import { RatingTrendCard } from "@/components/charts/rating-trend-card";
import { DifficultyProgressChart } from "@/components/charts/difficulty-progress-chart";
import { RatingDistributionChart } from "@/components/charts/rating-distribution-chart";
import { AllTimeStats } from "@/components/dashboard/all-time-stats";
import { RecentSolvedProblems } from "@/components/problems/recent-solved-problems";
import { TopicBreakdownCard } from "@/components/problems/tag-breakdown-card";
import type { DashboardData } from "@/types/platform";

interface LowerSectionsProps {
  data: DashboardData;
}

/**
 * Client boundary for everything below the progress chart, spanning two
 * visual bands in order:
 *
 *   - Studio Mist band: Difficulty progress + Topic breakdown
 *   - Gallery-white bottom band: All-time statistics, Rating progression,
 *     and Recent solved problems at the very bottom.
 *
 * It owns the shared tag-filter state so a click in the topic breakdown
 * card filters the recent solved problems list at the page bottom.
 */
export function LowerSections({ data }: LowerSectionsProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const toggleTag = (tag: string) =>
    setSelectedTags((previous) =>
      previous.includes(tag)
        ? previous.filter((t) => t !== tag)
        : [...previous, tag],
    );

  return (
    <>
      {/* Deeper data band — full-bleed Studio Mist */}
      <section aria-label="Practice insights" className="w-full bg-studio-mist">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-5 py-10 sm:px-6 lg:px-10">
          {/* Difficulty Progress: volume + progression side by side */}
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <DifficultyProgressChart weeks={data.weeklyActivity} />
            <RatingDistributionChart problems={data.solvedProblems} />
          </div>

          {/* Topic Breakdown */}
          <TopicBreakdownCard
            problems={data.solvedProblems}
            selectedTags={selectedTags}
            onToggle={toggleTag}
          />
        </div>
      </section>

      {/* All-time & rating band — gallery white, quiet by design */}
      <section
        aria-label="All-time statistics and rating"
        className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-5 py-10 sm:px-6 lg:px-10 lg:py-14"
      >
        {/* All-Time Statistics */}
        <AllTimeStats data={data} />

        {/* Rating progression */}
        <RatingTrendCard history={data.ratingHistory} />

        {/* Recent Solved Problems — the very last section */}
        <RecentSolvedProblems
          problems={data.solvedProblems}
          selectedTags={selectedTags}
          onTagsChange={setSelectedTags}
        />
      </section>
    </>
  );
}
