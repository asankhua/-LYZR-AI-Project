import {
  createDemoProject,
  getDemoProject,
  listDemoMessages,
  listDemoProjects,
  seedDemoProject,
} from "@/lib/demo/store";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { seedSupabaseGuest } from "@/lib/templates/demo/supabase-seed";
import type { Project, ProjectMessage, Stage } from "@/lib/types";
import { projectNameFromPrompt } from "@/lib/utils";

export async function listProjects(ownerId: string): Promise<Project[]> {
  if (!isSupabaseConfigured()) return listDemoProjects(ownerId);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, owner_id, name, description, stage, template, updated_at")
    .order("updated_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []).map(toProject);
}

export async function getProject(ownerId: string, id: string): Promise<Project | null> {
  if (!isSupabaseConfigured()) return getDemoProject(ownerId, id);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .select("id, owner_id, name, description, stage, template, updated_at")
    .eq("id", id)
    .maybeSingle();
  if (error) throw new Error(error.message);
  return data ? toProject(data) : null;
}

export async function listMessages(projectId: string): Promise<ProjectMessage[]> {
  if (!isSupabaseConfigured()) return listDemoMessages(projectId);
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("messages")
    .select("id, project_id, role, content, created_at")
    .eq("project_id", projectId)
    .order("created_at", { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []).map((row) => ({
    id: row.id,
    projectId: row.project_id,
    role: row.role,
    content: row.content ?? "",
    createdAt: row.created_at,
  }));
}

export async function createProject(input: {
  ownerId: string;
  prompt: string;
  template?: string;
}): Promise<Project> {
  const name = projectNameFromPrompt(input.prompt);
  if (!isSupabaseConfigured()) {
    return createDemoProject({
      ownerId: input.ownerId,
      name,
      description: input.prompt,
      template: input.template,
    });
  }
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("projects")
    .insert({
      owner_id: input.ownerId,
      name,
      description: input.prompt,
      template: input.template ?? "vite-react",
      stage: "plan",
    })
    .select("id, owner_id, name, description, stage, template, updated_at")
    .single();
  if (error || !data) throw new Error(error?.message ?? "Could not create the project");
  await supabase.from("messages").insert({
    project_id: data.id,
    role: "user",
    kind: "chat",
    content: input.prompt,
    created_by: input.ownerId,
  });
  return toProject(data);
}

export async function seedGuestProject(ownerId: string): Promise<void> {
  if (!isSupabaseConfigured()) {
    await seedDemoProject(ownerId);
    return;
  }
  const existing = await listProjects(ownerId);
  if (existing.length > 0) return;
  await seedSupabaseGuest(ownerId);
}

function toProject(row: {
  id: string;
  owner_id: string;
  name: string;
  description: string | null;
  stage: string;
  template: string;
  updated_at: string;
}): Project {
  return {
    id: row.id,
    ownerId: row.owner_id,
    name: row.name,
    description: row.description,
    stage: row.stage as Stage,
    template: row.template,
    updatedAt: row.updated_at,
  };
}
