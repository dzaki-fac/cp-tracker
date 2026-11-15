import { ArrowUpRight } from "lucide-react";

import { Card } from "@/components/ui/card";
import { PlatformAvatar } from "@/components/dashboard/platform-avatar";
import { getRankColorByName } from "@/lib/cf-rank";
import { formatNumber } from "@/lib/utils";
import type { PlatformIdentity } from "@/types/platform";

/**
 * Compact profile header — identity, rating summary and a link to the
 * upstream profile in a single quiet row, giving recent activity the visual
 * focus of the page. Rank labels are tinted with the Codeforces rank colors.
 */
export function ProfileCard({ profile }: { profile: PlatformIdentity }) {
  const currentRankColor = getRankColorByName(profile.rankCurrent);

  return (
    <Card className="flex items-center gap-4 px-5 py-4 sm:gap-5 sm:px-6">
      <PlatformAvatar
        src={profile.avatarUrl}
        handle={profile.handle}
        className="size-12 shrink-0 sm:size-14"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <div className="flex flex-wrap items-center gap-x-2.5 gap-y-0.5">
          <h2 className="font-display truncate text-[22px] leading-[1.2] font-semibold text-ink">
            {profile.handle}
          </h2>
          {profile.rankCurrent ? (
            <span
              className="text-[13px] leading-[1.2] font-medium capitalize"
              style={currentRankColor ? { color: currentRankColor } : undefined}
            >
              {profile.rankCurrent}
            </span>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-x-4 gap-y-0.5 text-[13px] leading-[1.35] text-slate">
          {profile.ratingCurrent != null ? (
            <span className="numeric">
              <span className="text-steel">Rating </span>
              <span className="font-medium text-ink">
                {formatNumber(profile.ratingCurrent)}
              </span>
            </span>
          ) : (
            <span>Unrated</span>
          )}
          {profile.ratingMax != null ? (
            <span className="numeric">
              <span className="text-steel">Max </span>
              {formatNumber(profile.ratingMax)}
            </span>
          ) : null}
          {profile.rankMax ? (
            <span className="hidden sm:inline">
              <span className="text-steel">Max rank </span>
              <span
                className="font-medium capitalize"
                style={
                  getRankColorByName(profile.rankMax)
                    ? { color: getRankColorByName(profile.rankMax) }
                    : undefined
                }
              >
                {profile.rankMax}
              </span>
            </span>
          ) : null}
          <a
            href={profile.profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-0.5 text-apple-blue transition-colors hover:underline underline-offset-2"
          >
            Codeforces profile
            <ArrowUpRight className="size-3.5" aria-hidden />
          </a>
        </div>
      </div>
    </Card>
  );
}
