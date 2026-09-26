"use client";

import { useEffect, useRef, useState } from "react";
import type { PlanDoc, PreviewError, ProjectFile } from "@/lib/types";
import { previewDocument, previewHasScreen } from "@/lib/runtime/preview-document";
import { bootPreview, syncPreviewFiles } from "@/lib/runtime/webcontainer";
import { useRuntimeStore } from "@/stores/runtime";
import { cn } from "@/lib/utils";

const widths = { desktop: "100%", tablet: "768px", mobile: "390px" } as const;

export function PreviewPane({
  files,
  plan,
  active,
  onPick,
  onError,
  onReady,
  autoFix,
  onAutoFix,
}: {
  files: ProjectFile[];
  plan: PlanDoc | null;
  active: boolean;
  onPick: (src: string) => void;
  onError: (error: PreviewError) => void;
  onReady: () => void;
  autoFix: boolean;
  onAutoFix: (on: boolean) => void;
}) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const started = useRef(false);
  const bootedSignature = useRef<string | null>(null);
  const filesRef = useRef(files);
  const onErrorRef = useRef(onError);
  const onReadyRef = useRef(onReady);
  const onPickRef = useRef(onPick);

  useEffect(() => {
    filesRef.current = files;
    onErrorRef.current = onError;
    onReadyRef.current = onReady;
    onPickRef.current = onPick;
  }, [files, onError, onReady, onPick]);
  const status = useRuntimeStore((state) => state.status);
  const previewUrl = useRuntimeStore((state) => state.previewUrl);
  const fallback = useRuntimeStore((state) => state.fallback);
  const setStatus = useRuntimeStore((state) => state.setStatus);
  const setPreviewUrl = useRuntimeStore((state) => state.setPreviewUrl);
  const setFallback = useRuntimeStore((state) => state.setFallback);
  const appendLog = useRuntimeStore((state) => state.appendLog);
  const [device, setDevice] = useState<keyof typeof widths>("desktop");
  const [consoleOpen, setConsoleOpen] = useState(false);
  const [consoleLines, setConsoleLines] = useState<string[]>([]);
  const [picking, setPicking] = useState(false);

  useEffect(() => {
    function onMessage(event: MessageEvent) {
      const data = event.data as { type?: string; message?: string; file?: string; src?: string; kind?: PreviewError["kind"]; line?: number };
      if (!data?.type?.startsWith("architect:")) return;
      const frame = iframeRef.current?.contentWindow;
      if (event.source !== window && event.source !== frame) return;
      if (data.type === "architect:pick" && data.src) onPickRef.current(data.src);
      if (data.type === "architect:console" && data.message) setConsoleLines((lines) => [...lines, data.message ?? ""].slice(-40));
      if (data.type === "architect:error" && data.message) {
        onErrorRef.current({
          kind: data.kind ?? "runtime",
          message: data.message,
          file: data.file,
          line: data.line,
          at: Date.now(),
        });
      }
    }
    window.addEventListener("message", onMessage);
    return () => window.removeEventListener("message", onMessage);
  }, []);

  useEffect(() => {
    iframeRef.current?.contentWindow?.postMessage({ type: "architect:picker", on: picking }, "*");
  }, [picking, previewUrl]);

  const signature = files.map((file) => `${file.path}:${file.content.length}:${file.content.slice(0, 24)}`).join("|");

  useEffect(() => {
    if (!active || filesRef.current.length === 0 || started.current) return;
    const payload = filesRef.current.map((file) => ({ path: file.path, content: file.content }));
    const hooks = {
      onStatus: setStatus,
      onLog: appendLog,
      onUrl: setPreviewUrl,
      onError: (message: string, file?: string) => onErrorRef.current({ kind: "build", message, file, at: Date.now() }),
    };
    if (!window.crossOriginIsolated) {
      started.current = true;
      bootedSignature.current = signature;
      setFallback(true);
      setStatus(previewHasScreen(payload) ? "ready" : "starting");
      return;
    }
    started.current = true;
    bootedSignature.current = signature;
    void bootPreview(payload, hooks).catch(() => {
      setStatus(previewHasScreen(payload) ? "ready" : "error");
    });
  }, [active, appendLog, files.length, setFallback, setPreviewUrl, setStatus, signature]);

  useEffect(() => {
    if (!started.current || status !== "ready") return;
    if (bootedSignature.current === signature) {
      onReadyRef.current();
      return;
    }
    bootedSignature.current = signature;
    const payload = filesRef.current.map((file) => ({ path: file.path, content: file.content }));
    if (fallback) {
      onReadyRef.current();
      return;
    }
    void syncPreviewFiles(payload, {
      onStatus: setStatus,
      onLog: appendLog,
      onUrl: setPreviewUrl,
      onError: (message, file) => onErrorRef.current({ kind: "build", message, file, at: Date.now() }),
    }).catch(() => setStatus("error"));
    onReadyRef.current();
  }, [appendLog, fallback, setPreviewUrl, setStatus, signature, status]);

  const screen = previewHasScreen(files);
  const prototype = previewDocument(files);
  const statusLabel = screen
    ? "Preview ready"
    : status === "installing"
      ? "Installing packages"
      : status === "error"
        ? "Preview error"
        : status === "idle"
          ? "Waiting for files"
          : "Starting preview";

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex flex-wrap items-center gap-2 border-b border-border px-3 py-2 text-xs">
        {(Object.keys(widths) as (keyof typeof widths)[]).map((item) => (
          <button key={item} type="button" className={cn("rounded-full px-2 py-1 capitalize", device === item ? "bg-accent-soft text-accent" : "text-text-muted")} onClick={() => setDevice(item)}>
            {item}
          </button>
        ))}
        <button type="button" className="rounded-full px-2 py-1 text-text-muted" onClick={() => iframeRef.current?.contentWindow?.location.reload()}>
          Refresh
        </button>
        <button
          type="button"
          className="rounded-full px-2 py-1 text-text-muted"
          onClick={() => {
            if (previewUrl) window.open(previewUrl, "_blank", "noopener");
          }}
        >
          Open
        </button>
        <button type="button" className={cn("rounded-full px-2 py-1", picking ? "bg-accent-soft text-accent" : "text-text-muted")} onClick={() => setPicking((value) => !value)}>
          Point
        </button>
        <button type="button" className="rounded-full px-2 py-1 text-text-muted" onClick={() => setConsoleOpen((value) => !value)}>
          Console
        </button>
        <button type="button" className={cn("rounded-full px-2 py-1", autoFix ? "bg-accent-soft text-accent" : "text-text-muted")} onClick={() => onAutoFix(!autoFix)}>
          {autoFix ? "Auto-fix on" : "Auto-fix off"}
        </button>
        <span className="ml-auto rounded-full bg-surface-2 px-2 py-1 text-text-muted">{fallback ? "Fallback preview" : statusLabel}</span>
      </div>
      {fallback ? (
        <p className="border-b border-border bg-surface-2 px-3 py-2 text-sm text-text-muted">
          This browser is using the fallback preview. The full preview needs cross-origin isolation, which current Chrome and Edge provide.
        </p>
      ) : null}
      <div className="relative min-h-0 flex-1 bg-surface-2">
        {!screen && status !== "ready" && !fallback ? <PreviewDraft plan={plan} statusLabel={statusLabel} /> : null}
        <div className="flex h-full justify-center">
          <iframe
            ref={iframeRef}
            title="App preview"
            srcDoc={prototype}
            className="h-full border-0 bg-surface"
            style={{ width: widths[device] }}
          />
        </div>
      </div>
      {consoleOpen ? (
        <pre className="max-h-36 overflow-auto border-t border-border bg-surface p-3 font-mono text-xs text-text-muted">
          {consoleLines.length === 0 ? "Console is empty." : consoleLines.join("\n")}
        </pre>
      ) : null}
    </div>
  );
}

