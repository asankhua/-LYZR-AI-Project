"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Group, Panel, Separator } from "react-resizable-panels";
import { Share } from "lucide-react";
import { toast } from "sonner";
import { setMode } from "@/lib/actions";
import { postEvents } from "@/lib/client-stream";
import type { AgentRun, AgentSpec, ChangePlan, Mode, PlanDoc, PreviewError, Project, ProjectFile, ProjectMessage, Stage, StreamEvent } from "@/lib/types";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AgentBoard } from "@/components/workspace/agent-board";
import { CodePane } from "@/components/workspace/code-pane";
import { PlanView } from "@/components/workspace/plan-view";
import { PreviewPane } from "@/components/workspace/preview-pane";
import { DatabasePane } from "@/components/workspace/database-pane";
import { EnvPane } from "@/components/workspace/env-pane";
import { GitPanel } from "@/components/workspace/git-panel";
import { ShareModal } from "@/components/workspace/share-modal";
import { TerminalPane } from "@/components/workspace/terminal-pane";
import { CommandPalette, ShortcutsDialog, usePaletteState } from "@/components/shell/command-palette";
import { useUiStore, type WorkspaceTab } from "@/stores/ui";
import { useChatStore } from "@/stores/chat";
import { useRuntimeStore } from "@/stores/runtime";

