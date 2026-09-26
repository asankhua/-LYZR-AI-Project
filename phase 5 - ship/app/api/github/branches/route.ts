import { NextResponse } from "next/server";
import { z } from "zod";
import { githubApi } from "@/lib/github/client";
import { requireProject } from "@/lib/ship/guard";
import { getGithubAccount, getShipMeta, markGithubExpired, readGithubToken } from "@/lib/ship/data";

const querySchema = z.object({ projectId: z.string().uuid() });

export async function GET(request: Request) {
  const parsed = querySchema.safeParse({ projectId: new URL(request.url).searchParams.get("projectId") });
  if (!parsed.success) return NextResponse.json({ error: "Invalid project" }, { status: 400 });
  const access = await requireProject(parsed.data.projectId);
  if ("error" in access) return access.error;
  if (access.session.isAnonymous) return NextResponse.json({ error: "Sign up to connect GitHub." }, { status: 403 });
  const ship = await getShipMeta(access.project.id);
  if (!ship.githubRepo) return NextResponse.json({ branches: [] });
  const token = readGithubToken(await getGithubAccount(access.session.id));
  if (!token) return NextResponse.json({ error: "Reconnect GitHub." }, { status: 401 });
  const response = await githubApi(token).request<{ name: string }[]>("GET", `/repos/${ship.githubRepo}/branches?per_page=100`);
  if (response.status === 401) {
    await markGithubExpired(access.session.id);
    return NextResponse.json({ error: "Reconnect GitHub." }, { status: 401 });
  }
  if (response.status >= 300 || !Array.isArray(response.data)) return NextResponse.json({ error: "GitHub could not list branches." }, { status: 502 });
  return NextResponse.json({ branches: response.data.map((branch) => branch.name) });
}
