import { NextResponse } from "next/server";
import { getProject } from "@/lib/projects";
import { getSession } from "@/lib/session";

export async function requireProject(projectId: string) {
  const session = await getSession();
  if (!session) return { error: NextResponse.json({ error: "Sign in required" }, { status: 401 }) };
  if (!/^[0-9a-f-]{36}$/i.test(projectId)) return { error: NextResponse.json({ error: "Invalid project" }, { status: 400 }) };
  const project = await getProject(session.id, projectId);
  if (!project) return { error: NextResponse.json({ error: "Project not found" }, { status: 404 }) };
  return { session, project };
}

export function safeNext(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;
  return value;
}
