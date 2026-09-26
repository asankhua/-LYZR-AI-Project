import { NextResponse } from "next/server";
import { getProject } from "@/lib/projects";
import { listSnapshots, snapshotFiles } from "@/lib/records";
import { getSession } from "@/lib/session";

export async function GET(request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const { id } = await context.params;
  const project = await getProject(session.id, id);
  if (!project) return NextResponse.json({ error: "Project not found" }, { status: 404 });
  const snapshotId = new URL(request.url).searchParams.get("snapshotId");
  if (snapshotId) {
    const loaded = await snapshotFiles(project.id, snapshotId);
    if (!loaded) return NextResponse.json({ error: "Version not found" }, { status: 404 });
    return NextResponse.json(loaded);
  }
  const snapshots = await listSnapshots(project.id);
  return NextResponse.json({ snapshots });
}
