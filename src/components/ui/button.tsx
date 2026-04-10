import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center rounded-[14px] text-sm font-bold transition-all active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:pointer-events-none",
  {
    variants: {
      variant: {
        default:
          "bg-gradient-to-br from-accent to-[#9B7BFF] text-white shadow-[0_4px_20px_var(--accent-glow)]",
        secondary:
          "bg-surface text-text border border-border",
        danger:
          "bg-[#FF4D6A22] text-red border border-[#FF4D6A44]",
        success:
          "bg-[#22D37A22] text-green border border-[#22D37A44]",
        ghost:
          "bg-transparent border border-border text-muted hover:text-text",
        outline:
          "border border-border bg-transparent text-text",
      },
      size: {
        default: "h-[56px] w-full px-6 text-[15px]",
        sm: "h-9 px-4 text-sm",
        icon: "h-10 w-10 rounded-[10px]",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
