import { NextResponse } from "next/server";
import { listProjects } from "@/lib/projects";
import { listUsage } from "@/lib/records";
import { getSession } from "@/lib/session";
import { summarizeUsage } from "@/lib/usage-summary";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const [events, projects] = await Promise.all([listUsage(session.id), listProjects(session.id)]);
  const names = new Map(projects.map((project) => [project.id, project.name]));
  const summary = summarizeUsage(
    events.map((event) => ({
      projectId: event.projectId,
      projectName: event.projectId ? names.get(event.projectId) ?? "Untitled" : "Untitled",
      stage: event.stage,
      inputTokens: event.inputTokens,
      outputTokens: event.outputTokens,
    })),
  );
  return NextResponse.json(summary);
}
