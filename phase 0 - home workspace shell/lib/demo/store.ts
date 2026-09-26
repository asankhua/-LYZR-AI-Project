import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Mode, Project, ProjectMessage, SessionUser, Stage } from "@/lib/types";

type ProfileRow = {
  id: string;
  fullName: string | null;
  email: string | null;
  mode: Mode;
  isAnonymous: boolean;
  onboardingDone: boolean;
};

type Store = {
  profiles: ProfileRow[];
  projects: Project[];
  messages: ProjectMessage[];
};

const filePath = path.join(process.cwd(), ".data", "store.json");

const empty: Store = { profiles: [], projects: [], messages: [] };

let queue: Promise<unknown> = Promise.resolve();

async function readStore(): Promise<Store> {
  try {
    const raw = await readFile(filePath, "utf8");
    return JSON.parse(raw) as Store;
  } catch {
    return structuredClone(empty);
  }
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
