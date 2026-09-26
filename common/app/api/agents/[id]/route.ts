import { NextResponse } from "next/server";
import { z } from "zod";
import { agentSchema } from "@/lib/ai/schemas";
import { frameworkScaffold } from "@/lib/ai/draft";
import { getProject } from "@/lib/projects";
import { applyFiles, listAgents, updateAgent } from "@/lib/records";
import { getSession } from "@/lib/session";

const bodySchema = z.object({
  spec: agentSchema,
  position: z.object({ x: z.number(), y: z.number() }).optional(),
  testPassed: z.boolean().optional(),
});

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const { id } = await context.params;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid agent" }, { status: 400 });
  const projectId = new URL(request.url).searchParams.get("projectId");
  if (!projectId) return NextResponse.json({ error: "Missing project" }, { status: 400 });
  const project = await getProject(session.id, projectId);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  const existing = (await listAgents(project.id)).find((agent) => agent.id === id);
  if (!existing) return NextResponse.json({ error: "Agent not found" }, { status: 404 });
  const spec = {
    ...existing,
    ...parsed.data.spec,
    id,
    projectId: project.id,
    position: parsed.data.position ?? existing.position,
    testPassed: parsed.data.testPassed ?? existing.testPassed,
  };
  await updateAgent(project.id, spec);
  const scaffold = frameworkScaffold(spec.name, spec.framework);
  if (scaffold) await applyFiles(project.id, [scaffold]);
  return NextResponse.json({ id });
}
