import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type {
  AgentRun,
  AgentSpec,
  Mode,
  PlanDoc,
  Project,
  ProjectFile,
  ProjectMessage,
  SessionUser,
  Snapshot,
  Stage,
} from "@/lib/types";

type ProfileRow = {
  id: string;
  fullName: string | null;
  email: string | null;
  mode: Mode;
  isAnonymous: boolean;
  onboardingDone: boolean;
};

type UsageRow = {
  id: string;
  userId: string;
  projectId: string | null;
  stage: string;
  model: string;
  inputTokens: number;
  outputTokens: number;
  createdAt: string;
};

type Store = {
  profiles: ProfileRow[];
  projects: Project[];
  messages: ProjectMessage[];
  plans: { projectId: string; doc: PlanDoc; approvedAt: string | null; version: number }[];
  agents: AgentSpec[];
  files: ProjectFile[];
  snapshots: Snapshot[];
  runs: AgentRun[];
  usage: UsageRow[];
};

const filePath = path.join(process.cwd(), ".data", "store.json");

const empty: Store = {
  profiles: [],
  projects: [],
  messages: [],
  plans: [],
  agents: [],
  files: [],
  snapshots: [],
  runs: [],
  usage: [],
};

let queue: Promise<unknown> = Promise.resolve();

async function readStore(): Promise<Store> {
  try {
    const raw = await readFile(filePath, "utf8");
    return { ...structuredClone(empty), ...(JSON.parse(raw) as Partial<Store>) };
  } catch {
    return structuredClone(empty);
  }
}

export function mutateDemo<T>(fn: (store: Store) => T | Promise<T>): Promise<T> {
  return update(fn);
}

async function writeStore(store: Store): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, JSON.stringify(store, null, 2));
}

function update<T>(fn: (store: Store) => T | Promise<T>): Promise<T> {
  const run = queue.then(async () => {
    const store = await readStore();
    const result = await fn(store);
    await writeStore(store);
    return result;
  });
  queue = run.then(
    () => undefined,
    () => undefined,
  );
  return run;
}

export function ensureDemoProfile(id: string): Promise<SessionUser> {
  return update((store) => {
    let profile = store.profiles.find((row) => row.id === id);
    if (!profile) {
      profile = {
        id,
        fullName: "Guest",
        email: null,
        mode: "simple",
        isAnonymous: true,
        onboardingDone: true,
      };
      store.profiles.push(profile);
    }
    return toSession(profile);
  });
}

export function getDemoProfile(id: string): Promise<SessionUser | null> {
  return update((store) => {
    const profile = store.profiles.find((row) => row.id === id);
    return profile ? toSession(profile) : null;
  });
}

export function setDemoMode(id: string, mode: Mode): Promise<void> {
  return update((store) => {
    const profile = store.profiles.find((row) => row.id === id);
    if (profile) profile.mode = mode;
  });
}

export function listDemoProjects(ownerId: string): Promise<Project[]> {
  return update((store) =>
    store.projects
      .filter((project) => project.ownerId === ownerId)
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
  );
}

export function getDemoProject(ownerId: string, id: string): Promise<Project | null> {
  return update((store) => {
    const project = store.projects.find((row) => row.id === id && row.ownerId === ownerId);
    return project ?? null;
  });
}

export function listDemoMessages(projectId: string): Promise<ProjectMessage[]> {
  return update((store) =>
    store.messages
      .filter((message) => message.projectId === projectId)
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
  );
}

export function createDemoProject(input: {
  ownerId: string;
  name: string;
  description: string;
  stage?: Stage;
  template?: string;
}): Promise<Project> {
  return update((store) => {
    const project: Project = {
      id: crypto.randomUUID(),
      ownerId: input.ownerId,
      name: input.name,
      description: input.description,
      stage: input.stage ?? "plan",
      template: input.template ?? "vite-react",
      updatedAt: new Date().toISOString(),
    };
    store.projects.push(project);
    store.messages.push({
      id: crypto.randomUUID(),
      projectId: project.id,
      role: "user",
      content: input.description,
      createdAt: project.updatedAt,
    });
    return project;
  });
}

