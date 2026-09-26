"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { themePresets, type ThemePresetId } from "@/lib/templates/themes";

export function ProjectSettings({
  projectId,
  initialName,
  initialTheme,
  initialKey,
}: {
  projectId: string;
  initialName: string;
  initialTheme: ThemePresetId;
  initialKey: string;
}) {
  const [name, setName] = useState(initialName);
  const [savedName, setSavedName] = useState(initialName);
  const [theme, setTheme] = useState<ThemePresetId>(initialTheme);
  const [savedTheme, setSavedTheme] = useState<ThemePresetId>(initialTheme);
  const [publicKey, setPublicKey] = useState(initialKey);
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  async function save(body: { name?: string; theme?: ThemePresetId }, message: string) {
    setBusy(true);
    const response = await fetch(`/api/projects/${projectId}`, {
      method: "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!response.ok) {
      toast("Project settings could not be saved.");
      return false;
    }
    toast(message);
    return true;
  }

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-8 px-6 py-10">
      <div>
        <h1 className="text-[32px] leading-10 font-medium">Project settings</h1>
        <p className="mt-2 text-sm text-text-muted">Name, theme, and the public key used when this app calls its agents.</p>
      </div>
      <form
        className="rounded-md border border-border p-4"
        onSubmit={(event) => {
          event.preventDefault();
          void save({ name }, "Name saved.").then((ok) => {
            if (ok) setSavedName(name);
          });
        }}
      >
        <h2 className="text-sm font-medium">Name</h2>
        <label className="mt-3 block text-sm" htmlFor="project-name">
          Project name
          <Input id="project-name" className="mt-1" value={name} onChange={(event) => setName(event.target.value)} />
        </label>
        <Button type="submit" className="mt-4" disabled={busy || name.trim().length === 0 || name === savedName}>
          Save name
        </Button>
      </form>
      <form
        className="rounded-md border border-border p-4"
        onSubmit={(event) => {
          event.preventDefault();
          void save({ theme }, "Theme saved. Open the preview to see it.").then((ok) => {
            if (ok) setSavedTheme(theme);
          });
        }}
      >
        <h2 className="text-sm font-medium">Theme</h2>
        <p className="mt-1 text-sm text-text-muted">Applies to the next build, and to the current preview when files already exist.</p>
        <label className="mt-3 block text-sm" htmlFor="project-theme">
          Preset
          <select
            id="project-theme"
            className="mt-1 block h-9 rounded-sm border border-border bg-surface px-2"
            value={theme}
            onChange={(event) => setTheme(event.target.value as ThemePresetId)}
          >
            {Object.entries(themePresets).map(([id, preset]) => (
              <option key={id} value={id}>
                {preset.name}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" className="mt-4" disabled={busy || theme === savedTheme}>
          Save theme
        </Button>
      </form>
      <section className="rounded-md border border-border p-4">
        <h2 className="text-sm font-medium">Sharing</h2>
        <p className="mt-1 text-sm text-text-muted">The public key lets the generated app call its agents. Rotating it invalidates the previous key.</p>
        <p className="mt-3 font-mono text-xs text-text-muted">{publicKey || "No key yet"}</p>
        <Button
          type="button"
          variant="outline"
          className="mt-3"
          disabled={busy}
          onClick={() => {
            setBusy(true);
            void fetch(`/api/projects/${projectId}/key`, { method: "POST" })
              .then(async (response) => {
                const body = (await response.json()) as { publicKey?: string };
                setBusy(false);
                if (!response.ok || !body.publicKey) {
                  toast("The key could not be rotated.");
                  return;
                }
                setPublicKey(body.publicKey);
                toast("Public key rotated.");
              })
              .catch(() => {
                setBusy(false);
                toast("The key could not be rotated.");
              });
          }}
        >
          Rotate public key
        </Button>
      </section>
      <section className="rounded-md border border-danger/40 p-4">
        <h2 className="text-sm font-medium">Delete project</h2>
        <p className="mt-1 text-sm text-text-muted">This removes the project, its files, and its preview. Type the project name to confirm.</p>
        <label className="mt-3 block text-sm" htmlFor="confirm-delete">
          Project name
          <Input id="confirm-delete" className="mt-1" value={confirm} onChange={(event) => setConfirm(event.target.value)} />
        </label>
        <Button
          type="button"
          variant="destructive"
          className="mt-4"
          disabled={busy || confirm !== savedName}
          onClick={() => {
            setBusy(true);
            void fetch(`/api/projects/${projectId}`, { method: "DELETE" }).then((response) => {
              if (!response.ok) {
                setBusy(false);
                toast("The project could not be deleted.");
                return;
              }
              window.location.assign("/home");
            });
          }}
        >
          Delete project
        </Button>
      </section>
    </div>
  );
}
