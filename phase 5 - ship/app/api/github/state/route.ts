import { NextResponse } from "next/server";
import { listFiles, listSnapshots } from "@/lib/records";
import { requireProject } from "@/lib/ship/guard";
import { getGithubAccount, getShipMeta } from "@/lib/ship/data";

export async function GET(request: Request) {
  const projectId = new URL(request.url).searchParams.get("projectId") ?? "";
  const access = await requireProject(projectId);
  if ("error" in access) return access.error;
  const [ship, account, files, snapshots] = await Promise.all([
    getShipMeta(access.project.id),
    getGithubAccount(access.session.id),
    listFiles(access.project.id),
    listSnapshots(access.project.id),
  ]);
  const pushed = [...snapshots].reverse().find((snapshot) => snapshot.commitSha);
  const ahead = files.some((file) => pushed?.manifest[file.path] !== file.sha) || Object.keys(pushed?.manifest ?? {}).some((path) => !files.some((file) => file.path === path));
  return NextResponse.json({
    guest: access.session.isAnonymous,
    connected: Boolean(account?.tokenEncrypted) && !account?.expired,
    login: account?.login ?? null,
    expired: Boolean(account?.expired),
    repo: ship.githubRepo,
    branch: ship.githubBranch,
    autoCommit: ship.autoCommit,
    conflict: ship.conflict,
    publicKey: ship.publicKey,
    codeOnly: ship.codeOnly,
    ahead,
    commits: snapshots
      .filter((snapshot) => snapshot.commitSha)
      .map((snapshot) => ({
        sha: snapshot.commitSha,
        message: snapshot.summary,
        snapshotId: snapshot.id,
        createdAt: snapshot.createdAt,
        url: ship.githubRepo ? `https://github.com/${ship.githubRepo}/commit/${snapshot.commitSha}` : null,
      })),
  });
}
