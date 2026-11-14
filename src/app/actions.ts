"use server";

import {
  getDashboardData,
  invalidateDashboardCache,
} from "@/lib/dashboard";

export interface RefreshResult {
  ok: boolean;
  /** True when upstream data could not be refreshed and cached data is shown. */
  stale: boolean;
}

/**
 * Manual refresh: drops the TTL cache, refetches upstream data, and lets the
 * client trigger a router refresh to re-render the dashboard.
 *
 * If Codeforces is unavailable, the snapshot cache keeps the dashboard usable
 * and reports `stale` so the UI can surface a freshness notice.
 */
export async function refreshDashboard(): Promise<RefreshResult> {
  invalidateDashboardCache();
  try {
    const { data } = await getDashboardData();
    return { ok: true, stale: data.stale };
  } catch {
    return { ok: false, stale: true };
  }
}
