"use client";

import { Mic, Plus } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { ideas, templates } from "@/lib/home/seed";
import type { Project } from "@/lib/types";
import { greetingFor } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function HomeScreen({ name, projects }: { name: string | null; projects: Project[] }) {
  const [prompt, setPrompt] = useState("");
  const [pending, setPending] = useState(false);

  async function create(text: string) {
    const value = text.trim();
    if (!value || pending) return;
    setPending(true);
    const response = await fetch("/api/projects", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ prompt: value }),
    });
    setPending(false);
    if (!response.ok) {
      toast("Could not create the project. Try again.");
      return;
    }
    const body = (await response.json()) as { id: string };
    // The project document must load with COOP/COEP (§9.2). A client-side route change would keep the Home document.
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.assign(`/p/${body.id}`);
  }

  return (
    <div className="mx-auto flex w-full max-w-[880px] flex-col gap-9 px-4 py-10">
      <header>
        <p className="text-sm text-text-muted">
          {greetingFor()}, {name ?? "there"}
        </p>
        <h1 className="mt-1 text-[40px] leading-[48px] font-medium tracking-tight">
          What do you want to build?
        </h1>
      </header>

      <section>
        <div className="rounded-md border border-border bg-surface p-3 shadow-card">
          <textarea
            value={prompt}
            onChange={(event) => setPrompt(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
                event.preventDefault();
                void create(prompt);
              }
            }}
            rows={3}
            placeholder="Describe your app, who it's for, and what a good result looks like…"
            className="w-full resize-none bg-transparent px-2 py-1 text-sm outline-none placeholder:text-text-muted"
          />
          <div className="mt-2 flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button type="button" variant="outline" size="icon" aria-label="Add to prompt">
                  <Plus className="size-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onSelect={() => toast("File attachments arrive in a later phase.")}>
                  Attach files
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => toast("Theme presets arrive in a later phase.")}>
                  Theme
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => toast("Adding existing agents arrives in a later phase.")}>
                  Add existing agents
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => toast("The prompt library arrives in a later phase.")}>
                  Prompt library
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button
              type="button"
              variant="outline"
              size="icon"
              aria-label="Voice prompt"
              onClick={() => toast("Voice prompts arrive in a later phase.")}
            >
              <Mic className="size-4" />
            </Button>
            <span className="rounded-full bg-surface-2 px-2 py-1 font-mono text-xs text-text-muted">
              Theme: Minimal
            </span>
            <Button
              type="button"
              className="ml-auto"
              disabled={pending || prompt.trim().length === 0}
              onClick={() => void create(prompt)}
            >
              {pending ? "Building…" : "Build"}
              <span className="font-mono text-[11px] opacity-80">⌘↵</span>
            </Button>
          </div>
        </div>
        <div className="mt-3 flex items-center justify-between text-sm">
          <div className="flex gap-4">
            <a href="/import" className="inline-flex items-center gap-1 text-text-muted hover:text-text">
              <GitHubMark /> Import from GitHub
            </a>
            <button
              type="button"
              className="text-text-muted hover:text-text"
              onClick={() => void create("A blank app I will describe as I go.")}
            >
              Start blank project
            </button>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium">
          Suggested for you <span className="font-normal text-text-muted">From the AI Consultant</span>
        </h2>
        <div className="mt-3 grid gap-3 md:grid-cols-3">
          {ideas.map((idea) => (
            <Card key={idea.title} className="flex flex-col gap-2 p-4">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-medium">{idea.title}</h3>
                <Badge tone="success">{idea.saved}</Badge>
              </div>
              <p className="text-sm text-text-muted">{idea.description}</p>
              <div className="mt-auto flex flex-col items-start gap-2 pt-2">
                <div className="flex flex-wrap gap-1">
                  {idea.chips.map((chip) => (
                    <span key={chip} className="rounded-full bg-surface-2 px-2 py-0.5 font-mono text-[11px]">
                      {chip}
                    </span>
                  ))}
                </div>
                <button
                  type="button"
                  className="text-sm font-medium text-accent"
                  onClick={() => setPrompt(idea.prompt)}
                >
                  Use template
                </button>
              </div>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-medium">Start from a template</h2>
          <a href="/templates" className="text-sm text-accent">
            View all templates
          </a>
        </div>
        <div className="mt-3 grid grid-cols-2 gap-3 md:grid-cols-5">
          {templates.map((template) => (
            <button
              key={template.name}
              type="button"
              onClick={() => void create(template.prompt)}
              className="rounded-md border border-border bg-surface p-3 text-left"
            >
              <span className="mb-3 block h-14 rounded-sm bg-surface-2" aria-hidden />
              <span className="block truncate text-sm font-medium">{template.name}</span>
              <span className="font-mono text-[11px] text-text-muted">{template.agents} agents</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-sm font-medium">Recent projects</h2>
        {projects.length === 0 ? (
          <Card className="mt-3 p-6">
            <h3 className="text-base font-medium">Your projects will appear here</h3>
            <p className="mt-1 text-sm text-text-muted">
              When you build your first app or pick a template, its stage and health show up here.
            </p>
            <ol className="mt-4 grid gap-3 sm:grid-cols-4">
              {["Plan", "Agents", "Build", "Ship"].map((step, index) => (
                <li key={step} className="rounded-md border border-border p-3">
                  <span className="font-mono text-xs text-text-muted">0{index + 1}</span>
                  <p className="mt-1 text-sm font-medium">{step}</p>
                </li>
              ))}
            </ol>
          </Card>
        ) : (
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            {projects.map((project) => (
              <a key={project.id} href={`/p/${project.id}`} className="rounded-md border border-border bg-surface p-4">
                <span className="mb-3 block h-16 rounded-sm bg-surface-2" aria-hidden />
                <span className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-medium">{project.name}</span>
                  <Badge tone={project.stage === "ship" ? "success" : "neutral"}>
                    {project.stage === "ship" ? "Live" : labelStage(project.stage)}
                  </Badge>
                </span>
                <span className="mt-1 block font-mono text-[11px] text-text-muted">
                  Stage {stageIndex(project.stage)} of 4 · Edited {relativeTime(project.updatedAt)}
                </span>
              </a>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function GitHubMark() {
  return (
    <svg viewBox="0 0 16 16" className="size-4" aria-hidden>
      <path
        fill="currentColor"
        d="M8 0C3.58 0 0 3.58 0 8a8 8 0 0 0 5.47 7.59c.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82a7.6 7.6 0 0 1 2-.27c.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8 8 0 0 0 16 8c0-4.42-3.58-8-8-8z"
      />
    </svg>
  );
}

function labelStage(stage: Project["stage"]) {
  if (stage === "plan") return "Plan";
  if (stage === "agents") return "Agents";
  if (stage === "build") return "Build";
  return "Ship";
}

function stageIndex(stage: Project["stage"]) {
  return { plan: 1, agents: 2, build: 3, ship: 4 }[stage];
}

function relativeTime(iso: string) {
  const minutes = Math.max(1, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 48) return `${hours}h ago`;
  return `${Math.round(hours / 24)}d ago`;
}
