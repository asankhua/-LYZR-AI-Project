import { cva, type VariantProps } from "class-variance-authority";
import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
  {
    variants: {
      tone: {
        neutral: "bg-surface-2 text-text",
        success: "bg-[#e7f6ee] text-[#146c43] dark:bg-[#123528] dark:text-[#b6f0d2]",
        warning: "bg-[#fbf3dd] text-[#6b4c00] dark:bg-[#3a2e10] dark:text-[#f6d98a]",
        danger: "bg-[#fdeceb] text-[#8d241d] dark:bg-[#3a1614] dark:text-[#ffb4ae]",
      },
    },
    defaultVariants: { tone: "neutral" },
  },
);

export function Badge({
  className,
  tone,
  ...props
}: HTMLAttributes<HTMLSpanElement> & VariantProps<typeof badgeVariants>) {
  return <span className={cn(badgeVariants({ tone }), className)} {...props} />;
}
