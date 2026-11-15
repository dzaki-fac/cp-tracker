/**
 * Centralized application configuration.
 *
 * The default handle (and any future per-platform handles) lives here so it can
 * be changed in one place, or overridden via environment variables.
 */

/** Default Codeforces handle used when no platform selection exists yet. */
export const DEFAULT_CODEFORCES_HANDLE =
  process.env.CODEFORCES_HANDLE ?? "zukozuno7";

/** IANA timezone used for all "day" bucketing (heatmap, monthly/yearly stats). */
export const DISPLAY_TIMEZONE = "Asia/Jakarta";

/** How long the dashboard's server-side cache is considered fresh (seconds). */
export const CACHE_TTL_SECONDS = Number(
  process.env.CODEFORCES_CACHE_TTL_SECONDS ?? 600,
);

/** Per-request timeout for outbound Codeforces API calls (ms). */
export const API_TIMEOUT_MS = Number(
  process.env.CODEFORCES_API_TIMEOUT_MS ?? 15_000,
);

/**
 * Maximum submissions requested per page from the Codeforces API.
 * Kept at 500 (well inside the documented limit) so a silent upstream
 * page-size cap can never cause skipped records; pagination advances by the
 * number of submissions actually received.
 */
export const SUBMISSIONS_PAGE_SIZE = 500;

/** Codeforces REST API base URL. */
export const CODEFORCES_API_BASE = "https://codeforces.com/api";
