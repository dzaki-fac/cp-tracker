"use client";

import { useState } from "react";

import { ActivityHeatmap } from "@/components/charts/activity-heatmap";
import { CumulativeProgressChart } from "@/components/charts/cumulative-progress-chart";
import { RatingDistributionChart } from "@/components/charts/rating-distribution-chart";
import { SolvedProblemsTable } from "@/components/problems/solved-problems-table";
import { TagBreakdownCard } from "@/components/problems/tag-breakdown-card";
import type {
  CumulativePoint,
  DailyActivity,
  RatingBucket,
  SolvedProblem,
} from "@/types/platform";

interface InsightsSectionProps {
  buckets: RatingBucket[];
  unrated: number;
  cumulative: CumulativePoint[];
  activity: DailyActivity[];
  solvedProblems: SolvedProblem[];
  contestNames: Record<number, string>;
}

/**
 * Client boundary for the insights band. Owns the shared tag-filter state so
 * a click in the tag breakdown card filters the solved problems table below.
 */
export function InsightsSection({
  buckets,
  unrated,
  cumulative,
  activity,
  solvedProblems,
  contestNames,
}: InsightsSectionProps) {
  const [selectedTags, setSelectedTags] = useState<string[]>([]);

  const toggleTag = (tag: string) =>
    setSelectedTags((previous) =>
      previous.includes(tag)
        ? previous.filter((t) => t !== tag)
        : [...previous, tag],
    );

  return (
    <div className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <RatingDistributionChart buckets={buckets} unrated={unrated} />
        <TagBreakdownCard
          problems={solvedProblems}
          selectedTags={selectedTags}
          onToggle={toggleTag}
        />
      </div>
      <CumulativeProgressChart series={cumulative} />
      <ActivityHeatmap days={activity} />
      <SolvedProblemsTable
        problems={solvedProblems}
        contestNames={contestNames}
        selectedTags={selectedTags}
        onTagsChange={setSelectedTags}
      />
    </div>
  );
}
