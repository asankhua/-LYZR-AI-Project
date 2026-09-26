"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

const sinks = ["Refund replies", "Status updates", "Meeting notes", "Lead research"];
const tools = ["Zendesk", "Gmail", "Notion", "Slack"];

type Idea = { title: string; description: string; hoursSavedPerWeek: number; prompt: string };

export function ConsultantWizard() {
  const router = useRouter();
  const [role, setRole] = useState("Support lead");
  const [timeSinks, setTimeSinks] = useState<string[]>(["Refund replies"]);
  const [pickedTools, setTools] = useState<string[]>(["Zendesk"]);
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  function toggle(list: string[], value: string, set: (next: string[]) => void) {
    set(list.includes(value) ? list.filter((item) => item !== value) : [...list, value]);
  }

  async function ask() {
    setPending(true);
    setError("");
    const response = await fetch("/api/consultant", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ role, timeSinks, tools: pickedTools }),
    });
    setPending(false);
    if (!response.ok) {
      setError("Could not suggest ideas. Try again.");
      return;
    }
    const body = (await response.json()) as { ideas: Idea[] };
    setIdeas(body.ideas);
    sessionStorage.setItem("architect-ideas", JSON.stringify(body.ideas));
  }

  return (
    <div className="mx-auto grid w-full max-w-5xl gap-8 px-6 py-10 lg:grid-cols-[1fr_20rem]">
      <section>
        <p className="font-mono text-xs text-text-muted">AI Consultant</p>
        <h1 className="mt-1 text-[32px] leading-10 font-medium">What takes up most of your week?</h1>
        <label className="mt-6 block text-sm" htmlFor="role">
          Your role
          <input
            id="role"
            value={role}
            onChange={(event) => setRole(event.target.value)}
            className="mt-1 h-9 w-full rounded-sm border border-border bg-surface px-3 text-sm outline-none"
          />
        </label>
        <fieldset className="mt-6">
          <legend className="text-sm font-medium">Time sinks</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {sinks.map((sink) => (
              <button
                key={sink}
                type="button"
                aria-pressed={timeSinks.includes(sink)}
                onClick={() => toggle(timeSinks, sink, setTimeSinks)}
                className={`rounded-full border px-3 py-1 text-sm ${timeSinks.includes(sink) ? "border-accent bg-accent-soft text-accent" : "border-border"}`}
              >
                {sink}
              </button>
            ))}
          </div>
        </fieldset>
        <fieldset className="mt-6">
          <legend className="text-sm font-medium">Tools</legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {tools.map((tool) => (
              <button
                key={tool}
                type="button"
                aria-pressed={pickedTools.includes(tool)}
                onClick={() => toggle(pickedTools, tool, setTools)}
                className={`rounded-full border px-3 py-1 text-sm ${pickedTools.includes(tool) ? "border-accent bg-accent-soft text-accent" : "border-border"}`}
              >
                {tool}
              </button>
            ))}
          </div>
        </fieldset>
        {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
        <Button type="button" className="mt-6" disabled={pending || timeSinks.length === 0 || role.trim().length === 0} onClick={() => void ask()}>
          {pending ? "Looking…" : "Continue"}
        </Button>
      </section>
      <aside>
        <h2 className="text-sm font-medium">Ideas for you</h2>
        <div className="mt-3 flex flex-col gap-3">
          {ideas.length === 0 ? <p className="text-sm text-text-muted">Ideas show up here after you continue.</p> : null}
          {ideas.map((idea) => (
            <Card key={idea.title} className="p-4">
              <h3 className="text-sm font-medium">{idea.title}</h3>
              <p className="mt-1 text-sm text-text-muted">{idea.description}</p>
              <p className="mt-2 font-mono text-[11px] text-success">Saves ~{idea.hoursSavedPerWeek} hrs/wk</p>
              <button
                type="button"
                className="mt-3 text-sm font-medium text-accent"
                onClick={() => {
                  sessionStorage.setItem("architect-prompt", idea.prompt);
                  router.push("/home");
                }}
              >
                Use this
              </button>
            </Card>
          ))}
        </div>
      </aside>
    </div>
  );
}
