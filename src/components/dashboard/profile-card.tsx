import { ArrowUpRight } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { PlatformAvatar } from "@/components/dashboard/platform-avatar";
import type { PlatformIdentity } from "@/types/platform";
import { formatNumber } from "@/lib/utils";

function formatMemberSince(unixSeconds: number): string {
  return new Intl.DateTimeFormat("en-US", {
    month: "long",
    year: "numeric",
  }).format(new Date(unixSeconds * 1000));
}

/**
 * Profile card — identity, rating summary and a link to the upstream profile.
 * Presentation only: all platform data arrives normalized via PlatformIdentity.
 */
export function ProfileCard({ profile }: { profile: PlatformIdentity }) {
  return (
    <Card className="flex flex-col gap-6 p-7 sm:flex-row sm:items-start">
      <PlatformAvatar
        src={profile.avatarUrl}
        handle={profile.handle}
        className="size-24"
      />

      <div className="flex min-w-0 flex-1 flex-col gap-3">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h2 className="font-display truncate text-[40px] leading-none font-semibold text-ink">
            {profile.handle}
          </h2>
          {profile.rankCurrent ? (
            <Badge variant="outline" className="mt-1.5 capitalize">
              {profile.rankCurrent}
            </Badge>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-x-5 gap-y-1.5 text-[14px] leading-[1.29] text-slate">
          {profile.ratingCurrent != null ? (
            <span className="numeric">
              <span className="text-steel">Current rating </span>
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
              <span className="font-medium text-ink">
                {formatNumber(profile.ratingMax)}
              </span>
            </span>
          ) : null}
          {profile.rankMax ? (
            <span>
              <span className="text-steel">Max rank </span>
              <span className="capitalize">{profile.rankMax}</span>
            </span>
          ) : null}
          {profile.memberSince ? (
            <span>
              <span className="text-steel">Member since </span>
              {formatMemberSince(profile.memberSince)}
            </span>
          ) : null}
        </div>

        <a
          href={profile.profileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 text-[14px] leading-[1.29] text-apple-blue transition-colors hover:underline underline-offset-2"
        >
          View profile on {profile.platform === "codeforces" ? "Codeforces" : profile.platform}
          <ArrowUpRight className="size-3.5" aria-hidden />
        </a>
      </div>
    </Card>
  );
}
