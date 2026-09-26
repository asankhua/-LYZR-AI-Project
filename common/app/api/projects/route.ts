import { NextResponse } from "next/server";
import { z } from "zod";
import { createProject } from "@/lib/projects";
import { getSession } from "@/lib/session";

const bodySchema = z.object({
  prompt: z.string().trim().min(1).max(8000),
  template: z.string().trim().max(40).optional(),
});

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Describe the app you want to build." }, { status: 400 });
  }

  const project = await createProject({
    ownerId: session.id,
    prompt: parsed.data.prompt,
    template: parsed.data.template,
  });
  return NextResponse.json({ id: project.id });
}
