import { Suspense } from "react";

import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import Dashboard from "@/components/dashboard/dashboard";
import { DashboardSkeleton } from "@/components/dashboard/dashboard-skeleton";

/**
 * The dashboard page streams the data-bound dashboard inside a Suspense
 * boundary: the static shell (header/footer/skeleton) renders immediately,
 * while the uncached Codeforces data resolves at request time.
 */
export default function Home() {
  return (
    <div className="flex min-h-screen flex-col bg-gallery-white">
      <SiteHeader />
      <main className="mx-auto w-full max-w-6xl flex-1 px-5 py-10 sm:px-6 lg:px-10 lg:py-14">
        <Suspense fallback={<DashboardSkeleton />}>
          <Dashboard />
        </Suspense>
      </main>
      <SiteFooter />
    </div>
  );
}
