"use client";

import { Bell, Search } from "lucide-react";
import { useState } from "react";
import { CommandPalette, ShortcutsDialog, usePaletteState } from "@/components/shell/command-palette";

const notices = [
  { title: "Build finished", body: "Travel Planner saved a new version." },
  { title: "Deploy ready", body: "A live URL is waiting on the deploy page." },
];

export function AppChrome({
  projects,
  children,
}: {
  projects: { id: string; name: string }[];
  children: React.ReactNode;
}) {
  const palette = usePaletteState();
  const [notes, setNotes] = useState(false);
  return (
    <>
      <header className="sticky top-0 z-20 flex h-14 items-center gap-4 border-b border-border bg-surface/90 px-6 backdrop-blur">
        <div className="mx-auto w-full max-w-xl">
          <button
            type="button"
            onClick={() => palette.setOpen(true)}
            className="flex h-9 w-full items-center gap-2 rounded-md border border-border bg-surface-2 px-3 text-sm text-text-muted"
          >
            <Search className="size-4" />
            <span>Search projects, templates, commands ⌘K</span>
          </button>
        </div>
        <div className="relative">
          <button
            type="button"
            aria-label="Notifications"
            aria-expanded={notes}
            onClick={() => setNotes((value) => !value)}
            className="flex size-9 items-center justify-center rounded-md text-text-muted hover:bg-surface-2"
          >
            <Bell className="size-5" />
          </button>
          {notes ? (
            <div className="absolute right-0 z-30 mt-2 w-72 rounded-md border border-border bg-surface p-3 shadow-card">
              <p className="text-sm font-medium">Notifications</p>
              <ul className="mt-2 flex flex-col gap-2">
                {notices.map((notice) => (
                  <li key={notice.title} className="text-sm">
                    <span className="font-medium">{notice.title}</span>
                    <span className="mt-0.5 block text-text-muted">{notice.body}</span>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </div>
      </header>
      <main>{children}</main>
      <CommandPalette open={palette.open} onOpenChange={palette.setOpen} projects={projects} />
      <ShortcutsDialog open={palette.help} onOpenChange={palette.setHelp} />
    </>
  );
}
