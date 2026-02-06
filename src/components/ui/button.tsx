import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-2xl text-sm font-semibold ring-offset-background transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 active:scale-[0.97]",
  {
    variants: {
      variant: {
        default:
          "backdrop-blur-xl bg-gradient-to-br from-primary/90 to-primary/70 text-primary-foreground border border-white/20 shadow-[0_4px_16px_hsl(var(--primary)/0.3),inset_0_1px_0_hsl(255_255%_255%/0.2)] hover:shadow-[0_8px_24px_hsl(var(--primary)/0.4),inset_0_1px_0_hsl(255_255%_255%/0.25)] hover:scale-[1.02]",
        destructive:
          "backdrop-blur-xl bg-gradient-to-br from-destructive/90 to-destructive/70 text-destructive-foreground border border-white/20 shadow-[0_4px_16px_hsl(var(--destructive)/0.3)]",
        outline:
          "backdrop-blur-xl border border-white/20 bg-card/30 hover:bg-card/50 hover:border-white/30",
        secondary:
          "backdrop-blur-xl bg-gradient-to-br from-secondary/80 to-secondary/60 text-secondary-foreground border border-white/15 shadow-sm hover:from-secondary/90 hover:to-secondary/70",
        ghost: "hover:backdrop-blur-xl hover:bg-card/40 hover:border hover:border-white/10",
        link: "text-primary underline-offset-4 hover:underline",
        premium:
          "backdrop-blur-xl bg-gradient-to-r from-primary via-primary-glow to-primary text-primary-foreground border border-white/25 shadow-[0_4px_20px_hsl(var(--primary)/0.4),inset_0_2px_0_hsl(255_255%_255%/0.25)] hover:shadow-[0_8px_32px_hsl(var(--primary)/0.5)] hover:scale-[1.03]",
        glass:
          "backdrop-blur-2xl bg-white/10 text-foreground border border-white/20 shadow-[0_4px_16px_hsl(var(--foreground)/0.08),inset_0_1px_0_hsl(255_255%_255%/0.15)] hover:bg-white/15 hover:border-white/30",
      },
      size: {
        default: "h-11 px-5 py-2",
        sm: "h-9 rounded-xl px-4",
        lg: "h-14 rounded-2xl px-8 text-base",
        icon: "h-11 w-11",
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