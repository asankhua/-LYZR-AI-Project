import { NextResponse } from "next/server";
import { z } from "zod";
import { deploymentUrl, filesForDeploy } from "@/lib/deploy/prepare";
import { aliasDeployment, createVercelDeployment, vercelConfigured } from "@/lib/deploy/vercel";
import { isSubdomain } from "@/lib/github/filter";
import { listFiles, listSnapshots, setStage } from "@/lib/records";
import { deployLimitReached } from "@/lib/security/access";
import { requireProject } from "@/lib/ship/guard";
import { addDeployment, deployTimes, getShipMeta, subdomainTaken } from "@/lib/ship/data";

const bodySchema = z.object({
  projectId: z.string().uuid(),
  subdomain: z.string(),
  outcome: z.enum(["ok", "error"]).optional(),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid deploy" }, { status: 400 });
  const access = await requireProject(parsed.data.projectId);
  if ("error" in access) return access.error;
  if (access.session.isAnonymous) return NextResponse.json({ error: "Sign up to connect." }, { status: 403 });
  const subdomain = parsed.data.subdomain.toLowerCase();
  if (!isSubdomain(subdomain)) return NextResponse.json({ error: "Choose a subdomain of 3 to 32 letters, numbers, or hyphens." }, { status: 400 });
  if (await subdomainTaken(subdomain, access.project.id)) return NextResponse.json({ error: "That address is already used." }, { status: 409 });
  const times = await deployTimes(access.session.id);
  if (deployLimitReached(times, Date.now())) return NextResponse.json({ error: "You have reached the limit of 5 deploys today." }, { status: 429 });
  const files = await listFiles(access.project.id);
  if (files.length === 0) return NextResponse.json({ error: "Build the app before deploying it." }, { status: 400 });
  const ship = await getShipMeta(access.project.id);
  const snapshots = await listSnapshots(access.project.id);
  const env = {
    VITE_ARCHITECT_URL: process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000",
    VITE_ARCHITECT_KEY: ship.publicKey,
  };
  const prepared = filesForDeploy(files, env);
  const outcome = !vercelConfigured() && parsed.data.outcome === "error" ? "error" : "ok";
  let providerId = outcome === "error" ? "scripted:error" : "scripted:ok";
  let url: string | null = null;
  let status: "queued" | "building" | "ready" | "error" | "canceled" = "queued";
  if (vercelConfigured()) {
    try {
      const created = await createVercelDeployment({ name: `arch-${subdomain}`, files: prepared, env });
      providerId = created.id;
      url = created.url;
      status = created.status;
      if (status === "ready" && created.id) await aliasDeployment(created.id, `${subdomain}.vercel.app`);
    } catch (error) {
      return NextResponse.json({ error: error instanceof Error ? error.message : "Vercel could not start the deployment." }, { status: 502 });
    }
  }
  const deployment = await addDeployment({
    id: crypto.randomUUID(),
    projectId: access.project.id,
    snapshotId: snapshots.at(-1)?.id ?? null,
    status,
    url: status === "ready" ? url ?? deploymentUrl(subdomain) : url,
    subdomain,
    logs: "Queued the deployment.\n",
    providerDeploymentId: providerId,
    promotedAt: null,
    createdBy: access.session.id,
    createdAt: new Date().toISOString(),
  });
  if (status === "ready") await setStage(access.project.id, "ship");
  return NextResponse.json({ deploymentId: deployment.id });
}
