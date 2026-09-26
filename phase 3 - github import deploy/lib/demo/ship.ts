import { blankShip, mutateDemo } from "@/lib/demo/store";
import type { Deployment, GitHubAccount, ShipMeta } from "@/lib/types";

function ensure(store: { ship: ShipMeta[] }, projectId: string) {
  let row = store.ship.find((item) => item.projectId === projectId);
  if (!row) {
    row = blankShip(projectId);
    store.ship.push(row);
  }
  return row;
}

export function demoRenameProject(projectId: string, name: string) {
  return mutateDemo((store) => {
    const project = store.projects.find((item) => item.id === projectId);
    if (!project) return;
    project.name = name;
    project.updatedAt = new Date().toISOString();
  });
}

export function demoGetShip(projectId: string) {
  return mutateDemo((store) => ({ ...ensure(store, projectId) }));
}

export function demoUpdateShip(projectId: string, patch: Partial<ShipMeta>) {
  return mutateDemo((store) => {
    const row = ensure(store, projectId);
    Object.assign(row, patch, { projectId });
    return { ...row };
  });
}

export function demoFindByPublicKey(key: string) {
  return mutateDemo((store) => {
    const ship = store.ship.find((item) => item.publicKey === key);
    if (!ship) return null;
    const project = store.projects.find((item) => item.id === ship.projectId);
    return project ? { project, ship: { ...ship } } : null;
  });
}

export function demoSaveAccount(account: GitHubAccount) {
  return mutateDemo((store) => {
    const index = store.accounts.findIndex((item) => item.userId === account.userId);
    if (index === -1) store.accounts.push(account);
    else store.accounts[index] = account;
  });
}

export function demoGetAccount(userId: string) {
  return mutateDemo((store) => {
    const account = store.accounts.find((item) => item.userId === userId);
    return account ? { ...account } : null;
  });
}

export function demoAddHit(projectId: string, at: string) {
  return mutateDemo((store) => {
    store.publicHits.push({ projectId, at });
    const cutoff = Date.parse(at) - 60_000;
    store.publicHits = store.publicHits.filter((hit) => Date.parse(hit.at) >= cutoff);
  });
}

export function demoRecentHits(projectId: string, since: number) {
  return mutateDemo((store) => store.publicHits.filter((hit) => hit.projectId === projectId && Date.parse(hit.at) >= since).map((hit) => Date.parse(hit.at)));
}

export function demoAddDeployment(deployment: Deployment) {
  return mutateDemo((store) => {
    store.deployments.push(deployment);
    return deployment;
  });
}

export function demoListDeployments(projectId: string) {
  return mutateDemo((store) =>
    store.deployments
      .filter((item) => item.projectId === projectId)
      .slice()
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
  );
}

export function demoGetDeployment(id: string) {
  return mutateDemo((store) => {
    const deployment = store.deployments.find((item) => item.id === id);
    return deployment ? { ...deployment } : null;
  });
}

export function demoUpdateDeployment(id: string, patch: Partial<Deployment>) {
  return mutateDemo((store) => {
    const deployment = store.deployments.find((item) => item.id === id);
    if (!deployment) return null;
    Object.assign(deployment, patch);
    return { ...deployment };
  });
}

export function demoPromote(projectId: string, id: string, at: string) {
  return mutateDemo((store) => {
    for (const deployment of store.deployments) {
      if (deployment.projectId === projectId) deployment.promotedAt = deployment.id === id ? at : null;
    }
  });
}

export function demoDeployTimes(userId: string) {
  return mutateDemo((store) => store.deployments.filter((item) => item.createdBy === userId).map((item) => item.createdAt));
}

export function demoSetCommit(projectId: string, snapshotId: string, sha: string) {
  return mutateDemo((store) => {
    const snapshot = store.snapshots.find((item) => item.id === snapshotId && item.projectId === projectId);
    if (snapshot) snapshot.commitSha = sha;
  });
}

export function demoSubdomainTaken(subdomain: string, projectId: string) {
  return mutateDemo((store) => store.deployments.some((item) => item.subdomain === subdomain && item.projectId !== projectId && item.status !== "error"));
}
