import { NextResponse } from "next/server";
import { z } from "zod";
import { getProject } from "@/lib/projects";
import { markHealthy } from "@/lib/records";
import { getSession } from "@/lib/session";

const bodySchema = z.object({ snapshotId: z.string().uuid() });

export async function POST(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid version" }, { status: 400 });
  const { id } = await context.params;
  const project = await getProject(session.id, id);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  await markHealthy(project.id, parsed.data.snapshotId);
  return NextResponse.json({ ok: true });
}
