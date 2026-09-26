"use client";

import { useEffect, useRef, useState } from "react";
import type { PlanDoc, PreviewError, ProjectFile } from "@/lib/types";
import { mountSandpack, updateSandpack } from "@/lib/runtime/sandpack-fallback";
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
    started.current = true;
    const payload = filesRef.current.map((file) => ({ path: file.path, content: file.content }));
    const hooks = {
      onStatus: setStatus,
      onLog: appendLog,
      onUrl: setPreviewUrl,
      onError: (message: string, file?: string) => onErrorRef.current({ kind: "build", message, file, at: Date.now() }),
    };
    if (!window.crossOriginIsolated) {
      setFallback(true);
      setStatus("starting");
      const iframe = iframeRef.current;
      if (!iframe) return;
      void mountSandpack(iframe, payload)
        .then(() => setStatus("ready"))
        .catch(() => setStatus("error"));
      return;
    }
    void bootPreview(payload, hooks).catch(() => {
      setFallback(true);
      setStatus("error");
      const iframe = iframeRef.current;
      if (!iframe) return;
      void mountSandpack(iframe, payload)
        .then(() => setStatus("ready"))
        .catch(() => setStatus("error"));
    });
  }, [active, appendLog, files.length, setFallback, setPreviewUrl, setStatus]);

  useEffect(() => {
    if (!started.current || status !== "ready") return;
    const payload = filesRef.current.map((file) => ({ path: file.path, content: file.content }));
    if (fallback) {
      updateSandpack(payload);
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

  const statusLabel =
    status === "installing" ? "Installing packages" : status === "ready" ? "Preview ready" : status === "error" ? "Preview error" : status === "idle" ? "Waiting for files" : "Starting preview";

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
        {status !== "ready" && !fallback ? (
          <div className="absolute inset-0 z-10 overflow-auto p-6">
            <p className="text-sm font-medium">{statusLabel}</p>
            <div className="mt-4 grid gap-3">
              {(plan?.screens ?? [{ name: "Home", purpose: "The first screen" }]).map((screen) => (
                <article key={screen.name} className="rounded-md border border-dashed border-border bg-surface p-4">
                  <h2 className="text-sm font-medium">{screen.name}</h2>
                  <p className="mt-1 text-sm text-text-muted">{screen.purpose}</p>
                </article>
              ))}
            </div>
          </div>
        ) : null}
        <div className="flex h-full justify-center">
          <iframe
            ref={iframeRef}
            title="App preview"
            src={fallback ? undefined : previewUrl || "about:blank"}
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
