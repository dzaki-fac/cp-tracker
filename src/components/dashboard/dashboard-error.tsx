import { AlertCircle, RefreshCw } from "lucide-react";

import { Card } from "@/components/ui/card";

/**
 * Graceful error state for the whole dashboard: shown when no cached data
 * exists at all (e.g. first load while Codeforces is unreachable). A retry
 * button re-runs the render, and the header's Refresh control also works.
 */
export function DashboardError({ message }: { message: string }) {
  return (
    <Card className="flex flex-col items-center gap-4 px-7 py-14 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-studio-mist">
        <AlertCircle className="size-6 text-launch-orange" aria-hidden />
      </div>
      <div className="flex flex-col gap-1.5">
        <h2 className="font-display text-[21px] leading-[1.05] font-semibold text-ink">
          Couldn&apos;t load dashboard data
        </h2>
        <p className="max-w-md text-[14px] leading-[1.29] text-slate">
          {message}
        </p>
        <p className="max-w-md text-[14px] leading-[1.29] text-steel">
          Check your connection and try again. If Codeforces is temporarily
          down, the dashboard will keep working with cached data once it has
          been fetched successfully at least once.
        </p>
      </div>
      <form action="/?retry=1" className="contents">
        <button
          type="submit"
          className="inline-flex h-9 items-center gap-1.5 rounded-pill bg-pricing-blue px-4 text-[12px] leading-4 tracking-[-0.12px] text-white transition-colors hover:bg-[#006edb]"
        >
          <RefreshCw className="size-3.5" aria-hidden />
          Try again
        </button>
      </form>
    </Card>
  );
}
