"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { marketplaceApps } from "@/lib/marketplace/catalog";

export default function MarketplacePage() {
  const [pending, setPending] = useState("");

  async function clone(id: string) {
    setPending(id);
    const response = await fetch(`/api/marketplace/${id}/clone`, { method: "POST" });
    setPending("");
    if (!response.ok) {
      toast("Could not clone that app. Try again.");
      return;
    }
    const body = (await response.json()) as { projectId: string };
    window.location.assign(`/p/${body.projectId}`);
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="text-[32px] leading-10 font-medium">Marketplace</h1>
      <p className="mt-1 text-sm text-text-muted">Community apps. Cloning copies the template into a new project.</p>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {marketplaceApps.map((app) => (
          <li key={app.id} className="rounded-md border border-border bg-surface p-4">
            <h2 className="text-sm font-medium">{app.name}</h2>
            <p className="mt-1 text-sm text-text-muted">{app.description}</p>
            <p className="mt-2 font-mono text-[11px] text-text-muted">Vite + React · {app.agents} agents</p>
            <Button type="button" variant="outline" size="sm" className="mt-3" disabled={pending === app.id} onClick={() => void clone(app.id)}>
              Clone
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
