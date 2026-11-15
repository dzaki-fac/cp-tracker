import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge Tailwind class names with shadcn/ui conventions. */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Format a number with thousands separators (e.g. 1,234). */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat("en-US").format(value);
}

/** "3 minutes ago" style label for an age in milliseconds. */
export function formatAge(ageMs: number): string {
  return formatRelativeTime(Date.now() - ageMs, Date.now());
}

/** Format a relative time between two timestamps. */
export function formatRelativeTime(timestampMs: number, nowMs: number): string {
  const diffSeconds = Math.max(0, Math.round((nowMs - timestampMs) / 1000));
  if (diffSeconds < 60) return "just now";
  const minutes = Math.floor(diffSeconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr${hours > 1 ? "s" : ""} ago`;
  const days = Math.floor(hours / 24);
  return `${days} day${days > 1 ? "s" : ""} ago`;
}

/** Format a date from a day key like "2026-11-15" without timezone drift. */
export function formatDayKey(dayKey: string): string {
  const [y, m, d] = dayKey.split("-").map(Number);
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(Date.UTC(y, m - 1, d)));
}

const MONTHS_SHORT = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
] as const;

/**
 * "Nice" Y-axis ticks from 0 up to a rounded maximum, using 1/2/5 steps so
 * charts never end on raw values like 294.
 */
export function niceTicks(max: number, targetTicks = 6): number[] {
  if (max <= 0) return [0, 1];
  const rough = max / Math.max(1, targetTicks);
  const magnitude = Math.pow(10, Math.floor(Math.log10(rough)));
  const step =
    [1, 2, 5, 10].map((m) => m * magnitude).find((s) => s >= rough) ??
    10 * magnitude;
  const top = Math.ceil(max / step) * step;
  const ticks: number[] = [];
  for (let value = 0; value <= top; value += step) ticks.push(value);
  return ticks;
}

/**
 * Evenly spaced, day-aligned X-axis ticks for a numeric time axis.
 *
 * - ≤ 10 days: a tick every 2 days (7d / 14d views).
 * - ≤ 70 days: a tick every 7 days (30d / 90d views).
 * - Longer spans: explicit first-of-month ticks ("tick bulanan eksplisit").
 * Always returns at least one tick.
 */
export function xAxisTicks(startMs: number, endMs: number): number[] {
  const DAY_MS = 86_400_000;
  const spanDays = Math.round((endMs - startMs) / DAY_MS);
  const ticks: number[] = [];

  if (spanDays <= 10) {
    for (let t = startMs; t <= endMs; t += 2 * DAY_MS) ticks.push(t);
  } else if (spanDays <= 70) {
    for (let t = startMs; t <= endMs; t += 7 * DAY_MS) ticks.push(t);
  } else {
    const cursor = new Date(startMs);
    cursor.setUTCDate(1);
    if (cursor.getTime() < startMs) cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    while (cursor.getTime() <= endMs) {
      ticks.push(cursor.getTime());
      cursor.setUTCMonth(cursor.getUTCMonth() + 1);
    }
  }

  if (ticks.length === 0) ticks.push(startMs);
  return ticks;
}

/**
 * Label for an X-axis tick from `xAxisTicks`. Month-boundary ticks (UTC day 1)
 * render as "Nov"; January and the first tick also show the year ("Jan 2026");
 * day ticks render as "Nov 15".
 */
export function formatAxisTick(ms: number, firstTickMs: number): string {
  const date = new Date(ms);
  const month = MONTHS_SHORT[date.getUTCMonth()];
  if (date.getUTCDate() === 1) {
    const showYear = date.getUTCMonth() === 0 || ms === firstTickMs;
    return showYear ? `${month} ${date.getUTCFullYear()}` : month;
  }
  return `${month} ${date.getUTCDate()}`;
}
