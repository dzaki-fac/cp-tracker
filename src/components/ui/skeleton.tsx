import * as React from "react";

import { cn } from "@/lib/utils";

/** Skeleton loading placeholder — quiet gray block with a gentle pulse. */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="skeleton"
      className={cn("skeleton", className)}
      {...props}
    />
  );
}

export { Skeleton };
