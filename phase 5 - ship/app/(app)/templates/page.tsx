"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { templates } from "@/lib/home/seed";

const categories = ["All", "Support", "Sales", "Ops"];

export default function TemplatesPage() {
  const [category, setCategory] = useState("All");
  const [pending, setPending] = useState("");
  const visible = templates.filter((template) => category === "All" || template.name.toLowerCase().includes(category.toLowerCase()) || category === "Ops");

  async function createFromTemplate(prompt: string, name: string) {
    setPending(name);
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt, template: "vite-react" }),
    });
    setPending("");
    if (!response.ok) {
      toast("Could not create the project. Try again.");
      return;
    }
    const body = (await response.json()) as { id: string };
    window.location.assign(`/p/${body.id}`);
  }

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="text-[32px] leading-10 font-medium">Templates</h1>
      <p className="mt-1 text-sm text-text-muted">Vite + React · start from a working shape.</p>
      <div className="mt-4 flex gap-2" role="tablist" aria-label="Template categories">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={category === item}
            onClick={() => setCategory(item)}
            className={`rounded-full px-3 py-1 text-sm ${category === item ? "bg-accent-soft text-accent" : "text-text-muted"}`}
          >
            {item}
          </button>
        ))}
      </div>
      <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {visible.map((template) => (
          <li key={template.name} className="rounded-md border border-border bg-surface p-4">
            <span className="mb-3 block h-16 rounded-sm bg-surface-2" aria-hidden />
            <h2 className="text-sm font-medium">{template.name}</h2>
            <p className="mt-1 font-mono text-[11px] text-text-muted">Vite + React · {template.agents} agents</p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="mt-3"
              disabled={pending === template.name}
              onClick={() => void createFromTemplate(template.prompt, template.name)}
            >
              Use template
            </Button>
          </li>
        ))}
      </ul>
    </div>
  );
}
