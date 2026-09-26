import { NextResponse } from "next/server";
import { z } from "zod";
import { pushCurrentFiles } from "@/lib/github/push-project";
import { requireProject } from "@/lib/ship/guard";
import { updateShipMeta } from "@/lib/ship/data";

const bodySchema = z.object({
  projectId: z.string().uuid(),
  message: z.string().max(200).optional(),
  repoName: z.string().max(80).optional(),
  private: z.boolean().optional(),
  forceBranch: z.string().regex(/^[A-Za-z0-9._/-]{1,80}$/).optional(),
  branch: z.string().regex(/^[A-Za-z0-9._/-]{1,80}$/).optional(),
  autoCommit: z.boolean().optional(),
});

export async function POST(request: Request) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid push" }, { status: 400 });
  const access = await requireProject(parsed.data.projectId);
  if ("error" in access) return access.error;
  if (access.session.isAnonymous) return NextResponse.json({ error: "Sign up to connect GitHub." }, { status: 403 });
  if (parsed.data.autoCommit !== undefined || parsed.data.branch) {
    await updateShipMeta(access.project.id, {
      ...(parsed.data.autoCommit !== undefined ? { autoCommit: parsed.data.autoCommit } : {}),
      ...(parsed.data.branch ? { githubBranch: parsed.data.branch } : {}),
    });
    if (!parsed.data.message && !parsed.data.forceBranch && !parsed.data.repoName) return NextResponse.json({ ok: true });
  }
  const result = await pushCurrentFiles({
    userId: access.session.id,
    projectId: access.project.id,
    projectName: access.project.name,
    message: parsed.data.message,
    repoName: parsed.data.repoName,
    isPrivate: parsed.data.private,
    forceBranch: parsed.data.forceBranch,
  });
  if (!result.ok) {
    const status = result.reason === "unauthorized" ? 401 : result.reason === "conflict" ? 422 : 400;
    return NextResponse.json({ error: result.message, reason: result.reason }, { status });
  }
  return NextResponse.json({ repo: result.repo, commitSha: result.commitSha, url: result.url, branch: result.branch });
}
