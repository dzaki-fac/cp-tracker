/**
 * Codeforces REST API service (server-side only).
 *
 * Responsibilities:
 * - HTTP transport with timeouts, retries and Codeforces envelope validation.
 * - Pagination of the submissions endpoint so statistics cover the complete
 *   available history.
 * - A process-level snapshot cache that (a) protects the Codeforces API from
 *   excessive requests and (b) lets the site keep working — with a clear
 *   staleness flag — when Codeforces is temporarily unavailable.
 */

import {
  API_TIMEOUT_MS,
  CODEFORCES_API_BASE,
  SUBMISSIONS_PAGE_SIZE,
} from "@/lib/config";
import type {
  CodeforcesEnvelope,
  CodeforcesRatingChange,
  CodeforcesSubmission,
  CodeforcesUserInfo,
} from "@/lib/codeforces/types";

/** Error thrown when the Codeforces API cannot be reached or returns a failure. */
export class CodeforcesApiError extends Error {
  readonly status: number;

  constructor(message: string, status = 502) {
    super(message);
    this.name = "CodeforcesApiError";
    this.status = status;
  }
}

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/** Snapshot cache keyed by handle, keeping the last good payload + timestamp. */
type Snapshot = { data: unknown; fetchedAt: number };
const snapshotCache = new Map<string, Snapshot>();

/** Serialize requests per endpoint so we never burst the API (1 req / ~600ms). */
const inflight: Record<string, Promise<unknown>> = {};
let lastRequestAt = 0;

async function paceRequests(): Promise<void> {
  const minGapMs = 600;
  const wait = lastRequestAt + minGapMs - Date.now();
  if (wait > 0) await sleep(wait);
  lastRequestAt = Date.now();
}

async function fetchEnvelope<T>(path: string): Promise<T> {
  const url = `${CODEFORCES_API_BASE}/${path}`;

  for (let attempt = 0; attempt <= 2; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);
    try {
      await paceRequests();
      const response = await fetch(url, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
        cache: "no-store",
      });

      if (response.status === 429) {
        throw new CodeforcesApiError(
          "Codeforces API rate limit exceeded.",
          429,
        );
      }
      if (!response.ok) {
        throw new CodeforcesApiError(
          `Codeforces API responded with HTTP ${response.status}.`,
          response.status >= 500 ? 503 : 502,
        );
      }

      const envelope = (await response.json()) as CodeforcesEnvelope<T>;
      if (envelope.status !== "OK" || envelope.result === undefined) {
        throw new CodeforcesApiError(
          envelope.comment ?? "Codeforces API returned a failed response.",
          502,
        );
      }
      return envelope.result;
    } catch (error) {
      const isAbort =
        error instanceof DOMException && error.name === "AbortError";
      const isRetryable =
        isAbort ||
        (error instanceof CodeforcesApiError &&
          (error.status === 429 || error.status === 502 || error.status === 503)) ||
        error instanceof TypeError; // network-level failure
      if (!isRetryable || attempt === 2) {
        if (error instanceof CodeforcesApiError) throw error;
        throw new CodeforcesApiError(
          isAbort
            ? "Codeforces API request timed out."
            : "Could not reach the Codeforces API.",
          504,
        );
      }
      await sleep(1000 * (attempt + 1)); // linear back-off before retry
    } finally {
      clearTimeout(timer);
    }
  }

  /* Unreachable — the loop either returns or throws. */
  throw new CodeforcesApiError("Codeforces API request failed.");
}

export async function fetchUserInfo(handle: string): Promise<CodeforcesUserInfo> {
  const users = await fetchEnvelope<CodeforcesUserInfo[]>(
    `user.info?handles=${encodeURIComponent(handle)}&checkHistoricHandles=false`,
  );
  const user = users[0];
  if (!user) {
    throw new CodeforcesApiError(`Codeforces handle "${handle}" not found.`, 404);
  }
  return user;
}

export async function fetchRatingHistory(
  handle: string,
): Promise<CodeforcesRatingChange[]> {
  return fetchEnvelope<CodeforcesRatingChange[]>(
    `user.rating?handle=${encodeURIComponent(handle)}`,
  );
}

/**
 * Fetch the complete submission history by walking the paginated endpoint.
 * The API supports `from`/`count`; we page until a short page is returned.
 */
export async function fetchAllSubmissions(
  handle: string,
): Promise<CodeforcesSubmission[]> {
  const all: CodeforcesSubmission[] = [];
  const handleParam = encodeURIComponent(handle);

  for (let from = 1; ; from += SUBMISSIONS_PAGE_SIZE) {
    const page = await fetchEnvelope<CodeforcesSubmission[]>(
      `user.status?handle=${handleParam}&from=${from}&count=${SUBMISSIONS_PAGE_SIZE}`,
    );

    if (!Array.isArray(page) || page.length === 0) break;
    all.push(...page);
    if (page.length < SUBMISSIONS_PAGE_SIZE) break;
  }

  // The API returns newest first; normalize to oldest first for downstream math.
  return all.reverse();
}

/**
 * Fetch every upstream resource for a handle and return a combined snapshot.
 *
 * On upstream failure, the last good snapshot (if any) is served with
 * `stale: true` so the site stays usable during Codeforces outages.
 */
export async function fetchPlatformSnapshot<T>(
  handle: string,
  aggregate: (parts: {
    user: CodeforcesUserInfo;
    ratingHistory: CodeforcesRatingChange[];
    submissions: CodeforcesSubmission[];
  }) => T,
): Promise<{ data: T; fetchedAt: number; stale: boolean }> {
  const cached = inflight[handle] as
    | Promise<{ data: T; fetchedAt: number; stale: boolean }>
    | undefined;
  if (cached) return cached;

  const promise = (async () => {
    try {
      const [user, ratingHistory, submissions] = await Promise.all([
        fetchUserInfo(handle),
        fetchRatingHistory(handle).catch(() => [] as CodeforcesRatingChange[]),
        fetchAllSubmissions(handle),
      ]);

      const data = aggregate({ user, ratingHistory, submissions });
      const fetchedAt = Date.now();
      snapshotCache.set(handle, { data, fetchedAt });
      return { data, fetchedAt, stale: false };
    } catch (error) {
      const snapshot = snapshotCache.get(handle);
      if (snapshot) {
        return {
          data: snapshot.data as T,
          fetchedAt: snapshot.fetchedAt,
          stale: true,
        };
      }
      throw error;
    }
  })().finally(() => {
    delete inflight[handle];
  });

  inflight[handle] = promise;
  return promise;
}

/** Drop the cached snapshot for a handle (used by the manual refresh action). */
export function invalidateSnapshot(handle: string): void {
  snapshotCache.delete(handle);
}