const planJobs = new Map<string, Promise<void>>();

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
  initialPlan,
  initialAgents,
  initialFiles,
  guest,
  codeOnly,
}: {
  project: Project;
  messages: ProjectMessage[];
  mode: Mode;
  initialPlan: PlanDoc | null;
  initialAgents: AgentSpec[];
  initialFiles: ProjectFile[];
  guest: boolean;
  codeOnly: boolean;
}) {
  const router = useRouter();
  const tabs = mode === "developer" ? developerTabs : simpleTabs;
  const activeTab = useUiStore((state) => state.activeTab);
  const setTab = useUiStore((state) => state.setTab);
  const events = useChatStore((state) => state.events);
  const push = useChatStore((state) => state.push);
  const streaming = useChatStore((state) => state.streaming);
  const setStreaming = useChatStore((state) => state.setStreaming);
  const [stage, setStage] = useState(project.stage);
  const [plan, setPlan] = useState<PlanDoc | null>(initialPlan);
  const [agents, setAgents] = useState(initialAgents);
  const [files, setFiles] = useState(initialFiles);
  const [runs, setRuns] = useState<AgentRun[]>([]);
  const [composer, setComposer] = useState("");
  const [composerMode, setComposerMode] = useState<"plan" | "build" | "test">("plan");
  const [tokens, setTokens] = useState(0);
  const [changePlan, setChangePlan] = useState<ChangePlan | null>(null);
  const [autoFix, setAutoFix] = useState(true);
  const [exhausted, setExhausted] = useState<string | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [tourOpen, setTourOpen] = useState(false);
  const [artifactsOpen, setArtifactsOpen] = useState(false);
  const [mobilePane, setMobilePane] = useState<"chat" | "canvas">("chat");
  const palette = usePaletteState();
  const abortRef = useRef<AbortController | null>(null);
  const chatRef = useRef<HTMLDivElement>(null);
  const designed = useRef(false);
  const attempts = useRef(0);
  const lastError = useRef<PreviewError | null>(null);
  const latestSnapshot = useRef<string | null>(null);
  const fixTimer = useRef<number | null>(null);
  const healthyTimer = useRef<number | null>(null);
  const runtimeStatus = useRuntimeStore((state) => state.status);

  function scheduleFix(error: PreviewError) {
    lastError.current = error;
    if (fixTimer.current) window.clearTimeout(fixTimer.current);
    if (healthyTimer.current) window.clearTimeout(healthyTimer.current);
    fixTimer.current = window.setTimeout(() => {
      if (!autoFix || attempts.current >= 3) {
        setExhausted(error.message);
        push({ type: "step", label: "Couldn't fix automatically", status: "error" });
        return;
      }
      attempts.current += 1;
      push({ type: "step", label: `Fixing 1 error (attempt ${attempts.current}/3)`, status: "running" });
      void run("/api/generate", {
        projectId: project.id,
        mode: "fix",
        errors: [{ kind: error.kind, message: error.message, file: error.file, line: error.line, at: error.at }],
      });
    }, 1500);
  }

  function onPreviewReady() {
    if (!latestSnapshot.current) return;
    if (healthyTimer.current) window.clearTimeout(healthyTimer.current);
    const snapshotId = latestSnapshot.current;
    healthyTimer.current = window.setTimeout(() => {
      void fetch(`/api/projects/${project.id}/healthy`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ snapshotId }),
      });
      attempts.current = 0;
      setExhausted(null);
    }, 3000);
  }

  async function restoreHealthy() {
    const listed = await fetch(`/api/projects/${project.id}/snapshots`);
    if (!listed.ok) return;
    const body = (await listed.json()) as { snapshots: { id: string; healthy: boolean }[] };
    const target = [...body.snapshots].reverse().find((item) => item.healthy) ?? body.snapshots.at(-1);
    if (!target) return;
    const response = await fetch(`/api/projects/${project.id}/restore`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ snapshotId: target.id }),
    });
    if (!response.ok) return;
    const filesResponse = await fetch(`/api/projects/${project.id}/files`);
    if (!filesResponse.ok) return;
    const filesBody = (await filesResponse.json()) as { files: ProjectFile[] };
    setFiles(filesBody.files);
    attempts.current = 0;
    setExhausted(null);
  }

  function onEvent(event: StreamEvent) {
    push(event);
    if (event.type === "usage") setTokens((value) => value + event.inputTokens + event.outputTokens);
    if (event.type === "agent") setAgents((current) => [...current.filter((agent) => agent.id !== event.spec.id), event.spec]);
    if (event.type === "file-op") {
      setTab("preview");
      setMobilePane("canvas");
      setFiles((current) => {
        const next = { projectId: project.id, path: event.path, content: event.content ?? "", sha: "" };
        const index = current.findIndex((file) => file.path === event.path);
        if (index === -1) return [...current, next];
        const copy = current.slice();
        copy[index] = { ...copy[index], content: event.content ?? copy[index].content };
        return copy;
      });
    }
    if (event.type === "snapshot") latestSnapshot.current = event.snapshotId;
    if (event.type === "error" && event.message === "Could not fix this error." && lastError.current) {
      scheduleFix(lastError.current);
    }
    if (event.type === "change-plan") setChangePlan(event.plan);
    if (event.type === "trace") {
      setRuns((current) => [event.run, ...current]);
      setAgents((current) => current.map((agent) => (agent.name === event.run.agentName ? { ...agent, testPassed: true } : agent)));
    }
  }

  async function run(url: string, body: unknown) {
    const controller = new AbortController();
    abortRef.current = controller;
    setStreaming(true);
    try {
      await postEvents(url, body, onEvent, controller.signal);
      useChatStore.getState().settleRunning("done");
    } catch (error) {
      useChatStore.getState().settleRunning("error");
      if (!controller.signal.aborted) push({ type: "error", message: "The stream stopped." });
      else push({ type: "step", label: "Stopped", status: "done" });
      void error;
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  }

  useEffect(() => {
    if (stage !== "plan" || initialPlan) return;
    let cancelled = false;
    const load = async () => {
      let job = planJobs.get(project.id);
      if (!job) {
        job = run("/api/plan", { projectId: project.id, kind: "draft" }).then(() => undefined);
        planJobs.set(project.id, job);
      }
      await job;
      if (cancelled) return;
      const response = await fetch(`/api/projects/${project.id}/plan`);
      if (!response.ok || cancelled) return;
      const body = (await response.json()) as { doc: PlanDoc | null };
      if (body.doc) setPlan(body.doc);
      planJobs.delete(project.id);
    };
    void load();
    return () => {
      cancelled = true;
    };
    // The draft starts once for a new project. `run` is the stream helper from this render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id, initialPlan, stage]);

  useEffect(() => {
    if (stage === "agents" && agents.length === 0 && !designed.current) {
      designed.current = true;
      setTab("agents");
      void run("/api/agents/design", { projectId: project.id });
    }
    // `run` closes over the latest stream handler. Listing it would restart the design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stage, agents.length, project.id, setTab]);

  useEffect(() => {
    useChatStore.getState().reset();
  }, [project.id]);

  useEffect(() => {
    const node = chatRef.current;
    if (!node) return;
    node.scrollTop = node.scrollHeight;
  }, [events.length, streaming, messages.length]);

  useEffect(() => {
    if (project.stage === "agents") setTab("agents");
    else if (project.stage === "plan") setTab("plan");
    else setTab("preview");
  }, [project.id, project.stage, setTab]);

  useEffect(() => {
    if (localStorage.getItem(`architect-tour-${project.id}`)) return;
    // Show the tour after mount so the server render stays empty.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setTourOpen(true);
  }, [project.id]);

  const reached = stages.indexOf(stage);
  const primary =
    streaming
      ? { label: "Stop", disabled: false, action: () => abortRef.current?.abort() }
      : stage === "plan"
        ? { label: "Approve plan", disabled: !plan, action: () => void approve("/api/plan/approve", "agents") }
        : stage === "agents"
          ? { label: "Approve agents", disabled: agents.length === 0, action: () => void approve("/api/agents/approve", "build") }
          : files.length > 0
            ? { label: "Deploy", disabled: false, action: () => router.push(`/p/${project.id}/deploy`) }
            : {
                label: "Build app",
                disabled: false,
                action: () => {
                  setTab("preview");
                  setMobilePane("canvas");
                  void run("/api/generate", { projectId: project.id, mode: "build" });
                },
              };

  const regenerateLabel = stage === "plan" ? "Regenerate plan" : stage === "agents" ? "Regenerate design" : "Regenerate build";

  async function regenerate() {
    if (streaming) return;
    if (stage === "plan") {
      planJobs.delete(project.id);
      setTab("plan");
      await run("/api/plan", { projectId: project.id, kind: "draft" });
      const response = await fetch(`/api/projects/${project.id}/plan`);
      if (!response.ok) return;
      const body = (await response.json()) as { doc: PlanDoc | null };
      if (body.doc) setPlan(body.doc);
      return;
    }
    if (stage === "agents") {
      designed.current = true;
      setAgents([]);
      setTab("agents");
      await run("/api/agents/design", { projectId: project.id });
      return;
    }
    setFiles([]);
    setTab("preview");
    setMobilePane("canvas");
    await run("/api/generate", { projectId: project.id, mode: "build" });
  }

  async function approve(url: string, next: Stage) {
    const response = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ projectId: project.id }),
    });
    if (!response.ok) {
      toast("That step is not ready yet.");
      return;
    }
    setStage(next);
    router.refresh();
  }

  async function send() {
    const text = composer.trim();
    if (!text || streaming) return;
    setComposer("");
    if (composerMode === "test") {
      const agent = agents.find((item) => item.managedBy === null) ?? agents[0];
      if (!agent) {
        toast("Approve the plan so the agents can be tested.");
        return;
      }
      await run("/api/agents/run", { projectId: project.id, agentName: agent.name, input: text });
      return;
    }
    if (composerMode === "plan") {
      await run("/api/plan", { projectId: project.id, kind: plan ? "change" : "draft", instruction: text });
      return;
    }
    await run("/api/generate", { projectId: project.id, mode: files.length ? "change" : "build", message: text });
  }

  const liveLabel = [...events].reverse().find((event) => event.type === "step" && event.status === "running");

  return (
    <div className="flex h-full flex-col bg-bg">
      <header className="flex h-14 shrink-0 items-center gap-3 border-b border-border bg-surface px-4">
        <a href="/home" aria-label="Back to Home" className="flex items-center gap-2">
          <Logo withWord />
        </a>
        <span className="truncate text-sm font-medium">{project.name}</span>
        <nav aria-label="Project stage" className="mx-auto flex items-center gap-2 text-sm">
          {stages.map((item, index) => {
            const clickable = index <= reached;
            return (
              <span key={item} className="flex items-center gap-2">
                {index > 0 ? <span className="text-border">·</span> : null}
                <button
                  type="button"
                  disabled={!clickable}
                  className={cn("capitalize", item === stage ? "font-medium text-accent" : "text-text-muted")}
                  onClick={() => setTab(item === "ship" || item === "build" ? "preview" : item)}
                >
                  {item[0].toUpperCase() + item.slice(1)}
                </button>
              </span>
            );
          })}
        </nav>
        <form action={setMode}>
          <input type="hidden" name="mode" value={mode === "simple" ? "developer" : "simple"} />
          <button type="submit" className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium" aria-label={mode === "simple" ? "Switch to Developer mode" : "Switch to Simple mode"}>
            {mode === "simple" ? "Simple" : "Developer"}
          </button>
        </form>
        <a href={`/p/${project.id}/history`} className="text-sm text-text-muted">
          History
        </a>
        <Button type="button" variant="outline" size="sm" onClick={() => setShareOpen(true)}>
          <Share className="size-4" /> Share
        </Button>
        <Button type="button" variant="outline" size="sm" disabled={streaming} onClick={() => void regenerate()}>
          {regenerateLabel}
        </Button>
        <Button type="button" size="sm" disabled={primary.disabled} onClick={primary.action}>
          {primary.label}
        </Button>
      </header>
      <div className="flex h-10 shrink-0 items-center justify-center gap-2 border-b border-border md:hidden">
        <button type="button" className={cn("rounded-full px-3 py-1 text-sm", mobilePane === "chat" ? "bg-accent-soft text-accent" : "text-text-muted")} onClick={() => setMobilePane("chat")}>
          Chat
        </button>
        <button type="button" className={cn("rounded-full px-3 py-1 text-sm", mobilePane === "canvas" ? "bg-accent-soft text-accent" : "text-text-muted")} onClick={() => setMobilePane("canvas")}>
          Preview
        </button>
      </div>
      {tourOpen ? (
        <p className="flex items-center justify-between gap-3 border-b border-border bg-accent-soft px-4 py-2 text-sm">
          Approve the plan to design the agents. You can dismiss this tour.
          <button
            type="button"
            className="font-medium"
            onClick={() => {
              localStorage.setItem(`architect-tour-${project.id}`, "1");
              setTourOpen(false);
            }}
          >
            Dismiss
          </button>
        </p>
      ) : null}

      <Group id="workspace" orientation="horizontal" className="min-h-0 flex-1">
        <Panel id="chat" defaultSize={380} minSize={280} className={cn("border-r border-border bg-surface", mobilePane === "canvas" && "max-md:hidden")}>
          <div className="flex h-full flex-col">
            <div ref={chatRef} className="flex-1 space-y-3 overflow-auto p-4" aria-live="polite">
              {messages.map((message) => (
                <article key={message.id} className="rounded-md border border-border bg-surface-2 p-3 text-sm">
                  <p className="mb-1 text-xs text-text-muted">{message.role === "user" ? "You" : "Architect"}</p>
                  <p>{message.content}</p>
                </article>
              ))}
              {events.map((event, index) => (
                <EventCard key={`${event.type}-${index}`} event={event} />
              ))}
              {exhausted ? (
                <article className="rounded-md border border-border p-3 text-sm">
                  <h3 className="font-medium">Couldn&apos;t fix automatically</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button type="button" variant="outline" size="sm" onClick={() => { attempts.current = 0; setExhausted(null); if (lastError.current) scheduleFix(lastError.current); }}>
                      Try again
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => setShowDetails((value) => !value)}>
                      Show details
                    </Button>
                    <Button type="button" variant="outline" size="sm" onClick={() => void restoreHealthy()}>
                      Restore last good version
                    </Button>
                  </div>
                  {showDetails ? <p className="mt-2 text-text-muted">{exhausted}</p> : null}
                </article>
              ) : null}
              {changePlan ? (
                <article className="rounded-md border border-border p-3 text-sm">
                  <h3 className="font-medium">Change plan</h3>
                  <p className="mt-1">{changePlan.summary}</p>
                  <p className="mt-2 font-mono text-xs text-text-muted">{changePlan.files.join(", ")}</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => void run("/api/generate", { projectId: project.id, mode: "change", message: changePlan.summary })}
                  >
                    Apply plan
                  </Button>
                </article>
              ) : null}
              {streaming && !events.some((event) => event.type === "step" && event.status === "running") ? (
                <p className="flex items-center gap-2 text-sm text-text-muted">
                  <TypingDots />
                  Working
                </p>
              ) : null}
              <span className="sr-only">{liveLabel && liveLabel.type === "step" ? liveLabel.label : streaming ? "Working" : ""}</span>
            </div>
            <form
              className="border-t border-border p-3"
              onSubmit={(event) => {
                event.preventDefault();
                void send();
              }}
            >
              <div className="mb-2 flex flex-wrap gap-2 text-xs">
                {(["plan", "build", "test"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    className={cn("rounded-full px-2 py-1 capitalize", composerMode === item ? "bg-accent-soft text-accent" : "text-text-muted")}
                    onClick={() => setComposerMode(item)}
                  >
                    {item}
                  </button>
                ))}
                <button type="button" className="rounded-full px-2 py-1 text-text-muted" onClick={() => toast("Attachments arrive in a later phase.")}>
                  Attach
                </button>
                <button type="button" className="rounded-full px-2 py-1 text-text-muted" onClick={() => toast("Voice input arrives in a later phase.")}>
                  Voice
                </button>
              </div>
              <textarea
                rows={2}
                value={composer}
                onChange={(event) => setComposer(event.target.value)}
                placeholder={
                  composerMode === "plan"
                    ? "Describe a change to the plan…"
                    : composerMode === "test"
                      ? "Ask an agent to try a sample…"
                      : "Describe a change to build…"
                }
                className="w-full resize-none rounded-sm border border-border px-3 py-2 text-sm outline-none"
              />
              <div className="mt-2 flex justify-end">
                <Button
                  type={streaming ? "button" : "submit"}
                  variant="outline"
                  size="sm"
                  disabled={!streaming && !composer.trim()}
                  onClick={streaming ? () => abortRef.current?.abort() : undefined}
                >
                  {streaming ? "Stop" : "Send"}
                </Button>
              </div>
            </form>
          </div>
        </Panel>
        <Separator className="w-1 bg-border" />
        <Panel id="canvas" minSize={400} className={cn("min-w-0", mobilePane === "chat" && "max-md:hidden")}>
          {codeOnly ? (
            <p className="border-b border-border bg-surface-2 px-4 py-2 text-sm">
              This project is not a Vite app, so the preview is off. You can still edit the code.
            </p>
          ) : null}
          <Tabs value={activeTab} onValueChange={(value) => setTab(value as WorkspaceTab)} className="flex h-full flex-col">
            <TabsList>
              {tabs.map((tab) => (
                <TabsTrigger key={tab.id} value={tab.id}>
                  {tab.label}
                </TabsTrigger>
              ))}
            </TabsList>
            <TabsContent value="plan" className="overflow-auto p-6">
              <PlanView
                plan={plan}
                onChange={setPlan}
                onCommit={(next) => {
                  setPlan(next);
                  void fetch("/api/plan", {
                    method: "POST",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ projectId: project.id, kind: "save", doc: next }),
                  });
                }}
              />
            </TabsContent>
            <TabsContent value="agents" className="min-h-0 p-3">
              <button type="button" className="mb-3 text-sm text-accent" onClick={() => toast("Open in Lyzr Studio is a preview link.")}>
                Open in Lyzr Studio
              </button>
              <AgentBoard
                agents={agents}
                runs={runs}
                onSave={async (agent) => {
                  await fetch(`/api/agents/${agent.id}?projectId=${project.id}`, {
                    method: "PUT",
                    headers: { "content-type": "application/json" },
                    body: JSON.stringify({ spec: agent, position: agent.position }),
                  });
                  setAgents((current) => current.map((item) => (item.id === agent.id ? agent : item)));
                }}
                onTest={async (agent, input) => {
                  await run("/api/agents/run", { projectId: project.id, agentName: agent.name, input });
                }}
              />
            </TabsContent>
            <TabsContent value="code" className="min-h-0">
              <CodePane
                key={files[0]?.path ?? "empty"}
                projectId={project.id}
                files={files}
                onSaved={(next) => {
                  setFiles(next);
                }}
              />
            </TabsContent>
            <TabsContent value="preview" className="flex min-h-0 flex-col">
              {files.length === 0 ? (
                <div className="p-6">
                  <EmptyCopy title="The app shows up here" body="Build app writes the code on the left and the screen on the right." />
                </div>
              ) : (
                <div className="flex h-full min-h-0 flex-col md:flex-row">
                  <aside className="max-h-52 shrink-0 overflow-auto border-b border-border md:max-h-none md:w-80 md:border-b-0 md:border-r">
                    <p className="sticky top-0 border-b border-border bg-surface px-3 py-2 text-xs font-medium">Generated code</p>
                    {files.map((file) => (
                      <article key={file.path} className="border-b border-border">
                        <p className="px-3 py-2 font-mono text-xs">{file.path}</p>
                        <pre className="max-h-40 overflow-auto px-3 pb-3 font-mono text-xs text-text-muted">{file.content}</pre>
                      </article>
                    ))}
                  </aside>
                  <div className="min-h-0 min-w-0 flex-1">
                    <PreviewPane
                      files={files}
                      plan={plan}
                      active={activeTab === "preview"}
                      autoFix={autoFix}
                      onAutoFix={setAutoFix}
                      onPick={(src) => {
                        setComposerMode("build");
                        setComposer(`In \`${src}\`: `);
                      }}
                      onError={scheduleFix}
                      onReady={onPreviewReady}
                    />
                  </div>
                </div>
              )}
            </TabsContent>
            <TabsContent value="terminal" className="min-h-0 p-0">
              <TerminalPane />
            </TabsContent>
            <TabsContent value="database" className="min-h-0 overflow-auto">
              <DatabasePane plan={plan} files={files} />
            </TabsContent>
            <TabsContent value="env" className="min-h-0 overflow-auto">
              <EnvPane projectId={project.id} />
            </TabsContent>
            <TabsContent value="git" className="overflow-auto p-6">
              <GitPanel projectId={project.id} guest={guest} />
            </TabsContent>
          </Tabs>
        </Panel>
      </Group>
      <footer className="flex h-8 shrink-0 items-center justify-between border-t border-border bg-surface px-4 font-mono text-xs text-text-muted">
        <span>
          {streaming
            ? "Working"
            : runtimeStatus === "ready"
              ? "Preview ready"
              : runtimeStatus === "installing"
                ? files.length > 0
                  ? "Preview ready"
                  : "Installing packages"
                : runtimeStatus === "error"
                  ? "Preview error"
                  : stage === "plan"
                    ? "Waiting for approval"
                    : "Idle"}
        </span>
        <span>{files.length === 0 ? "No snapshot yet" : `${files.length} files`}</span>
        <span>{tokens} tokens</span>
        <button type="button" className="text-text-muted" onClick={() => setArtifactsOpen(true)}>
          Artifacts
        </button>
      </footer>
      <ShareModal open={shareOpen} onOpenChange={setShareOpen} projectName={project.name} />
      <CommandPalette
        open={palette.open}
        onOpenChange={palette.setOpen}
        projects={[{ id: project.id, name: project.name }]}
      />
      <ShortcutsDialog open={palette.help} onOpenChange={palette.setHelp} />
      {artifactsOpen ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-text/40">
          <div role="dialog" aria-labelledby="artifacts-title" className="w-full max-w-md rounded-lg border border-border bg-surface p-6">
            <h2 id="artifacts-title" className="text-lg font-medium">Artifacts</h2>
            <ul className="mt-3 text-sm text-text-muted">
              <li>Trip brief.pdf — mocked</li>
              <li>Cost split slides — mocked</li>
            </ul>
            <button type="button" className="mt-4 text-sm text-accent" onClick={() => setArtifactsOpen(false)}>
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex items-end gap-1" aria-hidden>
      <style>{`@keyframes chat-dot { 0%, 80%, 100% { transform: translateY(0); opacity: 0.35; } 40% { transform: translateY(-3px); opacity: 1; } } @media (prefers-reduced-motion: reduce) { .chat-dot { animation: none !important; opacity: 0.8; } }`}</style>
      {[0, 1, 2].map((index) => (
        <span
          key={index}
          className="chat-dot rounded-full bg-current"
          style={{ width: 5, height: 5, animation: "chat-dot 0.9s ease-in-out infinite", animationDelay: `${index * 140}ms` }}
        />
      ))}
    </span>
  );
}

