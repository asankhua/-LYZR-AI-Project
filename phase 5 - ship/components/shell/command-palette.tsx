"use client";

import { Command } from "cmdk";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

const navigate = [
  { href: "/home", label: "Home" },
  { href: "/templates", label: "Templates" },
  { href: "/marketplace", label: "Marketplace" },
  { href: "/import", label: "Import" },
  { href: "/usage", label: "Usage" },
  { href: "/settings", label: "Settings" },
  { href: "/cli", label: "API and CLI" },
];

export function CommandPalette({
  open,
  onOpenChange,
  projects,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: { id: string; name: string }[];
}) {
  const router = useRouter();
  function go(href: string) {
    onOpenChange(false);
    if (href.startsWith("/p/")) {
      window.location.assign(href);
      return;
    }
    router.push(href);
  }
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="p-0">
        <DialogTitle className="sr-only">Search</DialogTitle>
        <Command label="Search projects and commands" className="p-2">
          <Command.Input
            placeholder="Search projects, templates, commands"
            className="h-10 w-full bg-transparent px-2 text-sm outline-none"
          />
          <Command.List className="max-h-72 overflow-auto pt-2">
            <Command.Empty className="px-2 py-4 text-sm text-text-muted">No matches.</Command.Empty>
            <Command.Group heading="Navigate" className="text-xs text-text-muted">
              {navigate.map((item) => (
                <Command.Item
                  key={item.href}
                  value={item.label}
                  onSelect={() => go(item.href)}
                  className="cursor-pointer rounded-sm px-2 py-2 text-sm text-text data-[selected=true]:bg-surface-2"
                >
                  {item.label}
                </Command.Item>
              ))}
            </Command.Group>
            <Command.Group heading="Projects" className="text-xs text-text-muted">
              {projects.map((project) => (
                <Command.Item
                  key={project.id}
                  value={project.name}
                  onSelect={() => go(`/p/${project.id}`)}
                  className="cursor-pointer rounded-sm px-2 py-2 text-sm text-text data-[selected=true]:bg-surface-2"
                >
                  {project.name}
                </Command.Item>
              ))}
            </Command.Group>
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

export function useCommandShortcut(onOpen: () => void, onHelp: () => void) {
  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      const meta = event.metaKey || event.ctrlKey;
      if (meta && event.key.toLowerCase() === "k") {
        event.preventDefault();
        onOpen();
      }
      if (event.key === "?" && !meta && !(event.target instanceof HTMLInputElement) && !(event.target instanceof HTMLTextAreaElement)) {
        event.preventDefault();
        onHelp();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onHelp, onOpen]);
}

export function ShortcutsDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const rows = [
    ["⌘K", "Command palette"],
    ["⌘↵", "Send the prompt"],
    ["⌘S", "Save the open file"],
    ["⌘B", "Toggle the chat"],
    ["⌘⇧D", "Switch mode"],
    ["?", "This sheet"],
    ["Esc", "Close a dialog"],
  ];
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogTitle>Keyboard shortcuts</DialogTitle>
        <ul className="mt-4 flex flex-col gap-2">
          {rows.map(([keys, label]) => (
            <li key={keys} className="flex items-center justify-between text-sm">
              <span>{label}</span>
              <span className="font-mono text-xs text-text-muted">{keys}</span>
            </li>
          ))}
        </ul>
      </DialogContent>
    </Dialog>
  );
}

export function usePaletteState() {
  const [open, setOpen] = useState(false);
  const [help, setHelp] = useState(false);
  useCommandShortcut(() => setOpen(true), () => setHelp(true));
  return { open, setOpen, help, setHelp };
}
