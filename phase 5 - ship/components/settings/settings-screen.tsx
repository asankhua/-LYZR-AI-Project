"use client";

import { useState } from "react";
import { toast } from "sonner";
import { setMode } from "@/lib/actions";
import type { Mode } from "@/lib/types";
import { Button } from "@/components/ui/button";

const sections = ["Profile", "Mode", "Connected accounts", "Model keys", "Integrations", "Danger zone"] as const;

export function SettingsScreen({ name, mode }: { name: string | null; mode: Mode }) {
  const [section, setSection] = useState<(typeof sections)[number]>("Profile");
  const [dark, setDark] = useState(false);
  const [groqKey, setGroqKey] = useState("");

  function toggleTheme() {
    const next = !document.documentElement.classList.contains("dark");
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

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
          <p className="mt-3 text-sm">Signed in as {name ?? "Guest"}.</p>
        ) : null}
        {section === "Mode" ? (
          <form action={setMode} className="mt-4">
            <input type="hidden" name="mode" value={mode === "simple" ? "developer" : "simple"} />
            <p className="text-sm text-text-muted">You are in {mode === "simple" ? "Simple" : "Developer"} mode.</p>
            <Button type="submit" className="mt-3">
              Switch to {mode === "simple" ? "Developer" : "Simple"} mode
            </Button>
            <div className="mt-6">
              <button type="button" className="text-sm font-medium text-accent" onClick={toggleTheme} aria-pressed={dark}>
                {dark ? "Use light mode" : "Use dark mode"}
              </button>
            </div>
          </form>
        ) : null}
        {section === "Connected accounts" ? (
          <ul className="mt-4 flex flex-col gap-2 text-sm">
            <li className="rounded-md border border-border p-3">Google — connect from the sign-in page.</li>
            <li className="rounded-md border border-border p-3">GitHub — connect from the Git tab.</li>
          </ul>
        ) : null}
        {section === "Model keys" ? (
          <form
            className="mt-4 max-w-md"
            onSubmit={(event) => {
              event.preventDefault();
              toast("Groq key saved for this browser session.");
              sessionStorage.setItem("architect-byok", "1");
              setGroqKey("");
            }}
          >
            <label className="block text-sm" htmlFor="groq-key">
              Groq API key
              <input
                id="groq-key"
                type="password"
                value={groqKey}
                onChange={(event) => setGroqKey(event.target.value)}
                className="mt-1 h-9 w-full rounded-sm border border-border bg-surface px-3 text-sm outline-none"
                autoComplete="off"
              />
            </label>
            <Button type="submit" variant="outline" className="mt-3" disabled={groqKey.trim().length === 0}>
              Save Groq key
            </Button>
            <p className="mt-4 text-sm text-text-muted">OpenAI and Anthropic keys can be stored later. They are marked coming soon.</p>
          </form>
        ) : null}
        {section === "Integrations" ? (
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {["Gmail", "Slack", "Notion", "HubSpot"].map((name) => (
              <article key={name} className="rounded-md border border-border p-4">
                <h2 className="text-sm font-medium">{name}</h2>
                <button type="button" className="mt-2 text-sm text-accent" onClick={() => toast(`${name} connect is a preview. Nothing is linked.`)}>
                  Connect
                </button>
              </article>
            ))}
            <article className="rounded-md border border-border p-4 sm:col-span-2">
              <h2 className="text-sm font-medium">MCP servers</h2>
              <p className="mt-1 text-sm text-text-muted">Add a server URL. Tools stay mocked until a later connection.</p>
              <button type="button" className="mt-2 text-sm text-accent" onClick={() => toast("MCP server saved as a preview.")}>
                Add server
              </button>
            </article>
          </div>
        ) : null}
        {section === "Danger zone" ? (
          <div className="mt-4">
            <a href="/cli" className="text-sm text-accent">
              API and CLI
            </a>
            <p className="mt-4 text-sm text-text-muted">Deleting the account is not available in this preview.</p>
          </div>
        ) : null}
      </section>
    </div>
  );
}
