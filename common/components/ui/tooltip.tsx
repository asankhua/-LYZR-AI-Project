"use client";

import * as TooltipPrimitive from "@radix-ui/react-tooltip";
import type { ComponentProps } from "react";

export const TooltipProvider = TooltipPrimitive.Provider;
export const Tooltip = TooltipPrimitive.Root;
export const TooltipTrigger = TooltipPrimitive.Trigger;

export function TooltipContent({
  className,
  side = "right",
  ...props
}: ComponentProps<typeof TooltipPrimitive.Content>) {
  return (
    <TooltipPrimitive.Portal>
      <TooltipPrimitive.Content
        side={side}
        sideOffset={8}
        className={`z-50 rounded-sm bg-text px-2 py-1 text-xs text-surface ${className ?? ""}`}
        {...props}
      />
    </TooltipPrimitive.Portal>
  );
}
