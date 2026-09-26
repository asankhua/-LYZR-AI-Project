import { NextResponse } from "next/server";
import { githubApi } from "@/lib/github/client";
import { getSession } from "@/lib/session";
import { getGithubAccount, markGithubExpired, readGithubToken } from "@/lib/ship/data";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (session.isAnonymous) return NextResponse.json({ error: "Sign up to connect GitHub." }, { status: 403 });
  const account = await getGithubAccount(session.id);
  const token = readGithubToken(account);
  if (!token) return NextResponse.json({ error: account?.expired ? "Reconnect GitHub." : "Connect GitHub to import a repository." }, { status: 401 });
  const response = await githubApi(token).request<{ full_name: string; private: boolean; default_branch: string; description: string | null }[]>(
    "GET",
    "/user/repos?per_page=100&sort=updated",
  );
  if (response.status === 401) {
    await markGithubExpired(session.id);
    return NextResponse.json({ error: "Reconnect GitHub." }, { status: 401 });
  }
  if (response.status >= 300 || !Array.isArray(response.data)) return NextResponse.json({ error: "GitHub could not list repositories." }, { status: 502 });
  return NextResponse.json({
    repos: response.data.map((repo) => ({
      fullName: repo.full_name,
      private: repo.private,
      defaultBranch: repo.default_branch,
      description: repo.description,
    })),
  });
}
