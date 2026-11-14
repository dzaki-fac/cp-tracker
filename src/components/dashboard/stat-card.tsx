import type { LucideIcon } from "lucide-react";

import { Card } from "@/components/ui/card";
import { cn, formatNumber } from "@/lib/utils";

interface StatCardProps {
  label: string;
  value: number | null;
  icon: LucideIcon;
  /** Optional quiet caption under the value (e.g. current month name). */
  caption?: string;
  /** Render % suffix for rates. */
  suffix?: string;
}

/**
 * Overview statistic card. A `null` value (e.g. acceptance rate with zero
 * submissions) renders as "—" instead of faking a zero.
 */
export function StatCard({
  label,
  value,
  icon: Icon,
  caption,
  suffix = "",
}: StatCardProps) {
  return (
    <Card className="flex flex-col gap-4 p-6 transition-colors duration-200 hover:shadow-subtle-steel">
      <div className="flex items-center justify-between gap-2">
        <span className="text-[14px] leading-[1.29] text-slate">{label}</span>
        <Icon className="size-4 shrink-0 text-steel" aria-hidden />
      </div>
      <div className="flex flex-col gap-0.5">
        <span
          className={cn(
            "font-display numeric text-[28px] leading-[1.05] font-semibold text-ink",
            value == null && "text-steel",
          )}
        >
          {value == null ? "—" : formatNumber(value)}
          {value == null ? "" : suffix}
        </span>
        {caption ? (
          <span className="text-[12px] leading-4 text-steel">{caption}</span>
        ) : null}
      </div>
    </Card>
  );
}
