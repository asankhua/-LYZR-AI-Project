import { NextResponse } from "next/server";
import { z } from "zod";
import { sampleRun } from "@/lib/ai/draft";
import { estimateTokens } from "@/lib/ai/limits";
import { MODELS } from "@/lib/ai/models";
import { ndjsonResponse } from "@/lib/ndjson";
import { getProject } from "@/lib/projects";
import { addRun, addUsage, listAgents } from "@/lib/records";
import { getSession } from "@/lib/session";
import type { AgentRun } from "@/lib/types";

export const maxDuration = 60;

const bodySchema = z.object({
  projectId: z.string().uuid(),
  agentName: z.string().min(1),
  input: z.string().min(1).max(4000),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid test" }, { status: 400 });
  const project = await getProject(session.id, parsed.data.projectId);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  const agent = (await listAgents(project.id)).find((item) => item.name === parsed.data.agentName);
  if (!agent) return NextResponse.json({ error: "Agent not found" }, { status: 404 });

  return ndjsonResponse(async (send) => {
    const started = Date.now();
    const sample = sampleRun(agent.name, parsed.data.input);
    const run: AgentRun = {
      id: crypto.randomUUID(),
      projectId: project.id,
      agentName: agent.name,
      source: "test",
      input: parsed.data.input,
      output: sample.output,
      steps: sample.steps,
      inputTokens: estimateTokens(parsed.data.input),
      outputTokens: estimateTokens(sample.output),
      durationMs: Date.now() - started,
      status: "ok",
      createdAt: new Date().toISOString(),
    };
    await addRun(run);
    await addUsage({
      userId: session.id,
      projectId: project.id,
      stage: "agent_run",
      model: MODELS.fast,
      inputTokens: run.inputTokens,
      outputTokens: run.outputTokens,
    });
    send({ type: "trace", run });
    send({ type: "usage", stage: "agent_run", inputTokens: run.inputTokens, outputTokens: run.outputTokens });
    send({ type: "step", label: "Test passed", status: "done" });
  }, request.signal);
}
