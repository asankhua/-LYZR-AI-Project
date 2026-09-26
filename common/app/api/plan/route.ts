import { NextResponse } from "next/server";
import { z } from "zod";
import { draftChangePlan, draftPlan, PLAN_SECTIONS, sectionBody, sectionTitle } from "@/lib/ai/draft";
import { buildContext } from "@/lib/ai/context";
import { estimateTokens } from "@/lib/ai/limits";
import { checkModels } from "@/lib/ai/models";
import { modelChange, modelPlan } from "@/lib/ai/groq";
import { MODELS } from "@/lib/ai/models";
import { ndjsonResponse } from "@/lib/ndjson";
import { getProject } from "@/lib/projects";
import { addMessage, addUsage, listAgents, listFiles, recentTokens, savePlan } from "@/lib/records";
import { classifyIntent } from "@/lib/ai/router";
import { planSchema } from "@/lib/ai/schemas";
import { getSession } from "@/lib/session";

export const maxDuration = 300;

const bodySchema = z.object({
  projectId: z.string().uuid(),
  instruction: z.string().max(8000).optional(),
  kind: z.enum(["draft", "change", "save"]).optional(),
  doc: planSchema.optional(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid plan request" }, { status: 400 });

  const project = await getProject(session.id, parsed.data.projectId);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });

  if (parsed.data.kind === "save" && parsed.data.doc) {
    await savePlan(project.id, parsed.data.doc);
    return NextResponse.json({ ok: true });
  }

  if (request.headers.get("x-simulate") === "429" || (await recentTokens(session.id)) >= 200_000) {
    return NextResponse.json({ error: "rate_limit" }, { status: 429, headers: { "retry-after": "2" } });
  }

  await checkModels();
  const prompt = [project.description, parsed.data.instruction].filter(Boolean).join("\n\n");

  return ndjsonResponse(async (send, signal) => {
    const intent = classifyIntent(prompt);
    send({ type: "intent", intent: intent.intent, confidence: intent.confidence });
    if (parsed.data.kind === "change") {
      send({ type: "step", label: "Drafting a change plan", status: "running" });
      const files = await listFiles(project.id);
      const change = (await modelChange(prompt, signal)) ?? draftChangePlan(parsed.data.instruction ?? prompt, files.map((file) => file.path));
      if (signal.aborted) return;
      send({ type: "change-plan", plan: change });
      send({ type: "step", label: "Drafting a change plan", status: "done" });
      const tokens = estimateTokens(prompt);
      await addUsage({ userId: session.id, projectId: project.id, stage: "plan", model: MODELS.reasoning, inputTokens: tokens, outputTokens: tokens });
      send({ type: "usage", stage: "plan", inputTokens: tokens, outputTokens: tokens });
      return;
    }

    send({ type: "step", label: "Drafting the plan", status: "running" });
    const plan = (await modelPlan(prompt, signal)) ?? draftPlan(prompt);
    if (signal.aborted) return;
    send({ type: "step", label: "Drafting the plan", status: "done" });
    for (const key of PLAN_SECTIONS) {
      if (signal.aborted) return;
      send({ type: "plan-section", key, title: sectionTitle(key), body: sectionBody(plan, key) });
      await new Promise((resolve) => setTimeout(resolve, 90));
    }
    await savePlan(project.id, plan);
    await addMessage({
      id: crypto.randomUUID(),
      projectId: project.id,
      role: "assistant",
      content: plan.summary,
      createdAt: new Date().toISOString(),
    });
    const agents = await listAgents(project.id);
    const files = await listFiles(project.id);
    const tokens = buildContext({ plan, agents, files, message: prompt }).tokens || estimateTokens(JSON.stringify(plan));
    await addUsage({ userId: session.id, projectId: project.id, stage: "plan", model: MODELS.reasoning, inputTokens: tokens, outputTokens: tokens });
    send({ type: "usage", stage: "plan", inputTokens: tokens, outputTokens: tokens });
    send({ type: "text", text: plan.summary });
    send({ type: "step", label: "Plan ready for review", status: "done" });
  }, request.signal);
}

export async function GET() {
  return NextResponse.json({ error: "Use POST" }, { status: 405 });
}
