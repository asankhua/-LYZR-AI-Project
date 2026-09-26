import {
  demoAddDeployment,
  demoAddHit,
  demoDeployTimes,
  demoFindByPublicKey,
  demoGetAccount,
  demoGetDeployment,
  demoGetShip,
  demoRenameProject,
  demoListDeployments,
  demoPromote,
  demoRecentHits,
  demoSaveAccount,
  demoSetCommit,
  demoSubdomainTaken,
  demoUpdateDeployment,
  demoUpdateShip,
} from "@/lib/demo/ship";
import { decryptString, encryptString, encryptionKey } from "@/lib/security/crypto";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Deployment, DeploymentStatus, GitHubAccount, ShipMeta } from "@/lib/types";

function bytea(value: string) {
  return `\\x${Buffer.from(value, "utf8").toString("hex")}`;
}

export async function renameProject(projectId: string, name: string) {
  if (!isSupabaseConfigured()) return demoRenameProject(projectId, name);
  const supabase = await createClient();
  await supabase.from("projects").update({ name, updated_at: new Date().toISOString() }).eq("id", projectId);
}

export async function getShipMeta(projectId: string): Promise<ShipMeta> {
  if (!isSupabaseConfigured()) return demoGetShip(projectId);
  const supabase = await createClient();
  const full = await supabase
    .from("projects")
    .select("github_repo, github_branch, public_key, github_auto_commit, code_only, github_conflict, github_auto_push_at")
    .eq("id", projectId)
    .maybeSingle();
  const row = full.data ?? (await supabase.from("projects").select("github_repo, github_branch, public_key").eq("id", projectId).maybeSingle()).data;
  return {
    projectId,
    githubRepo: row?.github_repo ?? null,
    githubBranch: row?.github_branch ?? "main",
    autoCommit: Boolean(full.data?.github_auto_commit),
    publicKey: row?.public_key ?? "",
    codeOnly: Boolean(full.data?.code_only),
    conflict: Boolean(full.data?.github_conflict),
    lastAutoPushAt: full.data?.github_auto_push_at ?? null,
  };
}

export async function updateShipMeta(projectId: string, patch: Partial<ShipMeta>) {
  if (!isSupabaseConfigured()) return demoUpdateShip(projectId, patch);
  const supabase = await createClient();
  const row: Record<string, unknown> = { updated_at: new Date().toISOString() };
  if ("githubRepo" in patch) row.github_repo = patch.githubRepo;
  if ("githubBranch" in patch) row.github_branch = patch.githubBranch;
  if ("autoCommit" in patch) row.github_auto_commit = patch.autoCommit;
  if ("publicKey" in patch) row.public_key = patch.publicKey;
  if ("codeOnly" in patch) row.code_only = patch.codeOnly;
  if ("conflict" in patch) row.github_conflict = patch.conflict;
  if ("lastAutoPushAt" in patch) row.github_auto_push_at = patch.lastAutoPushAt;
  await supabase.from("projects").update(row).eq("id", projectId);
  return getShipMeta(projectId);
}

export async function rotatePublicKey(projectId: string) {
  const next = (await import("node:crypto")).randomBytes(16).toString("hex");
  const ship = await updateShipMeta(projectId, { publicKey: next });
  return ship.publicKey;
}

export async function getGithubAccount(userId: string): Promise<GitHubAccount | null> {
  if (!isSupabaseConfigured()) return demoGetAccount(userId);
  const supabase = await createClient();
  const { data } = await supabase.from("integrations").select("account_login, access_token_encrypted, meta").eq("user_id", userId).eq("provider", "github").maybeSingle();
  if (!data) return null;
  const meta = (data.meta ?? {}) as { expired?: boolean; ciphertext?: string };
  return {
    userId,
    login: data.account_login,
    tokenEncrypted: meta.ciphertext ?? null,
    expired: Boolean(meta.expired),
  };
}

export async function saveGithubAccount(userId: string, token: string, login: string | null) {
  const tokenEncrypted = encryptString(token, encryptionKey());
  const account: GitHubAccount = { userId, login, tokenEncrypted, expired: false };
  if (!isSupabaseConfigured()) {
    await demoSaveAccount(account);
    return;
  }
  const supabase = await createClient();
  await supabase.from("integrations").upsert({
    user_id: userId,
    provider: "github",
    access_token_encrypted: bytea(tokenEncrypted),
    account_login: login,
    scopes: ["repo"],
    meta: { expired: false, ciphertext: tokenEncrypted },
    updated_at: new Date().toISOString(),
  });
}

