import { NextResponse } from "next/server";
import { suggestSubdomain } from "@/lib/deploy/prepare";
import { isSubdomain, subdomainFromName } from "@/lib/github/filter";
import { projectNameTaken, vercelConfigured } from "@/lib/deploy/vercel";
import { requireProject } from "@/lib/ship/guard";
import { getShipMeta, subdomainTaken } from "@/lib/ship/data";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const projectId = url.searchParams.get("projectId") ?? "";
  const access = await requireProject(projectId);
  if ("error" in access) return access.error;
  const requested = (url.searchParams.get("subdomain") ?? subdomainFromName(access.project.name)).toLowerCase();
  if (!isSubdomain(requested)) return NextResponse.json({ available: false, suggestion: subdomainFromName(access.project.name), publicKey: (await getShipMeta(access.project.id)).publicKey });
  const local = await subdomainTaken(requested, access.project.id);
  const remote = vercelConfigured() ? await projectNameTaken(`arch-${requested}`) : false;
  const available = !local && !remote;
  const ship = await getShipMeta(access.project.id);
  return NextResponse.json({
    available,
    suggestion: available ? null : suggestSubdomain(requested),
    subdomain: requested,
    publicKey: ship.publicKey,
    projectName: `arch-${requested}`,
  });
}
