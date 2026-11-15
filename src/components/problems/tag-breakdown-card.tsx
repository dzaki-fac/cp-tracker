"use client";

import { useMemo, useState } from "react";
import { Check, Tags } from "lucide-react";

import { RangeTabs, type PracticeRangeId } from "@/components/charts/range-tabs";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  dayKeyFromUnix,
  dayKeyOffset,
  distinctTags,
  todayDayKey,
} from "@/lib/statistics";
import { formatNumber } from "@/lib/utils";
import type { SolvedProblem } from "@/types/platform";

const MAX_TAGS = 10;

const RANGE_DAYS: Record<PracticeRangeId, number | null> = {
  "7d": 7,
  "30d": 30,
  "90d": 90,
  all: null,
};

interface TopicBreakdownProps {
  problems: SolvedProblem[];
  selectedTags: string[];
  onToggle: (tag: string) => void;
}

/**
 * Topic Breakdown — top tags by unique solved count within a selectable
 * window, defaulting to the last 30 days so the section answers "which
 * topics have I been practicing recently". Clicking a tag toggles it in the
 * shared filter that also drives the recent solved problems list. One problem
 * can carry several tags, so tag totals may exceed the unique problem count.
 */
export function TopicBreakdownCard({
  problems,
  selectedTags,
  onToggle,
}: TopicBreakdownProps) {
  const [range, setRange] = useState<PracticeRangeId>("30d");

  const filtered = useMemo(() => {
    const days = RANGE_DAYS[range];
    if (days == null) return problems;
    const startKey = dayKeyOffset(todayDayKey(), days - 1);
    return problems.filter(
      (p) => dayKeyFromUnix(p.firstSolvedAt) >= startKey,
    );
  }, [problems, range]);

  const top = useMemo(
    () => distinctTags(filtered).slice(0, MAX_TAGS),
    [filtered],
  );
  const max = top.length > 0 ? top[0].count : 0;

  return (
    <Card className="flex h-full flex-col gap-5 p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tags className="size-4 text-steel" aria-hidden />
            Topic breakdown
          </CardTitle>
          <CardDescription>
            Click a tag to filter the recent solved problems
          </CardDescription>
        </CardHeader>
        <RangeTabs value={range} onChange={setRange} label="Topic window" />
      </div>

      {top.length === 0 ? (
        <div className="flex h-40 flex-1 items-center justify-center text-[14px] text-steel">
          No tags in this window yet.
        </div>
      ) : (
        <ul className="flex flex-col gap-0.5">
          {top.map(({ tag, count }) => {
            const active = selectedTags.includes(tag);
            return (
              <li key={tag}>
                <button
                  type="button"
                  onClick={() => onToggle(tag)}
                  aria-pressed={active}
                  className={`flex w-full items-center gap-3 rounded-[10px] px-3 py-1.5 text-left transition-colors duration-150 ${
                    active ? "bg-paper-frost" : "hover:bg-studio-mist"
                  }`}
                >
                  <span
                    className={`flex w-40 shrink-0 items-center gap-1.5 truncate text-[13px] leading-[1.2] ${
                      active ? "font-medium text-ink" : "text-slate"
                    }`}
                  >
                    {active ? (
                      <Check
                        className="size-3.5 shrink-0 text-pricing-blue"
                        aria-hidden
                      />
                    ) : null}
                    <span className="truncate">{tag}</span>
                  </span>
                  <span className="relative h-1.5 flex-1 overflow-hidden rounded-pill bg-control-gray">
                    <span
                      className="absolute inset-y-0 left-0 rounded-pill bg-apple-blue"
                      style={{
                        width: `${
                          max > 0 ? Math.max(4, (count / max) * 100) : 0
                        }%`,
                      }}
                    />
                  </span>
                  <span className="numeric w-10 text-right text-[13px] text-slate">
                    {formatNumber(count)}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-auto text-[12px] leading-4 text-steel">
        A problem can have multiple tags, so counts can exceed the number of
        unique problems solved.
      </p>
    </Card>
  );
}
