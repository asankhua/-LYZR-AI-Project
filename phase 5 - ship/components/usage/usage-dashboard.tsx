"use client";

import { useEffect, useState } from "react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Summary = {
  totals: { tokens: number; credits: number; costUsd: number };
  byStage: { stage: string; tokens: number }[];
  byProject: { name: string; tokens: number }[];
};

export function UsageDashboard({ showLimit }: { showLimit: boolean }) {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    void fetch("/api/usage")
      .then(async (response) => {
        if (!response.ok) throw new Error("Could not load usage.");
        setSummary((await response.json()) as Summary);
      })
      .catch(() => setError("Could not load usage."));
  }, []);

  return (
    <div className="mx-auto w-full max-w-5xl px-6 py-10">
      <h1 className="text-[32px] leading-10 font-medium">Usage</h1>
      <p className="mt-1 text-sm text-text-muted">Token counts from builds. Credit price is a fixed estimate.</p>
      {showLimit ? (
        <article className="mt-4 rounded-md border border-warning bg-surface p-4">
          <h2 className="text-sm font-medium">You are near the rate limit</h2>
          <p className="mt-1 text-sm text-text-muted">Wait a minute, then try the build again.</p>
        </article>
      ) : null}
      {error ? <p className="mt-4 text-sm text-danger">{error}</p> : null}
      {!summary && !error ? <p className="mt-4 text-sm text-text-muted">Loading usage…</p> : null}
      {summary ? (
        <>
          <div className="mt-6 grid gap-3 sm:grid-cols-4">
            <Kpi label="Tokens" value={summary.totals.tokens.toLocaleString()} />
            <Kpi label="Credits" value={String(summary.totals.credits)} />
            <Kpi label="Estimated cost" value={`$${summary.totals.costUsd.toFixed(2)}`} />
            <Kpi label="Plan" value="Free" />
          </div>
          <h2 className="mt-8 text-sm font-medium">Tokens by stage</h2>
          {summary.byStage.length === 0 ? (
            <p className="mt-2 text-sm text-text-muted">Usage appears after the first build.</p>
          ) : (
            <div className="mt-3 h-56 rounded-md border border-border bg-surface p-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={summary.byStage}>
                  <XAxis dataKey="stage" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="tokens" fill="var(--color-accent)" radius={4} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
          <h2 className="mt-8 text-sm font-medium">By project</h2>
          <table className="mt-3 w-full text-left text-sm">
            <thead className="text-text-muted">
              <tr>
                <th className="py-2 font-medium">Project</th>
                <th className="py-2 font-medium">Tokens</th>
              </tr>
            </thead>
            <tbody>
              {summary.byProject.map((row) => (
                <tr key={row.name} className="border-t border-border">
                  <td className="py-2">{row.name}</td>
                  <td className="py-2 font-mono">{row.tokens.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-6 text-sm text-text-muted">Upgrade options are not available on this plan.</p>
        </>
      ) : null}
    </div>
  );
}

function Kpi({ label, value }: { label: string; value: string }) {
  return (
    <article className="rounded-md border border-border bg-surface p-4">
      <p className="text-sm text-text-muted">{label}</p>
      <p className="mt-1 text-lg font-medium">{value}</p>
    </article>
  );
}
