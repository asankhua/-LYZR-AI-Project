import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Input({ className, ...props }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        "h-9 w-full rounded-sm border border-border bg-surface px-3 text-sm text-text placeholder:text-text-muted",
        className,
      )}
      {...props}
    />
  );
}
