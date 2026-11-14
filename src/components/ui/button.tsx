import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-1.5 whitespace-nowrap rounded-pill font-text text-[12px] leading-4 font-normal tracking-[-0.12px] transition-colors duration-200 outline-none focus-visible:ring-2 focus-visible:ring-apple-blue/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        /** Filled conversion control — Pricing Blue pill (#0071e3). */
        primary: "bg-pricing-blue text-white hover:bg-[#006edb]",
        /** Outlined secondary control — transparent fill, 1px steel outline. */
        outline:
          "bg-transparent text-ink ring-1 ring-inset ring-steel hover:bg-studio-mist",
        /** Quiet tertiary control. */
        ghost: "bg-transparent text-slate hover:bg-studio-mist hover:text-ink",
        /** Inline blue text control. */
        link: "bg-transparent text-apple-blue hover:underline underline-offset-2 px-0",
      },
      size: {
        default: "h-9 px-4",
        sm: "h-8 px-3",
        icon: "h-9 w-9 p-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
