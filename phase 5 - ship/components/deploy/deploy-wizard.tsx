"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QRCodeSVG } from "qrcode.react";
import { toast } from "sonner";
import { runProductionBuild } from "@/lib/runtime/webcontainer";
import type { Deployment, Project } from "@/lib/types";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Logo } from "@/components/logo";

const steps = ["Address", "Options", "Confirm"];

export function DeployWizard({ project, guest, initialKey }: { project: Project; guest: boolean; initialKey: string }) {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [subdomain, setSubdomain] = useState("");
  const [available, setAvailable] = useState<boolean | null>(null);
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [publicKey, setPublicKey] = useState(initialKey);
  const [build, setBuild] = useState<"idle" | "running" | "passed" | "failed" | "skipped">("idle");
  const [buildLog, setBuildLog] = useState("");
  const [analytics, setAnalytics] = useState(false);
  const [marketplace, setMarketplace] = useState(false);
  const [customDomain, setCustomDomain] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [deploymentId, setDeploymentId] = useState<string | null>(null);
  const [status, setStatus] = useState<string>("queued");
  const [url, setUrl] = useState<string | null>(null);
  const [logs, setLogs] = useState("");
  const [history, setHistory] = useState<Deployment[]>([]);

  useEffect(() => {
    const slug = project.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 32);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSubdomain(slug.length >= 3 ? slug : "app");
  }, [project.name]);

  useEffect(() => {
    if (!subdomain) return;
    const timer = window.setTimeout(() => {
      void fetch(`/api/deploy/check?projectId=${project.id}&subdomain=${encodeURIComponent(subdomain)}`)
        .then((response) => response.json())
        .then((body: { available?: boolean; suggestion?: string | null; publicKey?: string }) => {
          setAvailable(Boolean(body.available));
          setSuggestion(body.suggestion ?? null);
          if (body.publicKey) setPublicKey(body.publicKey);
        });
    }, 300);
    return () => window.clearTimeout(timer);
  }, [project.id, subdomain]);

  useEffect(() => {
    if (!deploymentId) return;
    let stop = false;
    async function poll() {
      const response = await fetch(`/api/deploy/${deploymentId}/status`);
      if (!response.ok || stop) return;
      const body = (await response.json()) as { status: string; url: string | null; logs: string };
      setStatus(body.status);
      setUrl(body.url);
      setLogs(body.logs);
      if (body.status === "queued" || body.status === "building") window.setTimeout(() => void poll(), 3000);
    }
    void poll();
    return () => {
      stop = true;
    };
  }, [deploymentId]);

  async function refreshHistory() {
    const response = await fetch(`/api/deploy/list?projectId=${project.id}`);
    if (!response.ok) return;
    const body = (await response.json()) as { deployments: Deployment[] };
    setHistory(body.deployments);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refreshHistory();
    // History loads with the project.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [project.id, deploymentId]);

  async function checkBuild() {
    setBuild("running");
    const result = await runProductionBuild();
    setBuildLog(result.log);
    if (result.log.startsWith("Open the preview")) setBuild("skipped");
    else setBuild(result.ok ? "passed" : "failed");
  }

  async function rotateKey() {
    const response = await fetch(`/api/projects/${project.id}/key`, { method: "POST" });
    const body = (await response.json()) as { publicKey?: string; error?: string };
    if (!response.ok || !body.publicKey) {
      toast(body.error ?? "The key could not be rotated.");
      return;
    }
    setPublicKey(body.publicKey);
  }

  async function deploy(outcome?: "error") {
    setBusy(true);
    setError(null);
    const response = await fetch("/api/deploy", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ projectId: project.id, subdomain, outcome }),
    });
    const body = (await response.json()) as { deploymentId?: string; error?: string };
    setBusy(false);
    if (!response.ok || !body.deploymentId) {
      setError(body.error ?? "The deploy did not start.");
      return;
    }
    setDeploymentId(body.deploymentId);
    setStatus("queued");
  }

  async function promote(id: string) {
    const response = await fetch(`/api/deploy/${id}/promote`, { method: "POST" });
    if (!response.ok) {
      toast("That deployment could not be promoted.");
      return;
    }
    await refreshHistory();
  }

  async function fix() {
    await fetch("/api/generate", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        projectId: project.id,
        mode: "fix",
        errors: [{ kind: "build", message: logs.slice(0, 4000) || "vite build failed", at: Date.now() }],
      }),
    });
    router.push(`/p/${project.id}`);
  }

  const tone = status === "ready" ? "success" : status === "error" ? "danger" : "neutral";

  return (
    <div className="min-h-full bg-bg">
      <header className="flex h-14 items-center gap-3 border-b border-border bg-surface px-4">
        <Link href={`/p/${project.id}`} aria-label="Back to the project" className="flex items-center gap-2">
          <Logo withWord />
        </Link>
        <span className="truncate text-sm font-medium">{project.name}</span>
        <span className="ml-auto text-sm text-text-muted">Deploy</span>
      </header>
      <main className="mx-auto flex max-w-3xl flex-col gap-6 px-6 py-8">
        {deploymentId ? (
          <section className="flex flex-col gap-4" aria-live="polite">
            <div className="flex items-center gap-2">
              {(["queued", "building", "ready"] as const).map((item) => (
                <Badge key={item} tone={item === "ready" && status === "ready" ? "success" : "neutral"}>
                  {item[0].toUpperCase() + item.slice(1)}
                </Badge>
              ))}
              <Badge tone={tone}>{status}</Badge>
            </div>
            {status === "ready" && url ? (
              <Card className="p-4">
                <h2 className="text-lg font-medium">Your app is live</h2>
                <p className="mt-2 break-all font-mono text-sm">{url}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" onClick={() => void navigator.clipboard.writeText(url)}>
                    Copy
                  </Button>
                  <Button asChild variant="outline" size="sm">
                    <a href={url} target="_blank" rel="noreferrer">
                      Open
                    </a>
                  </Button>
                </div>
                <div className="mt-4">
                  <QRCodeSVG value={url} size={128} />
                </div>
              </Card>
            ) : null}
            {status === "error" ? (
              <Card className="p-4">
                <h2 className="text-base font-medium">The deploy failed</h2>
                <p className="mt-1 text-sm text-text-muted">The previous live version keeps running.</p>
                <pre className="mt-3 max-h-48 overflow-auto rounded-sm bg-surface-2 p-3 font-mono text-xs">{logs || "No build logs yet."}</pre>
                <Button type="button" variant="outline" className="mt-3" onClick={() => void fix()}>
                  Fix with AI
                </Button>
              </Card>
            ) : (
              <pre className="max-h-48 overflow-auto rounded-md border border-border p-3 font-mono text-xs">{logs || "Waiting for logs…"}</pre>
            )}
          </section>
        ) : (
          <>
            <ol className="flex gap-3 text-sm" aria-label="Deploy steps">
              {steps.map((label, index) => (
                <li key={label} className={index === step ? "font-medium text-accent" : "text-text-muted"}>
                  {index + 1}. {label}
                </li>
              ))}
            </ol>
            {step === 0 ? (
              <section className="flex flex-col gap-4">
                <label className="text-sm">
                  Address
                  <div className="mt-1 flex items-center gap-2">
                    <Input value={subdomain} onChange={(event) => setSubdomain(event.target.value.toLowerCase())} aria-label="Subdomain" />
                    <span className="text-sm text-text-muted">.vercel.app</span>
                  </div>
                </label>
                <p className="text-sm text-text-muted">
                  {available === null ? "Checking availability…" : available ? "This address is available." : `Taken. Try ${suggestion ?? "another name"}.`}
                </p>
                <Card className="p-4">
                  <h2 className="text-sm font-medium">Pre-flight</h2>
                  <ul className="mt-2 space-y-2 text-sm">
                    <li>Project files are saved with this version.</li>
                    <li className="flex flex-wrap items-center gap-2">
                      <span>VITE_ARCHITECT_KEY is ready.</span>
                      <Button type="button" variant="outline" size="sm" onClick={() => void rotateKey()}>
                        Generate key
                      </Button>
                    </li>
                    <li className="font-mono text-xs text-text-muted">{publicKey}</li>
                    <li>
                      Build check: {build}
                      <Button type="button" variant="outline" size="sm" className="ml-2" onClick={() => void checkBuild()}>
                        Run build check
                      </Button>
                    </li>
                  </ul>
                  {buildLog ? <pre className="mt-3 max-h-32 overflow-auto font-mono text-xs">{buildLog}</pre> : null}
                </Card>
              </section>
            ) : null}
            {step === 1 ? (
              <section className="flex flex-col gap-3">
                <Toggle label="Analytics" checked={analytics} onChange={setAnalytics} note="Coming soon" />
                <Toggle label="List on the marketplace" checked={marketplace} onChange={setMarketplace} note="Coming soon" />
                <label className="text-sm">
                  Custom domain
                  <Input className="mt-1" value={customDomain} placeholder="Coming soon" onChange={(event) => setCustomDomain(event.target.value)} />
                </label>
              </section>
            ) : null}
            {step === 2 ? (
              <Card className="p-4">
                <h2 className="text-base font-medium">Confirm</h2>
                <ul className="mt-2 space-y-1 text-sm text-text-muted">
                  <li>Address: {subdomain}.vercel.app</li>
                  <li>Region: Mumbai</li>
                  <li>Framework: Vite + React</li>
                  <li>Key: {publicKey.slice(0, 8)}…</li>
                </ul>
              </Card>
            ) : null}
            {error ? <p className="text-sm text-danger">{error}</p> : null}
            <div className="flex gap-2">
              {step > 0 ? (
                <Button type="button" variant="outline" onClick={() => setStep((value) => value - 1)}>
                  Back
                </Button>
              ) : null}
              {step < 2 ? (
                <Button type="button" disabled={step === 0 && (available === false || build === "failed")} onClick={() => setStep((value) => value + 1)}>
                  Continue
                </Button>
              ) : guest ? (
                <Button asChild>
                  <a href="/login">Sign up to connect</a>
                </Button>
              ) : (
                <Button type="button" disabled={busy || available === false} onClick={() => void deploy()}>
                  Deploy
                </Button>
              )}
            </div>
          </>
        )}

        <section>
          <h2 className="text-base font-medium">Deployments</h2>
          {history.length === 0 ? <p className="mt-2 text-sm text-text-muted">No deploys yet.</p> : null}
          <ul className="mt-2 flex flex-col gap-2">
            {history.map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
                <div>
                  <p className="text-sm">{item.subdomain}.vercel.app</p>
                  <p className="text-xs text-text-muted">{item.status}</p>
                </div>
                <div className="flex gap-2">
                  <Button type="button" variant="outline" size="sm" disabled={guest} onClick={() => void deploy()}>
                    Redeploy
                  </Button>
                  <Button type="button" variant="outline" size="sm" disabled={guest || item.status !== "ready"} onClick={() => void promote(item.id)}>
                    Promote
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}

function Toggle({ label, checked, onChange, note }: { label: string; checked: boolean; onChange: (value: boolean) => void; note: string }) {
  return (
    <button type="button" className="flex items-center justify-between rounded-md border border-border px-3 py-2 text-left" aria-pressed={checked} onClick={() => onChange(!checked)}>
      <span>
        <span className="block text-sm font-medium">{label}</span>
        <span className="text-xs text-text-muted">{note}</span>
      </span>
      <span className="text-xs">{checked ? "On" : "Off"}</span>
    </button>
  );
}
