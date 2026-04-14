import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-[6px] px-[10px] py-[3px] text-[10px] font-bold tracking-[1px]",
  {
    variants: {
      variant: {
        active:
          "bg-[#5BAF7E22] text-green border border-[#5BAF7E44]",
        completed:
          "bg-[#8B80C022] text-accent border border-[#8B80C044]",
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
