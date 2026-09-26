import "server-only";
import { repoNameFromProject } from "@/lib/github/filter";
import { githubApi } from "@/lib/github/client";
import { syncRepository, type SyncResult } from "@/lib/github/sync";
import { listFiles, listSnapshots } from "@/lib/records";
import { getGithubAccount, getShipMeta, markGithubExpired, readGithubToken, setSnapshotCommit, updateShipMeta } from "@/lib/ship/data";

export async function pushCurrentFiles(input: {
  userId: string;
  projectId: string;
  projectName: string;
  message?: string;
  repoName?: string;
  isPrivate?: boolean;
  forceBranch?: string;
}): Promise<SyncResult> {
  const account = await getGithubAccount(input.userId);
  const token = readGithubToken(account);
  if (!token) return { ok: false, reason: "unauthorized", message: account?.expired ? "Reconnect GitHub." : "Connect GitHub to push." };
  const ship = await getShipMeta(input.projectId);
  const files = await listFiles(input.projectId);
  const snapshots = await listSnapshots(input.projectId);
  const pushed = [...snapshots].reverse().find((snapshot) => snapshot.commitSha);
  const result = await syncRepository({
    api: githubApi(token),
    repo: ship.githubRepo,
    repoName: input.repoName || repoNameFromProject(input.projectName, input.projectId),
    isPrivate: input.isPrivate ?? true,
    branch: ship.githubBranch || "main",
    message: input.message?.trim() || "Update from Architect",
    files,
    lastManifest: pushed?.manifest ?? null,
    lastCommitSha: pushed?.commitSha ?? null,
    forceBranch: input.forceBranch,
  });
  if (!result.ok && result.reason === "unauthorized") await markGithubExpired(input.userId);
  if (!result.ok && result.reason === "conflict") await updateShipMeta(input.projectId, { conflict: true });
  if (result.ok) {
    await updateShipMeta(input.projectId, { githubRepo: result.repo, conflict: false, lastAutoPushAt: new Date().toISOString() });
    const latest = snapshots.at(-1);
    if (latest) await setSnapshotCommit(input.projectId, latest.id, result.commitSha);
  }
  return result;
}
