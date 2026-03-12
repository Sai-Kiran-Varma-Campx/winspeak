import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-[6px] px-[10px] py-[3px] text-[10px] font-bold tracking-[1px]",
  {
    variants: {
      variant: {
        active:
          "bg-[#22D37A22] text-green border border-[#22D37A44]",
        completed:
          "bg-[#7C5CFC22] text-accent border border-[#7C5CFC44]",
        locked:
          "bg-[#6B719422] text-muted border border-[#6B719444]",
        default:
          "bg-surface text-muted border border-border",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}

export { Badge, badgeVariants };
