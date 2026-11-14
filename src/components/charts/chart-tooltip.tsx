"use client";

import type { ReactNode } from "react";

/** Shared Apple-quiet tooltip frame used by all dashboard charts. */
export function ChartTooltipFrame({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-[10px] bg-gallery-white px-3 py-2 text-[12px] leading-4 tracking-[-0.12px] text-ink ring-1 ring-hairline-silver shadow-[0_4px_16px_rgb(0_0_0/0.08)]">
      {children}
    </div>
  );
}

export function ChartTooltipLabel({ children }: { children: ReactNode }) {
  return <div className="mb-0.5 text-steel">{children}</div>;
}

export function ChartTooltipValue({ children }: { children: ReactNode }) {
  return <div className="numeric font-medium">{children}</div>;
}

/** Structural props Recharts passes to a custom tooltip `content`. */
export interface ChartTooltipProps {
  active?: boolean;
  payload?: Array<{ value?: number | string; payload?: unknown }>;
  label?: unknown;
}
