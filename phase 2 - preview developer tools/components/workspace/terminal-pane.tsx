"use client";

import { useEffect, useRef } from "react";
import "@xterm/xterm/css/xterm.css";
import { attachShell } from "@/lib/runtime/webcontainer";
import { useRuntimeStore } from "@/stores/runtime";

export function TerminalPane() {
  const ref = useRef<HTMLDivElement>(null);
  const fallback = useRuntimeStore((state) => state.fallback);
  const status = useRuntimeStore((state) => state.status);

  useEffect(() => {
    if (fallback || status === "idle") return;
    const host = ref.current;
    if (!host) return;
    let cancelled = false;
    let term: { dispose: () => void; write: (data: string) => void; onData: (cb: (data: string) => void) => void } | null = null;
    void (async () => {
      const { Terminal } = await import("@xterm/xterm");
      if (cancelled || !host) return;
      const terminal = new Terminal({ fontSize: 13, convertEol: true, theme: { background: "#ffffff", foreground: "#1f2330" } });
      terminal.open(host);
      terminal.write(useRuntimeStore.getState().log);
      term = terminal;
      try {
        const shell = await attachShell((chunk) => terminal.write(chunk));
        terminal.onData((data) => shell.write(data));
      } catch {
        terminal.write("\r\nThe shell is not ready yet.\r\n");
      }
    })();
    return () => {
      cancelled = true;
      term?.dispose();
    };
  }, [fallback, status]);

  if (fallback || status === "idle") {
    return (
      <div className="mx-auto max-w-lg rounded-md border border-dashed border-border p-8 text-center">
        <h2 className="text-base font-medium">Terminal is quiet</h2>
        <p className="mt-2 text-sm text-text-muted">
          {fallback ? "The terminal is hidden while the fallback preview is running." : "Install and dev-server output will stream here."}
        </p>
      </div>
    );
  }

  return <div ref={ref} className="h-full min-h-[320px] bg-surface p-2" />;
}
