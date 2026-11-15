"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { ReactNode } from "react";

/**
 * Minimal Radix tooltip wrapper. The trigger child must be a single element
 * that accepts refs; give it `tabIndex` when it is not natively focusable.
 */
export function Hint({
  content,
  children,
}: {
  content: string;
  children: ReactNode;
}) {
  return (
    <TooltipPrimitive.Provider delayDuration={150}>
      <TooltipPrimitive.Root>
        <TooltipPrimitive.Trigger asChild>{children}</TooltipPrimitive.Trigger>
        <TooltipPrimitive.Portal>
          <TooltipPrimitive.Content
            side="top"
            sideOffset={6}
            className="z-50 max-w-64 rounded-[8px] bg-ink px-2.5 py-1.5 text-[12px] leading-4 tracking-[-0.12px] text-white shadow-[0_4px_16px_rgb(0_0_0/0.24)]"
          >
            {content}
          </TooltipPrimitive.Content>
        </TooltipPrimitive.Portal>
      </TooltipPrimitive.Root>
    </TooltipPrimitive.Provider>
  );
}
