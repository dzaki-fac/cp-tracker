import * as React from "react";

import { cn } from "@/lib/utils";

/**
 * Input — 980px-radius field with a 1px steel outline, per the rounded search
 * control in the Apple style reference.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-9 w-full min-w-0 rounded-pill border border-steel bg-gallery-white px-4 py-1 text-[13px] leading-[1.2] text-ink transition-colors outline-none",
        "placeholder:text-steel",
        "hover:border-slate",
        "focus-visible:border-apple-blue focus-visible:ring-2 focus-visible:ring-apple-blue/25",
        "disabled:cursor-not-allowed disabled:bg-control-gray disabled:opacity-60",
        "aria-invalid:border-launch-orange",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
