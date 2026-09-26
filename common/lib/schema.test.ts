import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const sql = readFileSync(new URL("../supabase/migrations/0001_init.sql", import.meta.url), "utf8");

const tables = [
  "profiles",
  "projects",
  "project_members",
  "project_files",
  "snapshots",
  "file_blobs",
  "messages",
  "plans",
  "agents",
  "project_env",
  "integrations",
  "deployments",
  "usage_events",
  "agent_runs",
  "knowledge_chunks",
];

describe("initial migration", () => {
  it("creates every table and turns on row level security", () => {
    for (const table of tables) {
      expect(sql).toContain(`create table ${table}`);
      expect(sql).toContain(`alter table ${table} enable row level security`);
    }
  });

  it("defines membership, the profile trigger and the three buckets", () => {
    expect(sql).toContain("create function is_member");
    expect(sql).toContain("on_auth_user_created");
    expect(sql).toContain("'uploads'");
    expect(sql).toContain("'exports'");
    expect(sql).toContain("'avatars'");
  });
});
