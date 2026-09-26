"use client";

import { Group, Panel, Separator } from "react-resizable-panels";
import { Share } from "lucide-react";
import { toast } from "sonner";
import { setMode } from "@/lib/actions";
import type { Mode, Project, ProjectMessage, Stage } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const stages: Stage[] = ["plan", "agents", "build", "ship"];

const simpleTabs = [
  { id: "preview", label: "Preview" },
  { id: "plan", label: "Plan" },
  { id: "agents", label: "Agents" },
];

const developerTabs = [
  ...simpleTabs,
  { id: "code", label: "Code" },
  { id: "terminal", label: "Terminal" },
  { id: "database", label: "Database" },
  { id: "env", label: "Env" },
  { id: "git", label: "Git" },
];

export function WorkspaceShell({
  project,
  messages,
  mode,
}: {
  project: Project;
  messages: ProjectMessage[];
  mode: Mode;
}) {
  const tabs = mode === "developer" ? developerTabs : simpleTabs;
  return (
    <div className="flex h-full flex-col bg-bg">
      <header className="flex h-14 shrink-0 items-center gap-4 border-b border-border bg-surface px-4">
        <a href="/home" aria-label="Back to Home" className="flex items-center gap-2">
          <Logo withWord />
        </a>
        <span className="text-sm font-medium">{project.name}</span>
        <nav aria-label="Project stage" className="mx-auto flex items-center gap-2 text-sm">
          {stages.map((stage, index) => {
            const reached = stages.indexOf(project.stage) >= index;
            const active = project.stage === stage;
            return (
              <span key={stage} className="flex items-center gap-2">
                {index > 0 ? <span className="text-border">·</span> : null}
                <span className={cn("capitalize", active ? "font-medium text-accent" : "text-text-muted", !reached && "opacity-60")}>
                  {stage === "ship" ? "Ship" : stage[0].toUpperCase() + stage.slice(1)}
                </span>
              </span>
            );
          })}
        </nav>
        <form action={setMode}>
          <input type="hidden" name="mode" value={mode === "simple" ? "developer" : "simple"} />
          <button
            type="submit"
            className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium"
            aria-label={mode === "simple" ? "Switch to Developer mode" : "Switch to Simple mode"}
          >
            {mode === "simple" ? "Simple" : "Developer"}
          </button>
        </form>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => toast("Sharing with teammates arrives in a later phase.")}
        >
          <Share className="size-4" /> Share
        </Button>
        <Button type="button" size="sm" disabled title="Available once the plan is ready">
          Approve plan
        </Button>
      </header>

      <Group id="workspace" orientation="horizontal" className="min-h-0 flex-1">
        <Panel id="chat" defaultSize={380} minSize={280} className="border-r border-border bg-surface">
          <div className="flex h-full flex-col">
            <div className="flex-1 space-y-3 overflow-auto p-4">
              {messages.map((message) => (
                <div key={message.id} className="rounded-md border border-border bg-surface-2 p-3 text-sm">
                  <p className="mb-1 text-xs text-text-muted">{message.role === "user" ? "You" : "Architect"}</p>
                  <p>{message.content}</p>
                </div>
              ))}
              <p className="text-sm text-text-muted">
                Architect will draft a plan from this prompt in the next phase. Nothing is generated yet.
              </p>
            </div>
            <form
              className="border-t border-border p-3"
              onSubmit={(event) => {
                event.preventDefault();
                toast("Chat starts once planning is switched on.");
              }}
            >
              <textarea
                rows={2}
                placeholder="Describe a change once the plan is ready…"
                className="w-full resize-none rounded-sm border border-border px-3 py-2 text-sm outline-none"
              />
            </form>
          </div>
        </Panel>
        <Separator className="w-1 bg-border" />
        <Panel id="canvas" minSize={400} className="min-w-0">
          <Tabs defaultValue="plan" className="flex h-full flex-col">
            <TabsList>
              {tabs.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            {tabs.map((tab) => (
              <TabsContent key={tab.id} value={tab.id} className="p-6">
                <EmptyTab id={tab.id} />
              </TabsContent>
            ))}
          </Tabs>
        </Panel>
      </Group>

      <footer className="flex h-8 shrink-0 items-center justify-between border-t border-border bg-surface px-4 font-mono text-xs text-text-muted">
        <span>Waiting to plan</span>
        <span>No snapshot yet</span>
        <span>0 tokens</span>
      </footer>
    </div>
  );
}

function EmptyTab({ id }: { id: string }) {
  const copy: Record<string, { title: string; body: string }> = {
    preview: {
      title: "Preview starts after the build",
      body: "Approve the plan and the agents, and the app will run here.",
    },
    plan: {
      title: "Your plan will appear here",
      body: "Architect writes the plan from your prompt, section by section. You approve it before any code is generated.",
    },
    agents: {
      title: "Agents are designed after you approve the plan",
      body: "The agent graph, tools and instructions show up in this tab.",
    },
    code: {
      title: "Code appears as the app is built",
      body: "The file tree and editor open here in Developer mode.",
    },
    terminal: {
      title: "Terminal is quiet",
      body: "Install and dev-server output will stream here.",
    },
    database: {
      title: "No collections yet",
      body: "The generated app's data shows up here after the first build.",
    },
    env: {
      title: "No environment variables",
      body: "Add keys for the generated app in a later phase.",
    },
    git: {
      title: "GitHub is not connected",
      body: "Connect GitHub to create a repo and keep this project in sync.",
    },
  };
  const item = copy[id] ?? copy.plan;
  return (
    <div className="mx-auto max-w-lg rounded-md border border-dashed border-border p-8 text-center">
      <h2 className="text-base font-medium">{item.title}</h2>
      <p className="mt-2 text-sm text-text-muted">{item.body}</p>
    </div>
  );
}
