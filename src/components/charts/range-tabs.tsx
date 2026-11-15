"use client";

/** Identifiers shared by every time-filtered section. */
export type PracticeRangeId = "7d" | "30d" | "90d" | "all";

export const PRACTICE_RANGES: Array<{
  id: PracticeRangeId;
  label: string;
  days: number | null;
}> = [
  { id: "7d", label: "7 days", days: 7 },
  { id: "30d", label: "30 days", days: 30 },
  { id: "90d", label: "90 days", days: 90 },
  { id: "all", label: "All time", days: null },
];

/**
 * Segmented time-range control used by the difficulty distribution, topic
 * breakdown and progress chart. Quiet Apple pill style; `aria-selected`
 * keeps it accessible.
 */
export function RangeTabs({
  value,
  onChange,
  label = "Time range",
}: {
  value: PracticeRangeId;
  onChange: (id: PracticeRangeId) => void;
  label?: string;
}) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className="flex w-fit items-center gap-0.5 rounded-pill bg-studio-mist p-1"
    >
      {PRACTICE_RANGES.map((range) => (
        <button
          key={range.id}
          role="tab"
          aria-selected={value === range.id}
          onClick={() => onChange(range.id)}
          className={`rounded-pill px-3 py-1.5 text-[12px] leading-4 tracking-[-0.12px] transition-colors duration-200 ${
            value === range.id
              ? "bg-gallery-white font-medium text-ink shadow-subtle"
              : "text-slate hover:text-ink"
          }`}
        >
          {range.label}
        </button>
      ))}
    </div>
  );
}
