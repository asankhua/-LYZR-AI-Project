"use client";

import {
  BarChart3,
  Home,
  Settings,
  Store,
  Upload,
  LayoutTemplate,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { setMode, signOut } from "@/lib/actions";
import type { Mode } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

const links = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/templates", label: "Templates", icon: LayoutTemplate },
  { href: "/marketplace", label: "Marketplace", icon: Store },
  { href: "/import", label: "Import", icon: Upload },
  { href: "/usage", label: "Usage", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function AppSidebar({
  mode,
  name,
  email,
  guest = true,
}: {
  mode: Mode;
  name: string | null;
  email?: string | null;
  guest?: boolean;
}) {
  const pathname = usePathname();
  const [accountOpen, setAccountOpen] = useState(false);
  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-16 flex-col items-center justify-between border-r border-border bg-surface py-3 pb-14">
      <div className="flex flex-col items-center gap-3">
        <Link href="/home" aria-label="Architect home">
          <Logo />
        </Link>
        <nav className="flex flex-col items-center gap-1">
          {links.map((link) => {
            const Icon = link.icon;
            const active = pathname === link.href || pathname.startsWith(`${link.href}/`);
            return (
              <Tooltip key={link.href}>
                <TooltipTrigger asChild>
                  <Link
                    href={link.href}
                    aria-label={link.label}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex size-11 items-center justify-center rounded-md text-text-muted hover:bg-surface-2 hover:text-text",
                      active && "bg-accent-soft text-accent",
                    )}
                  >
                    <Icon className="size-5" />
                  </Link>
                </TooltipTrigger>
                <TooltipContent>{link.label}</TooltipContent>
              </Tooltip>
            );
          })}
        </nav>
      </div>
      <div className="flex flex-col items-center gap-3">
        <form action={setMode}>
          <input type="hidden" name="mode" value={mode === "simple" ? "developer" : "simple"} />
          <button
            type="submit"
            aria-label={mode === "simple" ? "Switch to Developer mode" : "Switch to Simple mode"}
            title={mode === "simple" ? "Simple mode" : "Developer mode"}
            className="flex h-6 w-11 items-center rounded-full bg-surface-2 px-0.5"
          >
            <span
              className={cn(
                "flex size-5 items-center justify-center rounded-full bg-accent text-[10px] font-semibold text-white",
                mode === "developer" && "ml-auto",
              )}
            >
              {mode === "simple" ? "S" : "D"}
            </span>
          </button>
        </form>
        <div className="relative">
          <button
            type="button"
            aria-expanded={accountOpen}
            aria-label={`Account menu for ${name ?? "you"}`}
            className="flex size-8 items-center justify-center rounded-full border border-border bg-surface-2 text-xs font-medium text-text"
            onClick={() => setAccountOpen((open) => !open)}
          >
            {(name ?? "G").slice(0, 1).toUpperCase()}
          </button>
          {accountOpen ? (
            <div className="absolute bottom-0 left-12 z-40 w-44 rounded-md border border-border bg-surface p-3 shadow-card">
              <p className="text-sm font-medium">{name ?? "Guest"}</p>
              <p className="mt-1 text-xs text-text-muted">{guest ? "Trying Architect" : email || "Signed in"}</p>
              <form action={signOut} className="mt-3">
                <button type="submit" className="text-sm text-accent">
                  Sign out
                </button>
              </form>
            </div>
          ) : null}
        </div>
      </div>
    </aside>
  );
}
