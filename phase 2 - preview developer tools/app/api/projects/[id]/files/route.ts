import { NextResponse } from "next/server";
import { z } from "zod";
import { getProject } from "@/lib/projects";
import { addSnapshot, applyFiles, listFiles } from "@/lib/records";
import { getSession } from "@/lib/session";

const bodySchema = z.object({
  ops: z
    .array(
      z.object({
        op: z.enum(["create", "update", "delete"]),
        path: z.string().min(1),
        content: z.string().optional(),
      }),
    )
    .min(1),
});

async function member(requestPathId: string) {
  const session = await getSession();
  if (!session) return { error: NextResponse.json({ error: "Sign in required" }, { status: 401 }) };
  const project = await getProject(session.id, requestPathId);
  if (!project) return { error: NextResponse.json({ error: "Project not found" }, { status: 404 }) };
  return { session, project };
}

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const access = await member(id);
  if ("error" in access && access.error) return access.error;
  if (!("project" in access)) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  const files = await listFiles(access.project.id);
  return NextResponse.json({ files });
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const access = await member(id);
  if ("error" in access && access.error) return access.error;
  if (!("session" in access)) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid file edit" }, { status: 400 });
  const current = await listFiles(access.project.id);
  const next = new Map(current.map((file) => [file.path, file.content]));
  for (const op of parsed.data.ops) {
    if (op.op === "delete") next.delete(op.path);
    else next.set(op.path, op.content ?? "");
  }
  const saved = await applyFiles(
    access.project.id,
    [...next.entries()].map(([path, content]) => ({ path, content })),
  );
  const snapshot = await addSnapshot(
    access.project.id,
    access.session.id,
    "Edited in the code tab",
    Object.fromEntries(saved.map((file) => [file.path, file.sha])),
  );
  return NextResponse.json({ snapshotId: snapshot.id, files: saved });
}
