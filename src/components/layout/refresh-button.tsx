"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";

import { refreshDashboard } from "@/app/actions";
import { Button } from "@/components/ui/button";

/**
 * Manual refresh control. Runs the server action (cache invalidation +
 * upstream refetch), then refreshes the route so server components re-render.
 */
export function RefreshButton({ label = "Refresh" }: { label?: string }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  const handleClick = () => {
    startTransition(async () => {
      await refreshDashboard();
      router.refresh();
    });
  };

  return (
    <Button
      variant="primary"
      size="sm"
      onClick={handleClick}
      disabled={isPending}
      aria-busy={isPending}
      aria-label="Refresh dashboard data"
    >
      <RefreshCw
        className={`size-3.5 ${isPending ? "animate-spin" : ""}`}
        aria-hidden
      />
      {isPending ? "Refreshing…" : label}
    </Button>
  );
}
