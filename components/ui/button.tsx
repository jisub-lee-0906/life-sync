"use client";

import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-2xl border border-transparent text-sm font-semibold whitespace-nowrap transition-all duration-200 outline-none select-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 active:translate-y-px disabled:pointer-events-none disabled:opacity-45 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-[0_12px_28px_rgba(0,64,255,0.16)] hover:bg-primary/95 hover:shadow-[0_16px_30px_rgba(0,64,255,0.18)]",
        outline:
          "border-slate-200 bg-white text-slate-700 shadow-sm hover:border-slate-300 hover:bg-slate-50 hover:text-slate-900",
        secondary:
          "bg-slate-100 text-slate-700 shadow-sm hover:bg-slate-200 hover:text-slate-900",
        ghost: "text-slate-500 hover:bg-slate-100 hover:text-slate-800",
        destructive:
          "bg-red-50 text-red-600 shadow-sm hover:bg-red-100 hover:text-red-700",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "min-h-11 gap-1.5 px-4",
        xs: "min-h-8 gap-1 rounded-xl px-3 text-xs",
        sm: "min-h-9 gap-1 rounded-xl px-3 text-[0.82rem]",
        lg: "min-h-12 gap-2 px-5 text-[0.95rem]",
        icon: "size-11",
        "icon-xs": "size-8 rounded-xl [&_svg:not([class*='size-'])]:size-3",
        "icon-sm": "size-9 rounded-xl",
        "icon-lg": "size-12",
      },
    },
    defaultVariants: {
      size: "default",
      variant: "default",
    },
  },
);

function Button({
  className,
  size = "default",
  variant = "default",
  ...props
}: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ className, size, variant }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
