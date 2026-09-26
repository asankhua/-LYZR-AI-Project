"use client";

import type { ReactNode } from "react";
import type { PlanDoc } from "@/lib/types";

function lines(value: string) {
  return value.split("\n").map((line) => line.trim()).filter(Boolean);
}

export function PlanView({
  plan,
  onChange,
  onCommit,
}: {
  plan: PlanDoc | null;
  onChange: (plan: PlanDoc) => void;
  onCommit: (plan: PlanDoc) => void;
}) {
  if (!plan) {
    return (
      <div className="mx-auto max-w-lg rounded-md border border-dashed border-border p-8 text-center">
        <h2 className="text-base font-medium">Your plan will appear here</h2>
        <p className="mt-2 text-sm text-text-muted">
          Architect writes the plan from your prompt, section by section. You approve it before any code is generated.
        </p>
      </div>
    );
  }

  const manager = plan.agents.find((agent) => agent.name === "Manager") ?? plan.agents[0];
  const helpers = plan.agents.filter((agent) => agent !== manager);

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <section aria-label="Architecture">
        <h2 className="text-base font-medium">Architecture</h2>
        <p className="mt-2 text-sm text-text-muted">
          {plan.title} is for {plan.audience}. The interface is {plan.screens.length} screen{plan.screens.length === 1 ? "" : "s"}.
          {manager ? ` ${manager.name} coordinates ${helpers.length ? helpers.map((agent) => agent.name).join(", ") : "the work"}.` : ""}
          {plan.dataModel.length ? ` Records live in ${plan.dataModel.map((row) => row.collection).join(", ")}.` : ""}
          {plan.integrations.length ? ` It connects to ${plan.integrations.join(", ")}.` : " It runs without an outside integration."}
        </p>
        <div className="mt-4 flex flex-col gap-2" aria-label="Architecture diagram">
          <DiagramNode kicker="User" title={plan.audience} />
          <DiagramArrow />
          <div className="grid gap-2 sm:grid-cols-2">
            {plan.screens.map((screen) => (
              <DiagramNode key={screen.name} kicker="Screen" title={screen.name} detail={screen.purpose} />
            ))}
          </div>
          <DiagramArrow />
          <div className="grid gap-2 sm:grid-cols-2">
            {plan.agents.map((agent) => (
              <DiagramNode key={agent.name} kicker={agent === manager ? "Manager" : "Agent"} title={agent.name} detail={agent.role} />
            ))}
          </div>
          <DiagramArrow />
          <div className="grid gap-2 sm:grid-cols-2">
            {plan.dataModel.map((row) => (
              <DiagramNode key={row.collection} kicker="Data" title={row.collection} detail={row.fields.join(", ")} />
            ))}
          </div>
        </div>
        <ol className="mt-4 flex flex-wrap gap-2" aria-label="User journey">
          {plan.userJourney.map((step, index) => (
            <li key={`${index}-${step}`} className="rounded-full border border-border bg-surface-2 px-3 py-1 text-sm">
              {index + 1}. {step}
            </li>
          ))}
        </ol>
      </section>
      <section aria-label="Features">
        <h2 className="text-base font-medium">Features</h2>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {plan.screens.map((screen) => (
            <li key={screen.name} className="rounded-md border border-border bg-surface p-3">
              <h3 className="font-medium">{screen.name}</h3>
              <p className="mt-1 text-sm text-text-muted">{screen.purpose}</p>
              {screen.components.length ? (
                <ul className="mt-3 flex flex-wrap gap-2">
                  {screen.components.map((component) => (
                    <li key={component} className="rounded-full bg-accent-soft px-2 py-1 text-xs text-accent">
                      {component}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ul>
      </section>
      <div className="flex flex-col gap-4">
      <Field label="Summary">
        <textarea
          className="mt-1 w-full rounded-sm border border-border px-3 py-2"
          rows={4}
          value={plan.summary}
          onChange={(event) => onChange({ ...plan, summary: event.target.value })}
          onBlur={(event) => {
            const summary = event.target.value.trim();
            if (summary) onCommit({ ...plan, summary });
          }}
        />
      </Field>
      <Field label="Who it's for">
        <input
          className="mt-1 h-9 w-full rounded-sm border border-border px-3"
          value={plan.audience}
          onChange={(event) => onChange({ ...plan, audience: event.target.value })}
          onBlur={(event) => {
            const audience = event.target.value.trim();
            if (audience) onCommit({ ...plan, audience });
          }}
        />
      </Field>
      <Field label="User journey">
        <textarea
          className="mt-1 w-full rounded-sm border border-border px-3 py-2"
          rows={4}
          defaultValue={plan.userJourney.join("\n")}
          onBlur={(event) => {
            const userJourney = lines(event.target.value);
            if (userJourney.length) onCommit({ ...plan, userJourney });
          }}
        />
      </Field>
      <Field label="Screens">
        <textarea
          className="mt-1 w-full rounded-sm border border-border px-3 py-2"
          rows={3}
          defaultValue={plan.screens.map((screen) => `${screen.name}: ${screen.purpose}`).join("\n")}
          onBlur={(event) => {
            const screens = lines(event.target.value).map((line) => {
              const [name, ...rest] = line.split(":");
              const existing = plan.screens.find((screen) => screen.name === name.trim());
              return {
                name: name.trim(),
                purpose: rest.join(":").trim() || existing?.purpose || "Shown in the app",
                components: existing?.components ?? [],
              };
            });
            if (screens.length) onCommit({ ...plan, screens });
          }}
        />
      </Field>
      <Field label="Agents in the plan">
        <textarea
          className="mt-1 w-full rounded-sm border border-border px-3 py-2"
          rows={3}
          defaultValue={plan.agents.map((agent) => `${agent.name}: ${agent.role}`).join("\n")}
          onBlur={(event) => {
            const agents = lines(event.target.value).map((line) => {
              const [name, ...rest] = line.split(":");
              return { name: name.trim(), role: rest.join(":").trim() || "Helps with this app" };
            });
            if (agents.some((agent) => agent.name === "Manager") && agents.length > 1) onCommit({ ...plan, agents });
          }}
        />
      </Field>
      <Field label="Data">
        <textarea
          className="mt-1 w-full rounded-sm border border-border px-3 py-2"
          rows={2}
          defaultValue={plan.dataModel.map((row) => `${row.collection}: ${row.fields.join(", ")}`).join("\n")}
          onBlur={(event) => {
            const dataModel = lines(event.target.value).map((line) => {
              const [collection, ...rest] = line.split(":");
              const fields = rest.join(":").split(",").map((field) => field.trim()).filter(Boolean);
              return { collection: collection.trim(), fields: fields.length ? fields : ["id"] };
            });
            if (dataModel.length) onCommit({ ...plan, dataModel });
          }}
        />
      </Field>
      <Field label="Integrations">
        <textarea
          className="mt-1 w-full rounded-sm border border-border px-3 py-2"
          rows={2}
          defaultValue={plan.integrations.join("\n")}
          onBlur={(event) => onCommit({ ...plan, integrations: lines(event.target.value) })}
        />
      </Field>
      <Field label="Open questions">
        <textarea
          className="mt-1 w-full rounded-sm border border-border px-3 py-2"
          rows={2}
          defaultValue={plan.openQuestions.join("\n")}
          onBlur={(event) => onCommit({ ...plan, openQuestions: lines(event.target.value) })}
        />
      </Field>
      </div>
    </div>
  );
}

function DiagramNode({ kicker, title, detail }: { kicker: string; title: string; detail?: string }) {
  return (
    <div className="rounded-md border border-border bg-surface px-3 py-2">
      <p className="text-xs font-medium text-accent">{kicker}</p>
      <p className="mt-1 text-sm font-medium">{title}</p>
      {detail ? <p className="mt-1 text-sm text-text-muted">{detail}</p> : null}
    </div>
  );
}

function DiagramArrow() {
  return <p className="text-center text-sm text-text-muted" aria-hidden>↓</p>;
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm">
      {label}
      {children}
    </label>
  );
}