function EventCard({ event }: { event: StreamEvent }) {
  if (event.type === "step") {
    const running = event.status === "running";
    const stopped = event.status === "error";
    return (
      <p className={cn("flex items-center gap-2 text-sm", stopped ? "text-danger" : "text-text-muted")}>
        {running ? <TypingDots /> : <span aria-hidden>{stopped ? "!" : "✓"}</span>}
        <span>{running ? event.label : stopped ? `Stopped · ${event.label}` : `Done · ${event.label}`}</span>
      </p>
    );
  }
  if (event.type === "plan-section") {
    return (
      <article className="rounded-md border border-border p-3 text-sm">
        <h3 className="font-medium">{event.title}</h3>
        <p className="mt-1 whitespace-pre-wrap text-text-muted">{event.body}</p>
      </article>
    );
  }
  if (event.type === "file-op") {
    const code = event.content ?? "";
    return (
      <article className="rounded-md border border-border bg-surface">
        <p className="border-b border-border px-3 py-2 font-mono text-xs">{event.op === "create" ? "Created" : "Updated"} {event.path}</p>
        {code ? (
          <pre className="max-h-48 overflow-auto px-3 py-2 font-mono text-xs text-text-muted">{code}</pre>
        ) : null}
      </article>
    );
  }
  if (event.type === "agent") {
    return <p className="text-sm">Agent {event.spec.name} added.</p>;
  }
  if (event.type === "error") return <p className="text-sm text-danger">{event.message}</p>;
  if (event.type === "text") return <p className="text-sm">{event.text}</p>;
  return null;
}

function EmptyCopy({ title, body }: { title: string; body: string }) {
  return (
    <div className="mx-auto max-w-lg rounded-md border border-dashed border-border p-8 text-center">
      <h2 className="text-base font-medium">{title}</h2>
      <p className="mt-2 text-sm text-text-muted">{body}</p>
    </div>
  );
}
