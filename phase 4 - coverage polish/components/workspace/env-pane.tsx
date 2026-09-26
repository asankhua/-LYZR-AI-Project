"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";

export function EnvPane({ projectId }: { projectId: string }) {
  const [rows, setRows] = useState<{ key: string; masked: string }[]>([]);
  const [keyName, setKeyName] = useState("VITE_ARCHITECT_KEY");
  const [value, setValue] = useState("");
  const [error, setError] = useState("");

  async function load() {
    const response = await fetch(`/api/projects/${projectId}/env`);
    if (!response.ok) return;
    const body = (await response.json()) as { variables: { key: string; masked: string }[] };
    setRows(body.variables);
  }

  useEffect(() => {
    // Load the saved variables for this project.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void load();
    // `load` reads the latest project id. Listing it would restart the fetch on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  return (
    <div className="p-6">
      <h2 className="text-sm font-medium">Environment variables</h2>
      <p className="mt-1 text-sm text-text-muted">Values are stored for this project and shown masked.</p>
      {rows.length === 0 ? <p className="mt-3 text-sm text-text-muted">No environment variables yet.</p> : null}
      <ul className="mt-3 flex flex-col gap-2">
        {rows.map((row) => (
          <li key={row.key} className="flex justify-between font-mono text-xs">
            <span>{row.key}</span>
            <span className="text-text-muted">{row.masked}</span>
          </li>
        ))}
      </ul>
      <form
        className="mt-4 flex flex-wrap items-end gap-2"
        onSubmit={(event) => {
          event.preventDefault();
          setError("");
          void fetch(`/api/projects/${projectId}/env`, {
            method: "PUT",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({ key: keyName, value }),
          }).then(async (response) => {
            if (!response.ok) {
              const body = (await response.json().catch(() => null)) as { error?: string } | null;
              setError(body?.error ?? "Could not save that variable.");
              return;
            }
            setValue("");
            await load();
          });
        }}
      >
        <label className="text-sm">
          Key
          <input value={keyName} onChange={(event) => setKeyName(event.target.value)} className="mt-1 block h-9 rounded-sm border border-border bg-surface px-2 font-mono text-xs" />
        </label>
        <label className="text-sm">
          Value
          <input value={value} onChange={(event) => setValue(event.target.value)} type="password" className="mt-1 block h-9 rounded-sm border border-border bg-surface px-2 font-mono text-xs" />
        </label>
        <Button type="submit" variant="outline" size="sm">
          Add variable
        </Button>
      </form>
      {error ? <p className="mt-2 text-sm text-danger">{error}</p> : null}
    </div>
  );
}
