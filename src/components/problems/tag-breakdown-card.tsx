"use client";

import { useMemo } from "react";
import { Check, Tags } from "lucide-react";

import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { distinctTags } from "@/lib/statistics";
import { formatNumber } from "@/lib/utils";
import type { SolvedProblem } from "@/types/platform";

const MAX_TAGS = 10;

interface TagBreakdownCardProps {
  problems: SolvedProblem[];
  selectedTags: string[];
  onToggle: (tag: string) => void;
}

/**
 * Horizontal bar breakdown of the top tags by unique solved count.
 * Clicking a tag toggles it in the shared tag filter that also drives the
 * solved problems table below.
 */
export function TagBreakdownCard({
  problems,
  selectedTags,
  onToggle,
}: TagBreakdownCardProps) {
  const top = useMemo(
    () => distinctTags(problems).slice(0, MAX_TAGS),
    [problems],
  );
  const max = top.length > 0 ? top[0].count : 0;

  return (
    <Card className="flex flex-col gap-5 p-7">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Tags className="size-4 text-steel" aria-hidden />
          Top tags
        </CardTitle>
        <CardDescription>
          Click a tag to filter the solved problems table
        </CardDescription>
      </CardHeader>

      {top.length === 0 ? (
        <div className="flex h-40 items-center justify-center text-[14px] text-steel">
          No tags yet.
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
    </Card>
  );
}
