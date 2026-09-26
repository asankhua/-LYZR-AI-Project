import { NextResponse } from "next/server";
import { broadcastDeploy } from "@/lib/deploy/broadcast";
import { deploymentUrl, scriptedProgress } from "@/lib/deploy/prepare";
import { readVercelDeployment, vercelConfigured } from "@/lib/deploy/vercel";
import { setStage } from "@/lib/records";
import { getSession } from "@/lib/session";
import { getDeployment, updateDeployment } from "@/lib/ship/data";
import { getProject } from "@/lib/projects";

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const { id } = await context.params;
  const deployment = await getDeployment(id);
  if (!deployment) return NextResponse.json({ error: "Deployment not found" }, { status: 404 });
  const project = await getProject(session.id, deployment.projectId);
  if (!project) return NextResponse.json({ error: "Deployment not found" }, { status: 404 });

  let next = deployment;
  const provider = deployment.providerDeploymentId ?? "";
  if (provider.startsWith("scripted:")) {
    const progress = scriptedProgress(deployment.createdAt, Date.now(), provider.endsWith(":error") ? "error" : "ok");
    const url = progress.status === "ready" ? deploymentUrl(deployment.subdomain ?? "app") : deployment.url;
    next = (await updateDeployment(deployment.id, { status: progress.status, logs: progress.logs, url })) ?? { ...deployment, ...progress, url };
  } else if (vercelConfigured() && provider) {
    const remote = await readVercelDeployment(provider);
    next = (await updateDeployment(deployment.id, remote)) ?? { ...deployment, ...remote };
  }
  if (next.status === "ready") await setStage(project.id, "ship");
  await broadcastDeploy(project.id, { id: next.id, status: next.status, url: next.url });
  return NextResponse.json({ status: next.status, url: next.url, logs: next.logs, subdomain: next.subdomain });
}
