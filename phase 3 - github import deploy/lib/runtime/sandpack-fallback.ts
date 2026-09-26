"use client";

import type { SandpackClient } from "@codesandbox/sandpack-client";

let client: SandpackClient | null = null;

function sandpackFiles(files: { path: string; content: string }[]) {
  return Object.fromEntries(files.map((file) => [file.path.startsWith("/") ? file.path : `/${file.path}`, { code: file.content }]));
}

export async function mountSandpack(iframe: HTMLIFrameElement, files: { path: string; content: string }[]) {
  const { loadSandpackClient } = await import("@codesandbox/sandpack-client");
  client = await loadSandpackClient(iframe, {
    files: sandpackFiles(files),
    dependencies: { react: "19.0.0", "react-dom": "19.0.0" },
    entry: "/src/main.tsx",
  });
  return client;
}

export function updateSandpack(files: { path: string; content: string }[]) {
  client?.updateSandbox({
    files: sandpackFiles(files),
    dependencies: { react: "19.0.0", "react-dom": "19.0.0" },
    entry: "/src/main.tsx",
  });
}
