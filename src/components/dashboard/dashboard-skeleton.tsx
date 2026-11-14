import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

/**
 * Loading skeleton mirroring the dashboard layout: profile band, stat grid,
 * insight cards and the problems table.
 */
export function DashboardSkeleton() {
  return (
    <div className="flex flex-col gap-10">
      {/* Profile band */}
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

      {/* Stat grid */}
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

      {/* Charts */}
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
        <Skeleton className="h-5 w-64" />
        <Skeleton className="h-72 w-full rounded-[12px]" />
      </Card>

      {/* Problems table */}
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
  );
}
