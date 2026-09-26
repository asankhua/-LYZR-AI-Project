"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import { parseGithubRepo } from "@/lib/github/filter";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

type Repo = { fullName: string; private: boolean; defaultBranch: string; description: string | null };

const steps = ["Fetching files", "Detecting framework", "Writing plan", "Starting preview"];

export function ImportScreen({ guest }: { guest: boolean }) {
  const pathname = usePathname();
  const [source, setSource] = useState<"github" | "zip">("github");
  const [repos, setRepos] = useState<Repo[] | null>(null);
  const [repo, setRepo] = useState<Repo | null>(null);
  const [manual, setManual] = useState("");
  const [branch, setBranch] = useState("");
  const [root, setRoot] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<string | null>(null);

  async function loadRepos() {
    setError(null);
    setLoading(true);
    const response = await fetch("/api/github/repos");
    const body = (await response.json()) as { repos?: Repo[]; error?: string };
    setLoading(false);
    if (!response.ok) {
      setError(body.error ?? "GitHub could not list repositories.");
      setRepos([]);
      return;
    }
    setRepos(body.repos ?? []);
  }

  async function startImport() {
    setError(null);
    setProgress(steps[0]);
    setLoading(true);
    let response: Response;
    if (source === "zip") {
      if (!file) return;
      const form = new FormData();
      form.set("file", file);
      response = await fetch("/api/import/zip", { method: "POST", body: form });
    } else {
      const fullName = repo?.fullName ?? parseGithubRepo(manual);
      if (!fullName) {
        setLoading(false);
        setProgress(null);
        setError("Use a GitHub URL or owner/repo, such as https://github.com/vercel/next.js.");
        return;
      }
      response = await fetch("/api/github/import", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ repo: fullName, branch: branch.trim() || undefined, root: root.trim() || undefined }),
      });
    }
    const body = (await response.json()) as { projectId?: string; codeOnly?: boolean; error?: string };
    if (!response.ok || !body.projectId) {
      setLoading(false);
      setProgress(null);
      setError(body.error ?? "The import did not finish.");
      return;
    }
    for (const step of steps.slice(1)) {
      setProgress(step);
      await new Promise((resolve) => setTimeout(resolve, 250));
    }
    window.location.assign(`/p/${body.projectId}`);
  }

  const pasted = parseGithubRepo(manual);
  const ready = source === "zip" ? Boolean(file) : Boolean(repo || pasted);

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-10">
      <div>
        <h1 className="text-[28px] leading-9 font-medium">Import a project</h1>
        <p className="mt-2 text-sm text-text-muted">Bring in a GitHub repository or a zip. The limit is 500 files and 5 MB.</p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <Card className={source === "github" ? "border-accent p-4" : "p-4"}>
          <button type="button" className="w-full text-left" onClick={() => setSource("github")}>
            <h2 className="text-base font-medium">GitHub</h2>
            <p className="mt-1 text-sm text-text-muted">Choose a repository, branch, and optional root folder.</p>
          </button>
        </Card>
        <Card className={source === "zip" ? "border-accent p-4" : "p-4"}>
          <button type="button" className="w-full text-left" onClick={() => setSource("zip")}>
            <h2 className="text-base font-medium">Zip archive</h2>
            <p className="mt-1 text-sm text-text-muted">Upload a project folder. Lockfiles and dependencies are skipped.</p>
          </button>
        </Card>
      </div>

      {source === "github" ? (
        <section className="flex flex-col gap-3">
          <label className="text-sm">
            Repository
            <Input
              className="mt-1"
              value={manual}
              placeholder="https://github.com/owner/repo"
              onChange={(event) => {
                setManual(event.target.value);
                setRepo(null);
              }}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="text-sm">
              Branch
              <Input className="mt-1" value={branch} placeholder="Default branch" onChange={(event) => setBranch(event.target.value)} />
            </label>
            <label className="text-sm">
              Root directory
              <Input className="mt-1" value={root} placeholder="optional, such as apps/web" onChange={(event) => setRoot(event.target.value)} />
            </label>
          </div>
          <p className="text-sm text-text-muted">Public repositories import from the URL. Private repositories need a connected GitHub account.</p>
          {guest ? (
            <Card className="p-4">
              <h2 className="text-base font-medium">Sign up to connect</h2>
              <p className="mt-1 text-sm text-text-muted">Connecting GitHub lists your private repositories. A public URL or a zip still imports while you are trying Architect.</p>
              <Button asChild variant="outline" className="mt-3">
                <a href={`/login?next=${encodeURIComponent(pathname || "/import")}`}>Sign up to connect</a>
              </Button>
            </Card>
          ) : repos === null ? (
            <Button type="button" variant="outline" onClick={() => void loadRepos()} disabled={loading}>
              {loading ? "Loading repositories" : "Show my repositories"}
            </Button>
          ) : repos.length === 0 ? (
            <p className="text-sm text-text-muted">{error ?? "No repositories yet."}</p>
          ) : (
            <ul className="flex flex-col gap-2">
              {repos.map((item) => (
                <li key={item.fullName}>
                  <button
                    type="button"
                    className={`w-full rounded-md border px-3 py-2 text-left ${repo?.fullName === item.fullName ? "border-accent" : "border-border"}`}
                    onClick={() => {
                      setRepo(item);
                      setManual(item.fullName);
                      setBranch(item.defaultBranch);
                    }}
                  >
                    <span className="font-medium">{item.fullName}</span>
                    <span className="mt-1 block text-sm text-text-muted">{item.description ?? (item.private ? "Private" : "Public")}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      ) : (
        <label className="text-sm">
          Zip file
          <input
            className="mt-1 block w-full text-sm"
            type="file"
            accept=".zip,application/zip"
            onChange={(event) => setFile(event.target.files?.[0] ?? null)}
          />
        </label>
      )}

      {progress ? (
        <Card className="p-4" aria-live="polite">
          <ol className="space-y-1 text-sm">
            {steps.map((step) => (
              <li key={step} className={step === progress ? "font-medium text-accent" : "text-text-muted"}>
                {step}
              </li>
            ))}
          </ol>
        </Card>
      ) : null}
      {error ? <p className="text-sm text-danger">{error}</p> : null}
      <div>
        <Button type="button" disabled={!ready || loading} onClick={() => void startImport()}>
          Import
        </Button>
      </div>
    </main>
  );
}
