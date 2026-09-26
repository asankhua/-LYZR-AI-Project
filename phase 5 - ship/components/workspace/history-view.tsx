"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createTwoFilesPatch } from "diff";
import type { ProjectFile, Snapshot } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

export function HistoryView({
  projectId,
  snapshots,
  current,
}: {
  projectId: string;
  snapshots: Snapshot[];
  current: ProjectFile[];
}) {
  const router = useRouter();
  const [selected, setSelected] = useState(snapshots.at(-1)?.id ?? "");
  const [files, setFiles] = useState<{ path: string; content: string }[]>([]);
  const [patch, setPatch] = useState("");
  const [confirming, setConfirming] = useState(false);

  async function open(snapshotId: string) {
    setSelected(snapshotId);
    const response = await fetch(`/api/projects/${projectId}/snapshots?snapshotId=${snapshotId}`);
    if (!response.ok) return;
    const body = (await response.json()) as { files: { path: string; content: string }[] };
    setFiles(body.files);
    const first = body.files.find((file) => file.path.endsWith(".tsx")) ?? body.files[0];
    if (!first) return;
    const now = current.find((file) => file.path === first.path)?.content ?? "";
    setPatch(createTwoFilesPatch(first.path, first.path, first.content, now));
  }

  async function restore() {
    const response = await fetch(`/api/projects/${projectId}/restore`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ snapshotId: selected }),
    });
    if (!response.ok) return;
    setConfirming(false);
    router.refresh();
  }

  return (
    <div className="mx-auto grid max-w-5xl gap-6 p-6 md:grid-cols-[16rem_1fr]">
      <ol className="space-y-2">
        {snapshots.map((snapshot, index) => (
          <li key={snapshot.id}>
            <button type="button" className="w-full rounded-md border border-border px-3 py-2 text-left text-sm" onClick={() => void open(snapshot.id)}>
              <span className="font-medium">v{index + 1}</span>
              <span className="mt-1 block text-text-muted">{snapshot.summary}</span>
              {snapshot.healthy ? <span className="mt-1 block text-xs">Last good version</span> : null}
            </button>
          </li>
        ))}
      </ol>
      <section>
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-medium">Version history</h1>
          <Button type="button" variant="outline" size="sm" disabled={!selected} onClick={() => setConfirming(true)}>
            Restore
          </Button>
        </div>
        <ul className="mt-4 space-y-1 font-mono text-xs">
          {files.map((file) => (
            <li key={file.path}>{file.path}</li>
          ))}
        </ul>
        <pre className="mt-4 max-h-80 overflow-auto rounded-md border border-border p-3 font-mono text-xs">{patch || "Pick a version to see its files and the diff against the current code."}</pre>
      </section>
      <Dialog open={confirming} onOpenChange={setConfirming}>
        <DialogContent>
          <DialogTitle>Restore this version?</DialogTitle>
          <p className="mt-2 text-sm text-text-muted">This writes a new version. Earlier versions stay in the list.</p>
          <Button type="button" variant="outline" className="mt-4" onClick={() => void restore()}>
            Restore version
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
