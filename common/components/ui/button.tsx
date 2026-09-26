import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import type { ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-sm text-sm font-medium transition-colors disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        primary: "bg-accent text-white hover:bg-accent/90",
        outline: "border border-border bg-surface text-text hover:bg-surface-2",
        ghost: "text-text-muted hover:bg-surface-2 hover:text-text",
        destructive: "bg-danger text-white hover:bg-danger/90",
      },
      size: {
        sm: "h-8 px-3",
        md: "h-9 px-3.5",
        icon: "size-9",
      },
    },
    defaultVariants: { variant: "primary", size: "md" },
  },
);

export function Button({
  className,
  variant,
  size,
  asChild = false,
  type,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> &
  VariantProps<typeof buttonVariants> & { asChild?: boolean }) {
  const classNames = cn(buttonVariants({ variant, size }), className);
  if (asChild) return <Slot className={classNames} {...props} />;
  return <button type={type ?? "button"} className={classNames} {...props} />;
}
