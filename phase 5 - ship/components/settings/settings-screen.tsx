"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { setMode, signOut } from "@/lib/actions";
import type { Mode } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const sections = ["Profile", "Mode", "Connected accounts", "Model keys", "Integrations", "Danger zone"] as const;
const integrations = ["Gmail", "Slack", "Notion", "Google Calendar", "HubSpot", "Jira", "Linear", "Sheets"];
const keyProviders = [
  { id: "groq", label: "Groq", note: "Used for plans, builds, and agent replies." },
  { id: "openai", label: "OpenAI", note: "Stored for later. Marked coming soon." },
  { id: "anthropic", label: "Anthropic", note: "Stored for later. Marked coming soon." },
] as const;

type KeyState = { provider: string; stored: boolean; last4: string };
type McpServer = { id: string; name: string; url: string };
type Appearance = "system" | "light" | "dark";

export function SettingsScreen({ name, mode }: { name: string | null; mode: Mode }) {
  const router = useRouter();
  const [section, setSection] = useState<(typeof sections)[number]>("Profile");
  const [displayName, setDisplayName] = useState(name ?? "Guest");
  const [savedName, setSavedName] = useState(name ?? "Guest");
  const [keys, setKeys] = useState<KeyState[]>([]);
  const [draftKeys, setDraftKeys] = useState<Record<string, string>>({});
  const [blockedService, setBlockedService] = useState<string | null>(null);
  const [servers, setServers] = useState<McpServer[]>([]);
  const [mcpName, setMcpName] = useState("");
  const [mcpUrl, setMcpUrl] = useState("");
  const [github, setGithub] = useState<{ login: string | null; expired: boolean } | null>(null);
  const [accountNote, setAccountNote] = useState("");
  const [appearance, setAppearance] = useState<Appearance>("system");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem("theme");
    if (stored === "light" || stored === "dark") setAppearance(stored);
    void fetch("/api/settings")
      .then(async (response) => {
        if (!response.ok) return;
        const body = (await response.json()) as {
          displayName: string | null;
          keys: KeyState[];
          mcp: McpServer[];
          github: { login: string | null; expired: boolean } | null;
        };
        if (body.displayName) {
          setDisplayName(body.displayName);
          setSavedName(body.displayName);
        }
        setKeys(body.keys ?? []);
        setServers(body.mcp ?? []);
        setGithub(body.github);
      })
      .catch(() => undefined);
  }, []);

  function applyAppearance(next: Appearance) {
    setAppearance(next);
    const dark = next === "dark" || (next === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
    document.documentElement.classList.toggle("dark", dark);
    if (next === "system") localStorage.removeItem("theme");
    else localStorage.setItem("theme", next);
  }

  async function save(body: unknown, message: string) {
    setBusy(true);
    const response = await fetch("/api/settings", {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    if (!response.ok) {
      const payload = (await response.json().catch(() => null)) as { error?: string } | null;
      toast(payload?.error ?? "Settings could not be saved.");
      return false;
    }
    toast(message);
    router.refresh();
    return true;
  }

  async function connectGithub() {
    setAccountNote("");
    const response = await fetch("/api/github/connect", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ next: "/settings" }),
    });
    const body = (await response.json()) as { url?: string; error?: string };
    if (body.url) {
      window.location.href = body.url;
      return;
    }
    setAccountNote(body.error ?? "GitHub connect needs a signed-in account. Public import still works from Import.");
  }

  const keyFor = (provider: string) => keys.find((key) => key.provider === provider);

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 px-6 py-10 md:grid-cols-[12rem_1fr]">
      <nav aria-label="Settings" className="flex flex-col gap-1">
        {sections.map((item) => (
          <button
            key={item}
            type="button"
            aria-current={section === item ? "page" : undefined}
            onClick={() => setSection(item)}
            className={`rounded-sm px-2 py-1.5 text-left text-sm ${section === item ? "bg-accent-soft text-accent" : "text-text-muted"}`}
          >
            {item}
          </button>
        ))}
      </nav>
      <section>
        <h1 className="text-[32px] leading-10 font-medium">{section}</h1>
        {section === "Profile" ? (
          <form
            className="mt-4 max-w-md"
            onSubmit={(event) => {
              event.preventDefault();
              void save({ displayName }, "Name saved.").then((ok) => {
                if (ok) setSavedName(displayName);
              });
            }}
          >
            <p className="text-sm text-text-muted">This name shows in the sidebar and on Home. You are using a guest session.</p>
            <label className="mt-4 block text-sm" htmlFor="display-name">
              Display name
              <Input id="display-name" className="mt-1" value={displayName} onChange={(event) => setDisplayName(event.target.value)} />
            </label>
            <Button type="submit" className="mt-4" disabled={busy || displayName.trim().length === 0 || displayName === savedName}>
              Save name
            </Button>
          </form>
        ) : null}
        {section === "Mode" ? (
          <div className="mt-4 max-w-lg">
            <p className="text-sm text-text-muted">
              You are in {mode === "simple" ? "Simple" : "Developer"} mode.
              {mode === "simple" ? " Simple mode keeps the plan, agents, and preview." : " Developer mode adds code, terminal, database, env, and Git."}
            </p>
            <ModeSwitch mode={mode} />
            <fieldset className="mt-8">
              <legend className="text-sm font-medium">Appearance</legend>
              <div className="mt-2 flex gap-2" role="radiogroup" aria-label="Appearance">
                {(["system", "light", "dark"] as const).map((item) => (
                  <button
                    key={item}
                    type="button"
                    role="radio"
                    aria-checked={appearance === item}
                    onClick={() => applyAppearance(item)}
                    className={`rounded-full px-3 py-1 text-sm capitalize ${appearance === item ? "bg-accent-soft text-accent" : "text-text-muted"}`}
                  >
                    {item}
                  </button>
                ))}
              </div>
            </fieldset>
          </div>
        ) : null}
        {section === "Connected accounts" ? (
          <ul className="mt-4 flex max-w-lg flex-col gap-3 text-sm">
            <li className="rounded-md border border-border p-4">
              <h2 className="font-medium">Google</h2>
              <p className="mt-1 text-text-muted">Sign-in is turned off in this preview, so Google stays disconnected.</p>
            </li>
            <li className="rounded-md border border-border p-4">
              <h2 className="font-medium">GitHub</h2>
              <p className="mt-1 text-text-muted">
                {github?.login ? `Connected as ${github.login}${github.expired ? " (reconnect required)" : ""}.` : "Not connected. Public repositories can still be imported."}
              </p>
              <Button type="button" variant="outline" className="mt-3" onClick={() => void connectGithub()}>
                {github?.login ? "Reconnect GitHub" : "Connect GitHub"}
              </Button>
              {accountNote ? <p className="mt-2 text-text-muted">{accountNote}</p> : null}
            </li>
          </ul>
        ) : null}
        {section === "Model keys" ? (
          <form
            className="mt-4 max-w-md"
            onSubmit={(event) => {
              event.preventDefault();
              void save({ keys: draftKeys }, "Keys saved.").then((ok) => {
                if (!ok) return;
                setDraftKeys({});
                void fetch("/api/settings")
                  .then(async (response) => {
                    if (!response.ok) return;
                    const body = (await response.json()) as { keys: KeyState[] };
                    setKeys(body.keys);
                  });
              });
            }}
          >
            {keyProviders.map((provider) => {
              const saved = keyFor(provider.id);
              return (
                <label key={provider.id} className="mt-4 block text-sm" htmlFor={`${provider.id}-key`}>
                  <span className="flex items-center gap-2">
                    {provider.label}
                    {provider.id !== "groq" ? <span className="rounded-full bg-surface-2 px-2 py-0.5 text-xs text-text-muted">Coming soon</span> : null}
                  </span>
                  <Input
                    id={`${provider.id}-key`}
                    type="password"
                    className="mt-1"
                    autoComplete="off"
                    value={draftKeys[provider.id] ?? ""}
                    placeholder={saved?.stored ? `Saved ····${saved.last4}` : "Paste a key"}
                    onChange={(event) => setDraftKeys((current) => ({ ...current, [provider.id]: event.target.value }))}
                  />
                  <span className="mt-1 block text-text-muted">{provider.note}</span>
                  {saved?.stored ? (
                    <button
                      type="button"
                      className="mt-1 text-accent"
                      onClick={() => {
                        void save({ clearKey: provider.id }, `${provider.label} key removed.`).then(() => {
                          setKeys((current) => current.map((key) => (key.provider === provider.id ? { ...key, stored: false, last4: "" } : key)));
                        });
                      }}
                    >
                      Remove saved key
                    </button>
                  ) : null}
                </label>
              );
            })}
            <Button type="submit" className="mt-4" disabled={busy || Object.values(draftKeys).every((value) => !value?.trim())}>
              Save keys
            </Button>
          </form>
        ) : null}
        {section === "Integrations" ? (
          <div className="mt-4">
            <p className="max-w-xl text-sm text-text-muted">
              These services stay disconnected. A real connection needs sign-in on that service, and this preview does not open it. GitHub is the account that can be connected, under Connected accounts.
            </p>
            <ul className="mt-4 grid gap-3 sm:grid-cols-2">
              {integrations.map((item) => (
                <li key={item} className="rounded-md border border-border p-4">
                  <h2 className="text-sm font-medium">{item}</h2>
                  <p className="mt-1 text-sm text-text-muted">Not connected.</p>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-3"
                    onClick={() => setBlockedService(item)}
                  >
                    Connect
                  </Button>
                  {blockedService === item ? (
                    <p className="mt-2 text-sm text-text-muted" role="status">
                      {item} stays disconnected. This preview cannot sign in to {item}.
                    </p>
                  ) : null}
                </li>
              ))}
            </ul>
            <form
              className="mt-4 max-w-lg rounded-md border border-border p-4"
              onSubmit={(event) => {
                event.preventDefault();
                void save({ mcp: { name: mcpName, url: mcpUrl } }, "Server saved. It is not called.").then((ok) => {
                  if (!ok) return;
                  setServers((current) => [...current, { id: "pending", name: mcpName, url: mcpUrl }]);
                  setMcpName("");
                  setMcpUrl("");
                  void fetch("/api/settings")
                    .then(async (response) => {
                      if (!response.ok) return;
                      const body = (await response.json()) as { mcp: McpServer[] };
                      setServers(body.mcp);
                    });
                });
              }}
            >
              <h2 className="text-sm font-medium">MCP servers</h2>
              <p className="mt-1 text-sm text-text-muted">A saved URL is a note for this workspace. Architect does not call the server or load its tools.</p>
              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <label className="text-sm">
                  Name
                  <Input className="mt-1" value={mcpName} onChange={(event) => setMcpName(event.target.value)} />
                </label>
                <label className="text-sm">
                  URL
                  <Input className="mt-1" value={mcpUrl} placeholder="https://example.com/mcp" onChange={(event) => setMcpUrl(event.target.value)} />
                </label>
              </div>
              <Button type="submit" variant="outline" className="mt-3" disabled={busy || mcpName.trim().length === 0 || mcpUrl.trim().length === 0}>
                Add server
              </Button>
              <ul className="mt-3 flex flex-col gap-2">
                {servers.map((server) => (
                  <li key={server.id} className="flex items-center justify-between gap-3 text-sm">
                    <span>
                      <span className="font-medium">{server.name}</span>
                      <span className="mt-0.5 block text-text-muted">{server.url}</span>
                    </span>
                    <button
                      type="button"
                      className="text-accent"
                      onClick={() => {
                        void save({ removeMcp: server.id }, "Server removed.").then((ok) => {
                          if (ok) setServers((current) => current.filter((item) => item.id !== server.id));
                        });
                      }}
                    >
                      Remove
                    </button>
                  </li>
                ))}
              </ul>
            </form>
          </div>
        ) : null}
        {section === "Danger zone" ? (
          <div className="mt-4 max-w-lg">
            <p className="text-sm text-text-muted">Signing out clears this browser session and returns you to Home. Deleting an account is not available in this preview.</p>
            <form action={signOut} className="mt-4">
              <Button type="submit" variant="destructive">
                Sign out
              </Button>
            </form>
            <a href="/cli" className="mt-4 inline-block text-sm text-accent">
              API and CLI
            </a>
          </div>
        ) : null}
      </section>
    </div>
  );
}

function ModeSwitch({ mode }: { mode: Mode }) {
  return (
    <form action={setMode} className="mt-4">
      <input type="hidden" name="mode" value={mode === "simple" ? "developer" : "simple"} />
      <Button type="submit">Switch to {mode === "simple" ? "Developer" : "Simple"} mode</Button>
    </form>
  );
}
