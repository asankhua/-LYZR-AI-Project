import { NextResponse } from "next/server";
import { z } from "zod";
import { draftAgents } from "@/lib/ai/draft";
import { estimateTokens } from "@/lib/ai/limits";
import { checkModels, MODELS } from "@/lib/ai/models";
import { modelAgentNotes } from "@/lib/ai/groq";
import { ndjsonResponse } from "@/lib/ndjson";
import { getProject } from "@/lib/projects";
import { addUsage, getPlan, recentTokens, replaceAgents } from "@/lib/records";
import { getSession } from "@/lib/session";

export const maxDuration = 300;

const bodySchema = z.object({ projectId: z.string().uuid() });

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const project = await getProject(session.id, parsed.data.projectId);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  const plan = await getPlan(project.id);
  if (!plan) return NextResponse.json({ error: "Approve a plan first." }, { status: 400 });
  if (request.headers.get("x-simulate") === "429" || (await recentTokens(session.id)) >= 200_000) {
    return NextResponse.json({ error: "rate_limit" }, { status: 429, headers: { "retry-after": "2" } });
  }

  await checkModels();
  return ndjsonResponse(async (send, signal) => {
    send({ type: "step", label: "Designing agents", status: "running" });
    await modelAgentNotes(plan.doc);
    if (signal.aborted) return;
    const agents = draftAgents(project.id, plan.doc);
    const hasManager = agents.some((agent) => agent.managedBy === null);
    const helpers = agents.filter((agent) => agent.managedBy);
    if (!hasManager || helpers.length === 0) {
      send({ type: "error", message: "The agent set needs a manager and at least one helper." });
      return;
    }
    await replaceAgents(project.id, agents);
    for (const spec of agents) {
      if (signal.aborted) return;
      send({ type: "agent", spec });
    }
    const tokens = estimateTokens(JSON.stringify(agents));
    await addUsage({ userId: session.id, projectId: project.id, stage: "agents", model: MODELS.reasoning, inputTokens: tokens, outputTokens: tokens });
    send({ type: "usage", stage: "agents", inputTokens: tokens, outputTokens: tokens });
    send({ type: "step", label: "Designing agents", status: "done" });
  }, request.signal);
}
