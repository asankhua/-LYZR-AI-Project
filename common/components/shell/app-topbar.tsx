"use client";

import { Bell, Search } from "lucide-react";
import { toast } from "sonner";

export function AppTopBar() {
  return (
    <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-border bg-surface/90 px-6 backdrop-blur">
      <div className="mx-auto w-full max-w-xl">
        <button
          type="button"
          onClick={() => toast("Search arrives with the command palette.")}
          className="flex h-9 w-full items-center gap-2 rounded-md border border-border bg-surface-2 px-3 text-sm text-text-muted"
        >
          <Search className="size-4" />
          <span>Search projects, templates, commands ⌘K</span>
        </button>
      </div>
      <button
        type="button"
        aria-label="Notifications"
        onClick={() => toast("No new notifications.")}
        className="flex size-9 items-center justify-center rounded-md text-text-muted hover:bg-surface-2"
      >
        <Bell className="size-5" />
      </button>
    </header>
  );
}
