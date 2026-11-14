import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton mirroring the dashboard layout: a white identity/overview
 * band followed by the full-bleed mist insights band.
 */
export function DashboardSkeleton() {
  return (
    <div>
      {/* Identity & overview band */}
      <section className="mx-auto flex w-full max-w-6xl flex-col gap-10 px-5 py-10 sm:px-6 lg:px-10 lg:py-14">
        <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
          <Card className="flex items-center gap-6 p-7 lg:col-span-2">
            <Skeleton className="size-24 rounded-[20px]" />
            <div className="flex flex-col gap-3">
              <Skeleton className="h-10 w-56" />
              <Skeleton className="h-4 w-72" />
              <Skeleton className="h-4 w-48" />
            </div>
          </Card>
          <Card className="flex flex-col gap-4 p-7">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-[168px] w-full rounded-[12px]" />
          </Card>
        </div>

        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="flex flex-col gap-4 p-6">
              <div className="flex items-center justify-between">
                <Skeleton className="h-4 w-28" />
                <Skeleton className="size-4 rounded-md" />
              </div>
              <Skeleton className="h-8 w-20" />
            </Card>
          ))}
        </div>
      </section>

      {/* Insights band */}
      <section className="w-full bg-studio-mist">
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-5 px-5 py-12 sm:px-6 lg:px-10">
          <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
            <Card className="flex flex-col gap-4 p-7">
              <Skeleton className="h-5 w-52" />
              <Skeleton className="h-80 w-full rounded-[12px]" />
            </Card>
            <Card className="flex flex-col gap-4 p-7">
              <Skeleton className="h-5 w-52" />
              <Skeleton className="h-80 w-full rounded-[12px]" />
            </Card>
          </div>
          <Card className="flex flex-col gap-4 p-7">
            <Skeleton className="h-5 w-52" />
            <Skeleton className="h-32 w-full rounded-[12px]" />
          </Card>
          <Card className="flex flex-col gap-4 p-7">
            <Skeleton className="h-5 w-48" />
            <div className="flex gap-3">
              <Skeleton className="h-9 w-64 rounded-pill" />
              <Skeleton className="h-9 w-36 rounded-pill" />
              <Skeleton className="h-9 w-36 rounded-pill" />
            </div>
            <div className="flex flex-col gap-2">
              {Array.from({ length: 8 }).map((_, i) => (
                <Skeleton key={i} className="h-11 w-full" />
              ))}
            </div>
          </Card>
        </div>
      </section>
    </div>
  );
}