export async function markGithubExpired(userId: string) {
  const account = await getGithubAccount(userId);
  if (!account) return;
  if (!isSupabaseConfigured()) {
    await demoSaveAccount({ ...account, expired: true });
    return;
  }
  const supabase = await createClient();
  await supabase.from("integrations").update({ meta: { expired: true, ciphertext: account.tokenEncrypted } }).eq("user_id", userId).eq("provider", "github");
}

export function readGithubToken(account: GitHubAccount | null): string | null {
  if (!account?.tokenEncrypted || account.expired) return null;
  try {
    return decryptString(account.tokenEncrypted, encryptionKey());
  } catch {
    return null;
  }
}

export async function projectHasAgent(projectId: string, name: string) {
  if (!isSupabaseConfigured()) {
    const { demoListAgents } = await import("@/lib/demo/store");
    return (await demoListAgents(projectId)).some((agent) => agent.name === name);
  }
  const admin = (await import("@/lib/supabase/admin")).createAdmin();
  if (!admin) return false;
  const { data } = await admin.from("agents").select("name").eq("project_id", projectId).eq("name", name).maybeSingle();
  return Boolean(data);
}

export async function saveDeployedRun(run: { id: string; projectId: string; agentName: string; input: string; output: string; steps: { agent: string; tool?: string; ms: number; note?: string }[]; inputTokens: number; outputTokens: number; durationMs: number }) {
  if (!isSupabaseConfigured()) {
    const { demoAddRun } = await import("@/lib/demo/store");
    await demoAddRun({
      ...run,
      source: "deployed",
      status: "ok",
      createdAt: new Date().toISOString(),
    });
    return;
  }
  const admin = (await import("@/lib/supabase/admin")).createAdmin();
  if (!admin) return;
  await admin.from("agent_runs").insert({
    id: run.id,
    project_id: run.projectId,
    agent_name: run.agentName,
    source: "deployed",
    input: run.input,
    output: run.output,
    steps: run.steps,
    input_tokens: run.inputTokens,
    output_tokens: run.outputTokens,
    duration_ms: run.durationMs,
    status: "ok",
  });
}

export async function deploymentOrigins(projectId: string) {
  if (!isSupabaseConfigured()) {
    const rows = await demoListDeployments(projectId);
    return rows.map((row) => row.url).filter((url): url is string => Boolean(url));
  }
  const admin = (await import("@/lib/supabase/admin")).createAdmin();
  if (!admin) return [];
  const { data } = await admin.from("deployments").select("url").eq("project_id", projectId);
  return (data ?? []).map((row) => row.url as string | null).filter((url): url is string => Boolean(url));
}

export async function findProjectByKey(key: string) {
  if (!isSupabaseConfigured()) return demoFindByPublicKey(key);
  const { createAdmin } = await import("@/lib/supabase/admin");
  const admin = createAdmin();
  if (!admin) return null;
  const { data } = await admin.from("projects").select("id, owner_id, name, public_key").eq("public_key", key).maybeSingle();
  if (!data) return null;
  return { project: { id: data.id as string, ownerId: data.owner_id as string, name: data.name as string }, publicKey: data.public_key as string };
}

export async function recentPublicHits(projectId: string) {
  const since = Date.now() - 60_000;
  if (!isSupabaseConfigured()) return demoRecentHits(projectId, since);
  const { createAdmin } = await import("@/lib/supabase/admin");
  const admin = createAdmin();
  if (!admin) return [];
  const { data } = await admin.from("usage_events").select("created_at").eq("project_id", projectId).eq("stage", "public_agent").gte("created_at", new Date(since).toISOString());
  return (data ?? []).map((row) => Date.parse(row.created_at as string));
}

export async function recordPublicHit(projectId: string, userId: string) {
  const at = new Date().toISOString();
  if (!isSupabaseConfigured()) {
    await demoAddHit(projectId, at);
    return;
  }
  const { createAdmin } = await import("@/lib/supabase/admin");
  const admin = createAdmin();
  if (!admin) return;
  await admin.from("usage_events").insert({ user_id: userId, project_id: projectId, stage: "public_agent", model: "public", input_tokens: 0, output_tokens: 0 });
}