export function seedDemoProject(ownerId: string): Promise<void> {
  return update((store) => {
    const hasProject = store.projects.some((project) => project.ownerId === ownerId);
    if (hasProject) return;
    const now = new Date().toISOString();
    const project: Project = {
      id: crypto.randomUUID(),
      ownerId,
      name: "Travel Planner",
      description:
        "A shared trip planner where a group votes on flights and hotels, gets a daily itinerary, and splits costs.",
      stage: "build",
      template: "vite-react",
      updatedAt: now,
    };
    store.projects.push(project);
    store.messages.push({
      id: crypto.randomUUID(),
      projectId: project.id,
      role: "user",
      content: project.description ?? "",
      createdAt: now,
    });
  });
}

export function demoGetPlan(projectId: string) {
  return update((store) => store.plans.find((plan) => plan.projectId === projectId) ?? null);
}

export function demoSavePlan(projectId: string, doc: PlanDoc) {
  return update((store) => {
    const existing = store.plans.find((plan) => plan.projectId === projectId);
    if (existing) {
      existing.doc = doc;
      existing.version += 1;
      return existing;
    }
    const created = { projectId, doc, approvedAt: null, version: 1 };
    store.plans.push(created);
    return created;
  });
}

export function demoSetStage(projectId: string, stage: Stage) {
  return update((store) => {
    const project = store.projects.find((row) => row.id === projectId);
    if (project) {
      project.stage = stage;
      project.updatedAt = new Date().toISOString();
    }
  });
}

export function demoApprovePlan(projectId: string) {
  return update((store) => {
    const plan = store.plans.find((row) => row.projectId === projectId);
    if (plan) plan.approvedAt = new Date().toISOString();
    const project = store.projects.find((row) => row.id === projectId);
    if (project) {
      project.stage = "agents";
      project.updatedAt = new Date().toISOString();
    }
  });
}

export function demoListAgents(projectId: string) {
  return update((store) => store.agents.filter((agent) => agent.projectId === projectId));
}

export function demoReplaceAgents(projectId: string, agents: AgentSpec[]) {
  return update((store) => {
    store.agents = store.agents.filter((agent) => agent.projectId !== projectId).concat(agents);
  });
}

export function demoUpdateAgent(projectId: string, id: string, spec: AgentSpec) {
  return update((store) => {
    const index = store.agents.findIndex((agent) => agent.id === id && agent.projectId === projectId);
    if (index === -1) return null;
    store.agents[index] = spec;
    return spec;
  });
}

export function demoListFiles(projectId: string) {
  return update((store) => store.files.filter((file) => file.projectId === projectId));
}

export function demoApplyFiles(projectId: string, files: ProjectFile[]) {
  return update((store) => {
    for (const file of files) {
      const index = store.files.findIndex((row) => row.projectId === projectId && row.path === file.path);
      if (index === -1) store.files.push(file);
      else store.files[index] = file;
    }
  });
}

export function demoAddSnapshot(snapshot: Snapshot) {
  return update((store) => {
    store.snapshots.push(snapshot);
  });
}

export function demoAddRun(run: AgentRun) {
  return update((store) => {
    store.runs.push(run);
    const agent = store.agents.find((row) => row.projectId === run.projectId && row.name === run.agentName);
    if (agent && run.status === "ok") agent.testPassed = true;
    return run;
  });
}

export function demoListRuns(projectId: string, agentName: string) {
  return update((store) =>
    store.runs.filter((run) => run.projectId === projectId && run.agentName === agentName),
  );
}

export function demoAddUsage(row: UsageRow) {
  return update((store) => {
    store.usage.push(row);
  });
}

export function demoRecentTokens(userId: string, sinceMs: number) {
  return update((store) =>
    store.usage
      .filter((row) => row.userId === userId && Date.parse(row.createdAt) >= sinceMs)
      .reduce((sum, row) => sum + row.inputTokens + row.outputTokens, 0),
  );
}

export function demoAddMessage(message: ProjectMessage) {
  return update((store) => {
    store.messages.push(message);
  });
}

function toSession(profile: ProfileRow): SessionUser {
  return {
    id: profile.id,
    email: profile.email,
    fullName: profile.fullName,
    mode: profile.mode,
    isAnonymous: profile.isAnonymous,
    onboardingDone: profile.onboardingDone,
  };
}
