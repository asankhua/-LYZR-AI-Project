"use client";

import * as Dropdown from "@radix-ui/react-dropdown-menu";
import type { ComponentProps } from "react";
import { cn } from "@/lib/utils";

export const DropdownMenu = Dropdown.Root;
export const DropdownMenuTrigger = Dropdown.Trigger;

export function DropdownMenuContent({
  className,
  ...props
}: ComponentProps<typeof Dropdown.Content>) {
  return (
    <Dropdown.Portal>
      <Dropdown.Content
        sideOffset={6}
        className={cn(
          "z-50 min-w-48 rounded-md border border-border bg-surface p-1 shadow-card",
          className,
        )}
        {...props}
      />
    </Dropdown.Portal>
  );
}

export function DropdownMenuItem({ className, ...props }: ComponentProps<typeof Dropdown.Item>) {
  return (
    <Dropdown.Item
      className={cn(
        "cursor-pointer rounded-sm px-2 py-1.5 text-sm outline-none data-[highlighted]:bg-surface-2",
        className,
      )}
      {...props}
    />
  );
}
