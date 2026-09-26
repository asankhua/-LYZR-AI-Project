import "server-only";
import { createHash } from "node:crypto";
import { mapReadyState } from "@/lib/deploy/prepare";
import type { DeploymentStatus } from "@/lib/types";

function teamQuery() {
  const team = process.env.VERCEL_TEAM_ID;
  return team ? `?teamId=${encodeURIComponent(team)}` : "";
}

function authHeaders(): HeadersInit {
  return { authorization: `Bearer ${process.env.VERCEL_TOKEN}` };
}

export function vercelConfigured() {
  return Boolean(process.env.VERCEL_TOKEN);
}

async function vercel(path: string, init?: RequestInit) {
  const response = await fetch(`https://api.vercel.com${path}`, {
    ...init,
    headers: { ...authHeaders(), ...(init?.headers ?? {}) },
  });
  const text = await response.text();
  const data = text ? (JSON.parse(text) as Record<string, unknown>) : {};
  return { status: response.status, data };
}

export async function projectNameTaken(name: string): Promise<boolean> {
  const found = await vercel(`/v9/projects/${encodeURIComponent(name)}${teamQuery()}`);
  return found.status === 200;
}

export async function createVercelDeployment(input: { name: string; files: { path: string; content: string }[]; env: Record<string, string> }) {
  await vercel(`/v10/projects${teamQuery()}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ name: input.name, framework: "vite" }),
  });
  for (const [key, value] of Object.entries(input.env)) {
    await vercel(`/v10/projects/${encodeURIComponent(input.name)}/env${teamQuery()}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key, value, type: "plain", target: ["production"] }),
    });
  }
  const inline = input.files.every((file) => file.content.length < 100_000) && input.files.reduce((sum, file) => sum + file.content.length, 0) < 4_000_000;
  const files = inline
    ? input.files.map((file) => ({ file: file.path, data: Buffer.from(file.content, "utf8").toString("base64"), encoding: "base64" }))
    : await Promise.all(input.files.map(async (file) => uploadFile(file.path, file.content)));
  const created = await vercel(`/v13/deployments${teamQuery()}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      name: input.name,
      target: "production",
      files,
      projectSettings: { framework: "vite", buildCommand: "npm run build", outputDirectory: "dist", installCommand: "npm install" },
    }),
  });
  if (created.status >= 300) {
    const message = typeof created.data.error === "object" && created.data.error && "message" in created.data.error ? String(created.data.error.message) : "Vercel could not start the deployment.";
    throw new Error(message);
  }
  return {
    id: String(created.data.id ?? ""),
    url: created.data.url ? `https://${created.data.url}` : null,
    status: mapReadyState(String(created.data.readyState ?? "QUEUED")),
  };
}

async function uploadFile(path: string, content: string) {
  const body = Buffer.from(content, "utf8");
  const sha = createHash("sha1").update(body).digest("hex");
  await vercel(`/v2/files${teamQuery()}`, {
    method: "POST",
    headers: { "x-vercel-digest": sha, "content-length": String(body.length) },
    body,
  });
  return { file: path, sha, size: body.length };
}

export async function readVercelDeployment(id: string): Promise<{ status: DeploymentStatus; url: string | null; logs: string }> {
  const found = await vercel(`/v13/deployments/${id}${teamQuery()}`);
  const status = mapReadyState(String(found.data.readyState ?? "QUEUED"));
  const url = found.data.url ? `https://${found.data.url}` : null;
  if (status !== "error" && status !== "canceled") return { status, url, logs: `${status}\n` };
  const events = await fetch(`https://api.vercel.com/v3/deployments/${id}/events${teamQuery()}`, { headers: authHeaders() });
  const logs = await events.text();
  return { status, url, logs: logs.slice(0, 20_000) };
}

export async function aliasDeployment(id: string, alias: string) {
  await vercel(`/v2/deployments/${id}/aliases${teamQuery()}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ alias }),
  });
}
