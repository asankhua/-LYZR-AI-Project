import { NextResponse } from "next/server";
import { getProject } from "@/lib/projects";
import { getPlan } from "@/lib/records";
import { getSession } from "@/lib/session";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const { id } = await context.params;
  const project = await getProject(session.id, id);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  const plan = await getPlan(project.id);
  return NextResponse.json({ doc: plan?.doc ?? null, stage: project.stage });
}
