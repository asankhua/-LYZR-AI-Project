"use client";

import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

export function SheetContent({
  className,
  ...props
}: ComponentProps<typeof DialogPrimitive.Content>) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-text/40" />
      <DialogPrimitive.Content
        className={cn(
          "fixed top-0 right-0 z-50 h-full w-[min(100%,24rem)] overflow-y-auto border-l border-border bg-surface p-6 shadow-card",
          className,
        )}
        {...props}
      />
    </DialogPrimitive.Portal>
  );
}
