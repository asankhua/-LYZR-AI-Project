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
  if (session.isAnonymous) return NextResponse.json({ error: "Sign up to connect GitHub." }, { status: 403 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Invalid repository" }, { status: 400 });
  const token = readGithubToken(await getGithubAccount(session.id));
  if (!token) return NextResponse.json({ error: "Connect GitHub to import a repository." }, { status: 401 });
  try {
    const loaded = await filesFromRepo(githubApi(token), parsed.data.repo, parsed.data.branch ?? "main", parsed.data.root);
    if (!loaded.ok) {
      if (loaded.status === 401) await markGithubExpired(session.id);
      return NextResponse.json({ error: loaded.message }, { status: loaded.status === 401 ? 401 : 400 });
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
