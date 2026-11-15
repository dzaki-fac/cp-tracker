"use client";

import { useState } from "react";

import { ActivityHeatmap } from "@/components/charts/activity-heatmap";
import { DifficultyProgressChart } from "@/components/charts/difficulty-progress-chart";
import { RatingDistributionChart } from "@/components/charts/rating-distribution-chart";
import { RecentSolvedProblems } from "@/components/problems/recent-solved-problems";
import { TopicBreakdownCard } from "@/components/problems/tag-breakdown-card";
import type {
  DailyActivity,
  SolvedProblem,
  WeeklyActivityPoint,
} from "@/types/platform";

interface PracticeSectionProps {
  weeklyActivity: WeeklyActivityPoint[];
  solvedProblems: SolvedProblem[];
  activity: DailyActivity[];
}

/**
 * Client boundary for the lower (deeper-data) band. Owns the shared
 * tag-filter state so a click in the topic breakdown card filters the
 * recent solved problems list below.
 */
export function PracticeSection({
  weeklyActivity,
  solvedProblems,
  activity,
}: PracticeSectionProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const toggleTag = (tag: string) =>
    setSelectedTags((previous) =>
      previous.includes(tag)
        ? previous.filter((t) => t !== tag)
        : [...previous, tag],
    );

  return (
    <div className="flex flex-col gap-5">
      {/* Difficulty Progress: volume + progression side by side */}
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <DifficultyProgressChart weeks={weeklyActivity} />
        <RatingDistributionChart problems={solvedProblems} />
      </div>

      {/* Topic Breakdown */}
      <TopicBreakdownCard
        problems={solvedProblems}
        selectedTags={selectedTags}
        onToggle={toggleTag}
      />

      {/* Recent Solved Problems */}
      <RecentSolvedProblems
        problems={solvedProblems}
        selectedTags={selectedTags}
        onTagsChange={setSelectedTags}
      />

      {/* Long-term consistency, kept from the previous design */}
      <ActivityHeatmap days={activity} />
    </div>
  );
}
