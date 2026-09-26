import { NextResponse } from "next/server";
import { marketplaceApp } from "@/lib/marketplace/catalog";
import { createProject } from "@/lib/projects";
import { getSession } from "@/lib/session";

export async function POST(_request: Request, context: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  const { id } = await context.params;
  const app = marketplaceApp(id);
  if (!app) return NextResponse.json({ error: "That app is not in the marketplace." }, { status: 404 });
  const project = await createProject({ ownerId: session.id, prompt: app.prompt, template: "vite-react" });
  return NextResponse.json({ projectId: project.id });
}
