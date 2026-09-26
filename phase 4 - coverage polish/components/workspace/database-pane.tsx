"use client";

import type { PlanDoc, ProjectFile } from "@/lib/types";

export function DatabasePane({ plan, files }: { plan: PlanDoc | null; files: ProjectFile[] }) {
  const collections = plan?.dataModel ?? [];
  const dataFile = files.find((file) => file.path.endsWith("data.json"));
  let rows: string[] = [];
  if (dataFile) {
    try {
      const parsed = JSON.parse(dataFile.content) as unknown;
      rows = Array.isArray(parsed) ? parsed.map((row) => JSON.stringify(row)) : [JSON.stringify(parsed)];
    } catch {
      rows = [];
    }
  }
  if (collections.length === 0 && rows.length === 0) {
    return (
      <div className="p-6">
        <h2 className="text-sm font-medium">No collections yet</h2>
        <p className="mt-1 text-sm text-text-muted">Collections from the plan show up here after you approve it.</p>
      </div>
    );
  }
  return (
    <div className="flex flex-col gap-4 p-6">
      {collections.map((collection) => (
        <section key={collection.collection}>
          <h2 className="text-sm font-medium">{collection.collection}</h2>
          <p className="mt-1 font-mono text-xs text-text-muted">{collection.fields.join(", ")}</p>
        </section>
      ))}
      {rows.length > 0 ? (
        <ul className="font-mono text-xs">
          {rows.slice(0, 8).map((row) => (
            <li key={row} className="border-t border-border py-2">
              {row}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-text-muted">No documents yet. The generated app stores them as local JSON.</p>
      )}
    </div>
  );
}
