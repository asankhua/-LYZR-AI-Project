"use client";

import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

type Commit = { sha: string; message: string; snapshotId: string; createdAt: string; url: string | null };
type GitState = {
  guest: boolean;
  connected: boolean;
  login: string | null;
  expired: boolean;
  repo: string | null;
  branch: string;
  autoCommit: boolean;
  conflict: boolean;
  ahead: boolean;
  commits: Commit[];
};

export function GitPanel({ projectId, guest }: { projectId: string; guest: boolean }) {
  const [state, setState] = useState<GitState | null>(null);
  const [branches, setBranches] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);

  async function load() {
    setLoading(true);
    const response = await fetch(`/api/github/state?projectId=${projectId}`);
    const body = (await response.json()) as GitState & { error?: string };
    setLoading(false);
    if (!response.ok) {
      setError(body.error ?? "GitHub status could not be loaded.");
      return;
    }
    setError(null);
    setState(body);
    if (body.connected && body.repo) {
      const listed = await fetch(`/api/github/branches?projectId=${projectId}`);
      const branchBody = (await listed.json()) as { branches?: string[] };
      setBranches(branchBody.branches ?? [body.branch]);
    }
  }

  useEffect(() => {
    let cancel = false;
    void (async () => {
      const response = await fetch(`/api/github/state?projectId=${projectId}`);
      const body = (await response.json()) as GitState & { error?: string };
      if (cancel) return;
      setLoading(false);
      if (!response.ok) {
        setError(body.error ?? "GitHub status could not be loaded.");
        return;
      }
      setError(null);
      setState(body);
      if (body.connected && body.repo) {
        const listed = await fetch(`/api/github/branches?projectId=${projectId}`);
        const branchBody = (await listed.json()) as { branches?: string[] };
        if (!cancel) setBranches(branchBody.branches ?? [body.branch]);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [projectId]);

  async function connect() {
    setBusy(true);
    const response = await fetch("/api/github/connect", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ next: `/p/${projectId}` }),
    });
    const body = (await response.json()) as { url?: string; error?: string };
    setBusy(false);
    if (!response.ok || !body.url) {
      setError(body.error ?? "GitHub could not be connected.");
      return;
    }
    window.location.href = body.url;
  }

  async function push(forceBranch?: string) {
    setBusy(true);
    const response = await fetch("/api/github/push", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ projectId, message: "Update from Architect", forceBranch }),
    });
    const body = (await response.json()) as { error?: string; url?: string };
    setBusy(false);
    if (!response.ok) {
      setError(body.error ?? "The push did not finish.");
      await load();
      return;
    }
    toast(body.url ? "Pushed to GitHub." : "Nothing new to push.");
    await load();
  }

  if (loading) return <p className="text-sm text-text-muted">Loading GitHub…</p>;
  if (!state) {
    return (
      <Card className="p-6">
        <h2 className="text-base font-medium">GitHub could not be loaded</h2>
        <p className="mt-2 text-sm text-text-muted">{error}</p>
        <Button type="button" variant="outline" className="mt-3" onClick={() => void load()}>
          Try again
        </Button>
      </Card>
    );
  }

  if (guest || (!state.connected && !state.expired)) {
    return (
      <Card className="mx-auto max-w-lg p-8 text-center">
        <h2 className="text-base font-medium">GitHub is not connected</h2>
        <p className="mt-2 text-sm text-text-muted">
          {guest ? "Sign up to connect GitHub and keep this project in a repository." : "Connect GitHub to create a repository and push this project."}
        </p>
        <div className="mt-4">
          {guest ? (
            <Button asChild variant="outline">
              <a href="/login">Sign up to connect</a>
            </Button>
          ) : (
            <Button type="button" variant="outline" disabled={busy} onClick={() => void connect()}>
              Connect GitHub
            </Button>
          )}
        </div>
      </Card>
    );
  }

  if (state.expired) {
    return (
      <Card className="mx-auto max-w-lg p-8 text-center">
        <h2 className="text-base font-medium">Reconnect GitHub</h2>
        <p className="mt-2 text-sm text-text-muted">The GitHub token expired. Connect again to push.</p>
        <Button type="button" variant="outline" className="mt-4" disabled={busy} onClick={() => void connect()}>
          Reconnect GitHub
        </Button>
      </Card>
    );
  }

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-4">
      <Card className="p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-medium">{state.login ? `Connected as ${state.login}` : "GitHub connected"}</h2>
            {state.repo ? (
              <a className="text-sm text-accent" href={`https://github.com/${state.repo}`}>
                {state.repo}
              </a>
            ) : (
              <p className="text-sm text-text-muted">No repository yet. Push creates one.</p>
            )}
          </div>
          <Badge tone="neutral">{state.branch}</Badge>
        </div>
      </Card>

      <div className="flex flex-wrap items-center gap-3">
        <label className="text-sm">
          Branch
          <select
            className="ml-2 h-9 rounded-sm border border-border bg-surface px-2"
            value={state.branch}
            aria-label="Branch"
            onChange={() => toast("Switching branches is not available yet.")}
          >
            {(branches.length ? branches : [state.branch]).map((branch) => (
              <option key={branch} value={branch}>
                {branch}
              </option>
            ))}
          </select>
        </label>
        <button
          type="button"
          className="rounded-full bg-surface-2 px-3 py-1 text-xs font-medium"
          aria-pressed={state.autoCommit}
          onClick={() =>
            void fetch("/api/github/push", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ projectId, autoCommit: !state.autoCommit }),
            }).then(() => load())
          }
        >
          Auto-commit {state.autoCommit ? "on" : "off"}
        </button>
      </div>

      {state.conflict ? (
        <Card className="border-[#e2c56b] p-4">
          <h3 className="text-sm font-medium">The remote has new commits</h3>
          <p className="mt-1 text-sm text-text-muted">Pull is not available yet. Push these files to a new branch instead.</p>
          <div className="mt-3 flex gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => toast("Pulling remote changes is not available yet. Your local files stay as they are.")}>
              Pull
            </Button>
            <Button type="button" variant="outline" size="sm" disabled={busy} onClick={() => void push("architect-sync")}>
              Push to a new branch
            </Button>
          </div>
        </Card>
      ) : null}

      {state.ahead && !state.conflict ? <p className="text-sm text-text-muted">Changes are not pushed yet.</p> : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}

      <div className="flex gap-2">
        <Button type="button" variant="outline" disabled={busy || state.conflict} onClick={() => void push()}>
          Push
        </Button>
        <Button type="button" variant="outline" onClick={() => toast("Pulling remote changes is not available yet. Your local files stay as they are.")}>
          Pull
        </Button>
      </div>

      <ul className="flex flex-col gap-2">
        {state.commits.length === 0 ? <li className="text-sm text-text-muted">No commits yet.</li> : null}
        {state.commits.map((commit) => (
          <li key={commit.sha} className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
            <div>
              <p className="text-sm">{commit.message}</p>
              <p className="font-mono text-xs text-text-muted">{commit.sha.slice(0, 7)}</p>
            </div>
            <Badge tone="neutral">Snapshot</Badge>
          </li>
        ))}
      </ul>
    </div>
  );
}