type DraftKind = "hero" | "grid" | "products" | "quotes" | "footer" | "section";

function draftKind(name: string): DraftKind | "skip" {
  const value = name.toLowerCase();
  if (value === "header") return "skip";
  if (value.includes("hero") || value.includes("banner") || value.includes("prompt")) return "hero";
  if (value.includes("categor") || value.includes("grid") || value.includes("list")) return "grid";
  if (value.includes("product") || value.includes("feature") || value.includes("carousel") || value.includes("deal")) return "products";
  if (value.includes("testimonial") || value.includes("quote") || value.includes("review")) return "quotes";
  if (value.includes("footer")) return "footer";
  return "section";
}

function draftLabel(name: string) {
  return name.replace(/([a-z])([A-Z])/g, "$1 $2");
}

function PreviewDraft({ plan, statusLabel }: { plan: PlanDoc | null; statusLabel: string }) {
  const blocks = (plan?.screens ?? []).flatMap((screen) =>
    screen.components
      .map((name) => ({ name, purpose: screen.purpose, kind: draftKind(name) }))
      .filter((block): block is { name: string; purpose: string; kind: DraftKind } => block.kind !== "skip"),
  );
  if (blocks.length === 0) {
    for (const screen of plan?.screens ?? [{ name: "Home", purpose: "The first screen", components: [] as string[] }]) {
      blocks.push({ name: screen.name, purpose: screen.purpose, kind: "section" });
    }
  }
  return (
    <div className="absolute inset-0 z-10 overflow-auto bg-surface">
      <main className="mx-auto max-w-5xl px-6 py-8">
        <p className="text-xs text-text-muted">{statusLabel}</p>
        <header className="mt-4">
          <h1 className="text-3xl font-medium">{plan?.title ?? "Your app"}</h1>
        </header>
        {blocks.map((block) => {
          const title = draftLabel(block.name);
          if (block.kind === "hero") {
            return (
              <section key={block.name} className="py-6">
                <p className="text-xs font-medium uppercase tracking-widest text-accent">{title}</p>
                <h2 className="mt-2 text-4xl font-medium leading-tight">{title}</h2>
                <p className="mt-3 max-w-2xl text-base text-text-muted">{plan?.summary}</p>
                <a href="#featured" className="mt-4 inline-block rounded-md bg-accent px-3 py-2 text-sm text-white">
                  Get started
                </a>
              </section>
            );
          }
          if (block.kind === "grid") {
            const items = ["For you", "Top rated", "New today", "Staff picks"];
            return (
              <section key={block.name} className="border-t border-border py-6">
                <h2 className="text-xl font-medium">{title}</h2>
                <div className="mt-4 grid grid-cols-2 gap-3">
                  {items.map((item) => (
                    <article key={item} className="rounded-md border border-border bg-surface-2 p-4">
                      <h3 className="font-medium">{item}</h3>
                      <p className="mt-1 text-sm text-text-muted">{block.purpose}</p>
                    </article>
                  ))}
                </div>
              </section>
            );
          }
          if (block.kind === "products") {
            const items = ["Highlight", "Best seller", "Just in"];
            return (
              <section id="featured" key={block.name} className="border-t border-border py-6">
                <h2 className="text-xl font-medium">{title}</h2>
                <div className="mt-4 grid grid-cols-3 gap-3">
                  {items.map((item) => (
                    <article key={item} className="rounded-md border border-border bg-surface-2 p-4">
                      <div className="mb-3 h-16 rounded-md bg-accent-soft" />
                      <h3 className="font-medium">{item}</h3>
                    </article>
                  ))}
                </div>
              </section>
            );
          }
          if (block.kind === "quotes") {
            return (
              <section key={block.name} className="border-t border-border py-6">
                <h2 className="text-xl font-medium">{title}</h2>
                <blockquote className="mt-4 rounded-md border border-border bg-surface-2 p-4 text-sm text-text-muted">{block.purpose}</blockquote>
              </section>
            );
          }
          if (block.kind === "footer") {
            return (
              <footer key={block.name} className="border-t border-border py-6 text-sm text-text-muted">
                {title}
              </footer>
            );
          }
          return (
            <section key={block.name} className="border-t border-border py-6">
              <h2 className="text-xl font-medium">{title}</h2>
              <p className="mt-2 text-sm text-text-muted">{block.purpose}</p>
            </section>
          );
        })}
      </main>
    </div>
  );
}
