"use client";

import { toFileTree, parsePreviewLine } from "@/lib/runtime/file-tree";

type Hooks = {
  onStatus: (status: "booting" | "mounting" | "installing" | "starting" | "ready" | "error") => void;
  onLog: (chunk: string) => void;
  onUrl: (url: string) => void;
  onError: (message: string, file?: string) => void;
};

let booting: Promise<import("@webcontainer/api").WebContainer> | null = null;
let packageHash = "";
let devStarted = false;
let mounted = false;

async function instance() {
  if (!booting) {
    const { WebContainer } = await import("@webcontainer/api");
    booting = WebContainer.boot();
  }
  return booting;
}

async function pipe(stream: ReadableStream<string>, onLog: (chunk: string) => void, onError?: Hooks["onError"]) {
  const reader = stream.getReader();
  let pending = "";
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    pending += value;
    const lines = pending.split("\n");
    pending = lines.pop() ?? "";
    for (const line of lines) {
      onLog(`${line}\n`);
      const parsed = parsePreviewLine(line);
      if (parsed && onError) onError(parsed.message, parsed.file);
    }
  }
}

function dirname(file: string) {
  const index = file.lastIndexOf("/");
  return index === -1 ? "" : file.slice(0, index);
}

export async function syncPreviewFiles(files: { path: string; content: string }[], hooks: Hooks) {
  const wc = await instance();
  if (!mounted) {
    hooks.onStatus("mounting");
    await wc.mount(toFileTree(files));
    mounted = true;
  } else {
    for (const file of files) {
      const dir = dirname(file.path);
      if (dir) await wc.fs.mkdir(dir, { recursive: true });
      await wc.fs.writeFile(file.path, file.content);
    }
  }

  const pkg = files.find((file) => file.path === "package.json")?.content ?? "";
  if (pkg && pkg !== packageHash) {
    hooks.onStatus("installing");
    const install = await wc.spawn("npm", ["install"]);
    const code = await Promise.all([pipe(install.output, hooks.onLog, hooks.onError), install.exit]).then(([, exit]) => exit);
    if (code !== 0) {
      hooks.onStatus("error");
      hooks.onError("npm install failed");
      return;
    }
    packageHash = pkg;
  }

  if (!devStarted) {
    hooks.onStatus("starting");
    wc.on("server-ready", (_port, url) => {
      hooks.onUrl(url);
      hooks.onStatus("ready");
    });
    const dev = await wc.spawn("npm", ["run", "dev"]);
    devStarted = true;
    void pipe(dev.output, hooks.onLog, hooks.onError);
    return;
  }
  hooks.onStatus("ready");
}

export async function bootPreview(files: { path: string; content: string }[], hooks: Hooks) {
  hooks.onStatus("booting");
  await syncPreviewFiles(files, hooks);
}

export async function attachShell(onData: (chunk: string) => void) {
  const wc = await instance();
  const shell = await wc.spawn("jsh", { terminal: { cols: 80, rows: 24 } });
  void pipe(shell.output, onData);
  const input = shell.input.getWriter();
  return {
    write(data: string) {
      void input.write(data);
    },
    resize(cols: number, rows: number) {
      shell.resize({ cols, rows });
    },
  };
}
