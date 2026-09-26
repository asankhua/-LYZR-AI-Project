import "server-only";
import { pushCurrentFiles } from "@/lib/github/push-project";
import { getProject } from "@/lib/projects";
import { getShipMeta } from "@/lib/ship/data";

export async function maybeAutoPush(userId: string, projectId: string) {
  const ship = await getShipMeta(projectId);
  if (!ship.autoCommit || !ship.githubRepo) return null;
  if (ship.lastAutoPushAt && Date.now() - Date.parse(ship.lastAutoPushAt) < 30_000) return null;
  const project = await getProject(userId, projectId);
  if (!project) return null;
  return pushCurrentFiles({ userId, projectId, projectName: project.name });
}
