import { createHash } from "node:crypto";
import {
  demoAddMessage,
  demoAddRun,
  demoAddSnapshot,
  demoAddUsage,
  demoApplyFiles,
  demoApprovePlan,
  demoGetPlan,
  demoListAgents,
  demoListFiles,
  demoListRuns,
  demoRecentTokens,
  demoReplaceAgents,
  demoSavePlan,
  demoSetStage,
  demoUpdateAgent,
} from "@/lib/demo/store";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { AgentRun, AgentSpec, ChangePlan, PlanDoc, ProjectFile, ProjectMessage, Snapshot, Stage } from "@/lib/types";

export function contentSha(content: string): string {
  return createHash("sha1").update(content).digest("hex");
}

export async function getPlan(projectId: string) {
  if (!isSupabaseConfigured()) return demoGetPlan(projectId);
  const supabase = await createClient();
  const { data } = await supabase.from("plans").select("doc, approved_at, version").eq("project_id", projectId).maybeSingle();
  if (!data) return null;
  return { projectId, doc: data.doc as PlanDoc, approvedAt: data.approved_at, version: data.version as number };
}

export async function savePlan(projectId: string, doc: PlanDoc) {
  if (!isSupabaseConfigured()) return demoSavePlan(projectId, doc);
  const supabase = await createClient();
  const existing = await getPlan(projectId);
  if (existing) {
    await supabase
      .from("plans")
      .update({ doc, version: existing.version + 1, updated_at: new Date().toISOString() })
      .eq("project_id", projectId);
    return;
  }
  await supabase.from("plans").insert({ project_id: projectId, doc });
}

export async function approvePlan(projectId: string) {
  if (!isSupabaseConfigured()) return demoApprovePlan(projectId);
  const supabase = await createClient();
  await supabase.from("plans").update({ approved_at: new Date().toISOString() }).eq("project_id", projectId);
  await supabase.from("projects").update({ stage: "agents", updated_at: new Date().toISOString() }).eq("id", projectId);
}

export async function setStage(projectId: string, stage: Stage) {
  if (!isSupabaseConfigured()) return demoSetStage(projectId, stage);
  const supabase = await createClient();
  await supabase.from("projects").update({ stage, updated_at: new Date().toISOString() }).eq("id", projectId);
}

export async function listAgents(projectId: string): Promise<AgentSpec[]> {
  if (!isSupabaseConfigured()) return demoListAgents(projectId);
  const supabase = await createClient();
  const { data } = await supabase.from("agents").select("id, name, spec, position").eq("project_id", projectId);
  return (data ?? []).map((row) => ({
    ...(row.spec as Omit<AgentSpec, "id" | "projectId" | "position">),
    id: row.id,
    projectId,
    position: (row.position as AgentSpec["position"]) ?? { x: 0, y: 0 },
  }));
}

export async function replaceAgents(projectId: string, agents: AgentSpec[]) {
  if (!isSupabaseConfigured()) return demoReplaceAgents(projectId, agents);
  const supabase = await createClient();
  await supabase.from("agents").delete().eq("project_id", projectId);
  if (agents.length === 0) return;
  await supabase.from("agents").insert(
    agents.map((agent) => ({
      id: agent.id,
      project_id: projectId,
      name: agent.name,
      spec: agent,
      position: agent.position,
    })),
  );
}

export async function updateAgent(projectId: string, spec: AgentSpec) {
  if (!isSupabaseConfigured()) return demoUpdateAgent(projectId, spec.id, spec);
  const supabase = await createClient();
  await supabase.from("agents").update({ spec, position: spec.position, name: spec.name }).eq("id", spec.id);
  return spec;
}

export async function listFiles(projectId: string): Promise<ProjectFile[]> {
  if (!isSupabaseConfigured()) return demoListFiles(projectId);
  const supabase = await createClient();
  const { data } = await supabase.from("project_files").select("path, content, sha").eq("project_id", projectId);
  return (data ?? []).map((row) => ({ projectId, path: row.path, content: row.content, sha: row.sha }));
}

