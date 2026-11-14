import { Clock3, TriangleAlert } from "lucide-react";

import { formatAge } from "@/lib/utils";

/**
 * Freshness indicator — always tells the user how old the served data is.
 * When upstream fetch failed and cached data was served, an explicit
 * "cached" warning is shown instead of silently presenting stale numbers.
 */
export function FreshnessBar({
  ageMs,
  stale,
}: {
  ageMs: number;
  stale: boolean;
}) {
  return (
    <div className="flex items-center justify-end gap-2 text-[12px] leading-4 tracking-[-0.12px]">
      {stale ? (
        <span className="inline-flex items-center gap-1.5 font-semibold text-launch-orange">
          <TriangleAlert className="size-3.5" aria-hidden />
          Showing cached data — Codeforces is currently unreachable
        </span>
      ) : (
        <span className="inline-flex items-center gap-1.5 text-slate">
          <Clock3 className="size-3.5 text-steel" aria-hidden />
          Data from {formatAge(ageMs)}
        </span>
      )}
    </div>
  );
}
