import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/**
 * Badge — Apple reference sets badge radius to 0: a quiet, squared label.
 */
const badgeVariants = cva(
  "inline-flex items-center gap-1 border border-transparent px-2 py-0.5 text-[12px] leading-4 tracking-[-0.12px] transition-colors",
  {
    variants: {
      variant: {
        default: "bg-studio-mist text-slate",
        outline: "bg-transparent ring-1 ring-inset ring-steel text-ink",
        subtle: "bg-paper-frost text-slate",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants>) {
  return (
    <span
      data-slot="badge"
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
