import { NextResponse } from "next/server";
import { requireProject } from "@/lib/ship/guard";
import { listDeployments } from "@/lib/ship/data";

export async function GET(request: Request) {
  const projectId = new URL(request.url).searchParams.get("projectId") ?? "";
  const access = await requireProject(projectId);
  if ("error" in access) return access.error;
  return NextResponse.json({ deployments: await listDeployments(access.project.id) });
}
