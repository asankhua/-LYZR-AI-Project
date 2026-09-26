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

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-4">
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
  );
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block text-sm">
      {label}
      {children}
    </label>
  );
}
