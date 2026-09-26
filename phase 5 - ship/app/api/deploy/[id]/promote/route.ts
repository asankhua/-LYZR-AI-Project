import { NextResponse } from "next/server";
import { aliasDeployment, vercelConfigured } from "@/lib/deploy/vercel";
import { getProject } from "@/lib/projects";
import { getSession } from "@/lib/session";
import { getDeployment, promoteDeployment } from "@/lib/ship/data";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (session.isAnonymous) return NextResponse.json({ error: "Sign up to connect." }, { status: 403 });
  const { id } = await context.params;
  const deployment = await getDeployment(id);
  if (!deployment) return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
  const project = await getProject(session.id, deployment.projectId);
  if (!project) return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
  if (deployment.status !== "ready") return NextResponse.json({ error: "Only a ready deployment can be promoted." }, { status: 400 });
  if (vercelConfigured() && deployment.providerDeploymentId && !deployment.providerDeploymentId.startsWith("scripted:")) {
    await aliasDeployment(deployment.providerDeploymentId, `${deployment.subdomain}.vercel.app`);
  }
  await promoteDeployment(project.id, deployment.id);
  return NextResponse.json({ ok: true, url: deployment.url });
}