export async function listDeployments(projectId: string) {
  if (!isSupabaseConfigured()) return demoListDeployments(projectId);
  const supabase = await createClient();
  const { data } = await supabase.from("deployments").select("id, snapshot_id, status, url, subdomain, logs, provider_deployment_id, promoted_at, created_by, created_at").eq("project_id", projectId).order("created_at", { ascending: false });
  return (data ?? []).map((row) => toDeployment(projectId, row));
}

export async function getDeployment(id: string) {
  if (!isSupabaseConfigured()) return demoGetDeployment(id);
  const supabase = await createClient();
  const { data } = await supabase.from("deployments").select("id, project_id, snapshot_id, status, url, subdomain, logs, provider_deployment_id, promoted_at, created_by, created_at").eq("id", id).maybeSingle();
  return data ? toDeployment(data.project_id as string, data) : null;
}

export async function addDeployment(deployment: Deployment) {
  if (!isSupabaseConfigured()) return demoAddDeployment(deployment);
  const supabase = await createClient();
  await supabase.from("deployments").insert({
    id: deployment.id,
    project_id: deployment.projectId,
    snapshot_id: deployment.snapshotId,
    status: deployment.status,
    url: deployment.url,
    subdomain: deployment.subdomain,
    logs: deployment.logs,
    provider_deployment_id: deployment.providerDeploymentId,
    created_by: deployment.createdBy,
  });
  return deployment;
}

export async function updateDeployment(id: string, patch: Partial<Deployment>) {
  if (!isSupabaseConfigured()) return demoUpdateDeployment(id, patch);
  const supabase = await createClient();
  const row: Record<string, unknown> = {};
  if (patch.status) row.status = patch.status;
  if ("url" in patch) row.url = patch.url;
  if ("logs" in patch) row.logs = patch.logs;
  if ("promotedAt" in patch) row.promoted_at = patch.promotedAt;
  await supabase.from("deployments").update(row).eq("id", id);
  return getDeployment(id);
}

export async function promoteDeployment(projectId: string, id: string) {
  const at = new Date().toISOString();
  if (!isSupabaseConfigured()) {
    await demoPromote(projectId, id, at);
    return;
  }
  const supabase = await createClient();
  await supabase.from("deployments").update({ promoted_at: null }).eq("project_id", projectId);
  await supabase.from("deployments").update({ promoted_at: at }).eq("id", id);
}

export async function deployTimes(userId: string) {
  if (!isSupabaseConfigured()) return demoDeployTimes(userId);
  const supabase = await createClient();
  const { data } = await supabase.from("deployments").select("created_at").eq("created_by", userId);
  return (data ?? []).map((row) => row.created_at as string);
}

export async function subdomainTaken(subdomain: string, projectId: string) {
  if (!isSupabaseConfigured()) return demoSubdomainTaken(subdomain, projectId);
  const supabase = await createClient();
  const { data } = await supabase.from("deployments").select("id").eq("subdomain", subdomain).neq("project_id", projectId).neq("status", "error").limit(1);
  return (data ?? []).length > 0;
}

export async function setSnapshotCommit(projectId: string, snapshotId: string, sha: string) {
  if (!isSupabaseConfigured()) return demoSetCommit(projectId, snapshotId, sha);
  const supabase = await createClient();
  await supabase.from("snapshots").update({ commit_sha: sha }).eq("id", snapshotId).eq("project_id", projectId);
}

function toDeployment(projectId: string, row: Record<string, unknown>): Deployment {
  return {
    id: String(row.id),
    projectId,
    snapshotId: (row.snapshot_id as string | null) ?? null,
    status: row.status as DeploymentStatus,
    url: (row.url as string | null) ?? null,
    subdomain: (row.subdomain as string | null) ?? null,
    logs: (row.logs as string | null) ?? "",
    providerDeploymentId: (row.provider_deployment_id as string | null) ?? null,
    promotedAt: (row.promoted_at as string | null) ?? null,
    createdBy: String(row.created_by ?? ""),
    createdAt: String(row.created_at),
  };
}
