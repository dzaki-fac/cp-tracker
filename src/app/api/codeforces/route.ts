import { CodeforcesApiError } from "@/lib/codeforces/api";
import { getDashboardData } from "@/lib/dashboard";

/**
 * Read-only JSON endpoint exposing the same normalized dashboard payload the
 * UI consumes. Never exposes internal transport details — only the
 * platform-agnostic domain shape plus freshness metadata.
 */
export async function GET() {
  try {
    const { data, ageMs } = await getDashboardData();
    return Response.json(
      { ...data, ageMs },
      {
        headers: {
          "Cache-Control": "no-store",
        },
      },
    );
  } catch (error) {
    const status = error instanceof CodeforcesApiError ? error.status : 500;
    const message =
      error instanceof CodeforcesApiError
        ? error.message
        : "Failed to load dashboard data.";
    return Response.json(
      { error: message },
      {
        status,
        headers: { "Cache-Control": "no-store" },
      },
    );
  }
}
