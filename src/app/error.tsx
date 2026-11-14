"use client";

import { useEffect } from "react";
import { AlertCircle } from "lucide-react";

/**
 * Route-level error boundary (backstop). The dashboard itself handles
 * Codeforces failures gracefully; this catches anything unexpected.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4 bg-gallery-white px-6 text-center">
      <div className="flex size-12 items-center justify-center rounded-full bg-studio-mist">
        <AlertCircle className="size-6 text-launch-orange" aria-hidden />
      </div>
      <h1 className="font-display text-[28px] leading-[1.05] font-semibold text-ink">
        Something went wrong
      </h1>
      <p className="max-w-md text-[14px] leading-[1.29] text-slate">
        An unexpected error occurred while rendering the dashboard.
      </p>
      <button
        onClick={reset}
        className="inline-flex h-9 items-center rounded-pill bg-pricing-blue px-4 text-[12px] leading-4 tracking-[-0.12px] text-white transition-colors hover:bg-[#006edb]"
      >
        Try again
      </button>
    </main>
  );
}
