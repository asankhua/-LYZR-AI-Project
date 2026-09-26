import type { TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Textarea({ className, ...props }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cn(
        "w-full resize-none rounded-sm border border-border bg-surface px-3 py-2 text-sm text-text placeholder:text-text-muted",
        className,
      )}
      {...props}
    />
  );
}
