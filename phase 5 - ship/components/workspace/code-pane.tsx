"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { createTwoFilesPatch } from "diff";
import type { ProjectFile } from "@/lib/types";

const Monaco = dynamic(() => import("@monaco-editor/react"), { ssr: false });

export function CodePane({
  projectId,
  files,
  onSaved,
}: {
  projectId: string;
  files: ProjectFile[];
  onSaved: (files: ProjectFile[], snapshotId: string) => void;
}) {
  const [path, setPath] = useState(files[0]?.path ?? "");
  const [draft, setDraft] = useState(files.find((file) => file.path === path)?.content ?? "");
  const [baseline, setBaseline] = useState(draft);
  const [patch, setPatch] = useState("");
  const [version, setVersion] = useState(0);
  const selected = files.find((file) => file.path === path);

  function open(nextPath: string) {
    const file = files.find((item) => item.path === nextPath);
    setPath(nextPath);
    setDraft(file?.content ?? "");
    setBaseline(file?.content ?? "");
    setPatch("");
  }

  async function save() {
    const response = await fetch(`/api/projects/${projectId}/files`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ ops: [{ op: "update", path, content: draft }] }),
    });
    if (!response.ok) return;
    const body = (await response.json()) as { snapshotId: string; files: ProjectFile[] };
    setPatch(createTwoFilesPatch(path, path, baseline, draft));
    setBaseline(draft);
    setVersion((value) => value + 1);
    onSaved(body.files, body.snapshotId);
  }

  if (files.length === 0) {
    return (
      <div className="mx-auto max-w-lg rounded-md border border-dashed border-border p-8 text-center">
        <h2 className="text-base font-medium">Code appears as the app is built</h2>
        <p className="mt-2 text-sm text-text-muted">The file tree and editor open here in Developer mode.</p>
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-[420px] grid-cols-[16rem_1fr] grid-rows-[1fr_auto]">
      <ul className="row-span-2 overflow-auto border-r border-border p-2 font-mono text-xs">
        {files.map((file) => (
          <li key={file.path}>
            <button type="button" className="w-full truncate rounded-sm px-2 py-1 text-left hover:bg-surface-2" onClick={() => open(file.path)}>
              {file.path}
            </button>
          </li>
        ))}
      </ul>
      <div className="min-h-0">
        <Monaco
          height="100%"
          path={path}
          language={path.endsWith(".css") ? "css" : path.endsWith(".json") ? "json" : path.endsWith(".html") ? "html" : "typescript"}
          value={selected ? draft : ""}
          theme="vs"
          onChange={(value) => setDraft(value ?? "")}
          onMount={(editor, monaco) => {
            editor.addCommand(monaco.KeyMod.CtrlCmd | monaco.KeyCode.KeyS, () => {
              void save();
            });
          }}
          options={{ minimap: { enabled: false }, fontSize: 13 }}
        />
      </div>
      <pre className="max-h-40 overflow-auto border-t border-border p-3 font-mono text-xs text-text-muted">
        {patch ? `Changes in v${version}\n${patch}` : "Changes in the latest version show up here after you save."}
      </pre>
    </div>
  );
}
