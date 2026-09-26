import { NextResponse } from "next/server";
import { z } from "zod";
import { filesForPlan } from "@/lib/ai/draft";
import { estimateTokens } from "@/lib/ai/limits";
import { checkModels, MODELS } from "@/lib/ai/models";
import { modelFileNote } from "@/lib/ai/groq";
import { ndjsonResponse } from "@/lib/ndjson";
import { getProject } from "@/lib/projects";
import { addSnapshot, addUsage, applyFiles, getPlan, recentTokens } from "@/lib/records";
import { getSession } from "@/lib/session";

export const maxDuration = 300;

const bodySchema = z.object({
  projectId: z.string().uuid(),
  message: z.string().max(8000).optional(),
  mode: z.enum(["build", "change", "fix"]),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid generate request" }, { status: 400 });
  const project = await getProject(session.id, parsed.data.projectId);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  const plan = await getPlan(project.id);
  if (!plan) return NextResponse.json({ error: "A plan is required before building." }, { status: 400 });
  if (request.headers.get("x-simulate") === "429" || (await recentTokens(session.id)) >= 200_000) {
    return NextResponse.json({ error: "rate_limit" }, { status: 429, headers: { "retry-after": "2" } });
  }

  await checkModels();
  const files = filesForPlan(plan.doc);
  const batches = [files.slice(0, 3), files.slice(3)];

  return ndjsonResponse(async (send, signal) => {
    const note = await modelFileNote(plan.doc);
    if (note) send({ type: "text", text: note });
    const manifest: Record<string, string> = {};
    for (const [index, batch] of batches.entries()) {
      if (signal.aborted) return;
      send({ type: "step", label: `Writing files ${index + 1} of ${batches.length}`, status: "running" });
      const saved = await applyFiles(project.id, batch);
      for (const file of saved) {
        manifest[file.path] = file.sha;
        send({ type: "file-op", op: "create", path: file.path });
      }
      const snapshot = await addSnapshot(project.id, session.id, parsed.data.message ?? plan.doc.title, { ...manifest });
      send({ type: "snapshot", snapshotId: snapshot.id });
      send({ type: "step", label: `Saved version ${index + 1}`, status: "done" });
    }
    const tokens = estimateTokens(JSON.stringify(files));
    await addUsage({
      userId: session.id,
      projectId: project.id,
      stage: parsed.data.mode === "fix" ? "fix" : "codegen",
      model: MODELS.reasoning,
      inputTokens: tokens,
      outputTokens: tokens,
    });
    send({ type: "usage", stage: "codegen", inputTokens: tokens, outputTokens: tokens });
  }, request.signal);
}
