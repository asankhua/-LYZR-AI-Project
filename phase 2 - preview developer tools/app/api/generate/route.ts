import { NextResponse } from "next/server";
import { z } from "zod";
import { filesForPlan } from "@/lib/ai/draft";
import { estimateTokens } from "@/lib/ai/limits";
import { checkModels, MODELS } from "@/lib/ai/models";
import { modelFileNote } from "@/lib/ai/groq";
import { applyChange, repairFiles } from "@/lib/ai/repair";
import { previewBatches } from "@/lib/templates/vite-react/files";
import { ndjsonResponse } from "@/lib/ndjson";
import { getProject } from "@/lib/projects";
import { addSnapshot, addUsage, applyFiles, getPlan, listFiles, recentTokens } from "@/lib/records";
import { getSession } from "@/lib/session";
import type { PreviewError } from "@/lib/types";

export const maxDuration = 300;

const errorSchema = z.object({
  kind: z.enum(["build", "runtime", "console", "install"]),
  message: z.string(),
  file: z.string().optional(),
  line: z.number().optional(),
  at: z.number().optional(),
});

const bodySchema = z.object({
  projectId: z.string().uuid(),
  message: z.string().max(8000).optional(),
  mode: z.enum(["build", "change", "fix"]),
  errors: z.array(errorSchema).optional(),
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
  const existing = await listFiles(project.id);
  let batches: { label: string; files: { path: string; content: string }[] }[] = [];
  if (parsed.data.mode === "fix") {
    const errors: PreviewError[] = (parsed.data.errors ?? []).map((error) => ({
      ...error,
      at: error.at ?? Date.now(),
    }));
    const repaired = repairFiles(existing, errors);
    if (!repaired) {
      return ndjsonResponse(async (send) => {
        send({ type: "error", message: "Could not fix this error." });
      }, request.signal);
    }
    batches = [{ label: "Fixing the preview", files: repaired }];
  } else if (parsed.data.mode === "change") {
    batches = [{ label: "Applying the change", files: applyChange(existing, parsed.data.message ?? plan.doc.summary) }];
  } else {
    const files = filesForPlan(plan.doc);
    batches = previewBatches.map((batch) => ({
      label: batch.label,
      files: files.filter((file) => batch.paths.includes(file.path)),
    }));
  }

  return ndjsonResponse(async (send, signal) => {
    if (parsed.data.mode === "build") {
      const note = await modelFileNote(plan.doc);
      if (note) send({ type: "text", text: note });
    }
    const manifest: Record<string, string> = Object.fromEntries(existing.map((file) => [file.path, file.sha]));
    for (const batch of batches) {
      if (signal.aborted || batch.files.length === 0) continue;
      send({ type: "step", label: batch.label, status: "running" });
      const saved = await applyFiles(project.id, batch.files);
      for (const file of saved) {
        manifest[file.path] = file.sha;
        send({ type: "file-op", op: parsed.data.mode === "build" ? "create" : "update", path: file.path, content: file.content });
      }
      const snapshot = await addSnapshot(project.id, session.id, parsed.data.message ?? plan.doc.title, { ...manifest });
      send({ type: "snapshot", snapshotId: snapshot.id });
      send({ type: "step", label: `${batch.label} saved`, status: "done" });
    }
    const tokens = estimateTokens(JSON.stringify(batches));
    await addUsage({
      userId: session.id,
      projectId: project.id,
      stage: parsed.data.mode === "fix" ? "fix" : "codegen",
      model: MODELS.reasoning,
      inputTokens: tokens,
      outputTokens: tokens,
    });
    send({ type: "usage", stage: parsed.data.mode, inputTokens: tokens, outputTokens: tokens });
  }, request.signal);
}