export async function applyFiles(projectId: string, files: { path: string; content: string }[]) {
  const rows: ProjectFile[] = files.map((file) => ({
    projectId,
    path: file.path,
    content: file.content,
    sha: contentSha(file.content),
  }));
  if (!isSupabaseConfigured()) {
    await demoApplyFiles(projectId, rows);
    return rows;
  }
  const supabase = await createClient();
  for (const row of rows) {
    await supabase.from("project_files").upsert({
      project_id: projectId,
      path: row.path,
      content: row.content,
      sha: row.sha,
      updated_at: new Date().toISOString(),
    });
  }
  return rows;
}

export async function addSnapshot(projectId: string, userId: string, summary: string, manifest: Record<string, string>) {
  const snapshot: Snapshot = {
    id: crypto.randomUUID(),
    projectId,
    summary,
    manifest,
    createdAt: new Date().toISOString(),
  };
  if (!isSupabaseConfigured()) {
    await demoAddSnapshot(snapshot);
    return snapshot;
  }
  const supabase = await createClient();
  const { data } = await supabase
    .from("snapshots")
    .insert({ project_id: projectId, summary, manifest, created_by: userId })
    .select("id, created_at")
    .single();
  return { ...snapshot, id: data?.id ?? snapshot.id, createdAt: data?.created_at ?? snapshot.createdAt };
}

export async function addRun(run: AgentRun) {
  if (!isSupabaseConfigured()) return demoAddRun(run);
  const supabase = await createClient();
  await supabase.from("agent_runs").insert({
    id: run.id,
    project_id: run.projectId,
    agent_name: run.agentName,
    source: run.source,
    input: run.input,
    output: run.output,
    steps: run.steps,
    input_tokens: run.inputTokens,
    output_tokens: run.outputTokens,
    duration_ms: run.durationMs,
    status: run.status,
  });
  if (run.status === "ok") {
    const agents = await listAgents(run.projectId);
    const agent = agents.find((item) => item.name === run.agentName);
    if (agent) await updateAgent(run.projectId, { ...agent, testPassed: true });
  }
  return run;
}

export async function listRuns(projectId: string, agentName: string) {
  if (!isSupabaseConfigured()) return demoListRuns(projectId, agentName);
  const supabase = await createClient();
  const { data } = await supabase
    .from("agent_runs")
    .select("id, agent_name, source, input, output, steps, input_tokens, output_tokens, duration_ms, status, created_at")
    .eq("project_id", projectId)
    .eq("agent_name", agentName);
  return (data ?? []).map((row) => ({
    id: row.id,
    projectId,
    agentName: row.agent_name,
    source: row.source,
    input: row.input ?? "",
    output: row.output ?? "",
    steps: row.steps ?? [],
    inputTokens: row.input_tokens ?? 0,
    outputTokens: row.output_tokens ?? 0,
    durationMs: row.duration_ms ?? 0,
    status: row.status,
    createdAt: row.created_at,
  })) as AgentRun[];
}

export async function addUsage(input: {
  userId: string;
  projectId: string;
  stage: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
}) {
  if (!isSupabaseConfigured()) {
    await demoAddUsage({ id: crypto.randomUUID(), createdAt: new Date().toISOString(), ...input });
    return;
  }
  const supabase = await createClient();
  await supabase.from("usage_events").insert({
    user_id: input.userId,
    project_id: input.projectId,
    stage: input.stage,
    model: input.model,
    input_tokens: input.inputTokens,
    output_tokens: input.outputTokens,
  });
}

export async function recentTokens(userId: string): Promise<number> {
  const since = Date.now() - 60_000;
  if (!isSupabaseConfigured()) return demoRecentTokens(userId, since);
  const supabase = await createClient();
  const { data } = await supabase
    .from("usage_events")
    .select("input_tokens, output_tokens, created_at")
    .eq("user_id", userId)
    .gte("created_at", new Date(since).toISOString());
  return (data ?? []).reduce((sum, row) => sum + row.input_tokens + row.output_tokens, 0);
}

export async function addMessage(message: ProjectMessage) {
  if (!isSupabaseConfigured()) return demoAddMessage(message);
  const supabase = await createClient();
  await supabase.from("messages").insert({
    id: message.id,
    project_id: message.projectId,
    role: message.role,
    content: message.content,
    created_by: null,
  });
}

export type { ChangePlan };
