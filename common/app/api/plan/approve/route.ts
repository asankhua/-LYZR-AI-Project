import { NextResponse } from "next/server";
import { z } from "zod";
import { getProject } from "@/lib/projects";
import { approvePlan, getPlan } from "@/lib/records";
import { getSession } from "@/lib/session";

const bodySchema = z.object({ projectId: z.string().uuid() });

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const project = await getProject(session.id, parsed.data.projectId);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  const plan = await getPlan(project.id);
  if (!plan) return NextResponse.json({ error: "Draft a plan before approving it." }, { status: 400 });
  await approvePlan(project.id);
  return NextResponse.json({ stage: "agents" });
}
