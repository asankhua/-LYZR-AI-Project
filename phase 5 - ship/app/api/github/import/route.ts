import { NextResponse } from "next/server";
import { z } from "zod";
import { githubApi } from "@/lib/github/client";
import { filesFromRepo } from "@/lib/github/import-repo";
import { finishImport } from "@/lib/import/finish";
import { getSession } from "@/lib/session";
import { getGithubAccount, markGithubExpired, readGithubToken } from "@/lib/ship/data";

const bodySchema = z.object({
  repo: z.string().regex(/^[A-Za-z0-9_.-]+\/[A-Za-z0-9_.-]+$/),
  branch: z.string().regex(/^[A-Za-z0-9._/-]{1,80}$/).optional(),
  root: z.string().max(200).optional(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Use a GitHub URL or owner/repo." }, { status: 400 });
  const token = session.isAnonymous ? null : readGithubToken(await getGithubAccount(session.id));
  const api = githubApi(token);
  try {
    const meta = await api.request<{ default_branch?: string; message?: string }>("GET", `/repos/${parsed.data.repo}`);
    if (meta.status === 404) {
      return NextResponse.json(
        { error: "That repository is private or was not found. Public repositories import from a GitHub URL." },
        { status: 404 },
      );
    }
    if (meta.status >= 300 || !meta.data.default_branch) {
      return NextResponse.json({ error: meta.data.message ?? "GitHub could not read that repository." }, { status: 400 });
    }
    const branch = parsed.data.branch?.trim() || meta.data.default_branch;
    const loaded = await filesFromRepo(api, parsed.data.repo, branch, parsed.data.root);
    if (!loaded.ok) {
      if (loaded.status === 401 && token) await markGithubExpired(session.id);
      const error = loaded.status === 404 ? "That branch was not found. Leave the branch blank to use the repository default." : loaded.message;
      return NextResponse.json({ error }, { status: loaded.status === 401 ? 401 : 400 });
    }
    if (loaded.files.length === 0) return NextResponse.json({ error: "That repository has no text files to import." }, { status: 400 });
    const name = parsed.data.repo.split("/")[1] ?? "Imported app";
    const created = await finishImport({ ownerId: session.id, name, source: parsed.data.repo, files: loaded.files });
    return NextResponse.json(created);
  } catch (error) {
    const message = error instanceof Error ? error.message : "GitHub could not import that repository.";
    if (message === "Reconnect GitHub.") {
      await markGithubExpired(session.id);
      return NextResponse.json({ error: message }, { status: 401 });
    }
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
