import { NextResponse } from "next/server";
import { z } from "zod";
import { listEnv, saveEnv } from "@/lib/records";
import { requireProject } from "@/lib/ship/guard";

const bodySchema = z.object({
  key: z.string().trim().min(1).max(80).regex(/^[A-Z0-9_]+$/),
  value: z.string().max(4000),
});

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const access = await requireProject(id);
  if ("error" in access) return access.error;
  const rows = await listEnv(access.project.id);
  return NextResponse.json({
    variables: rows.map((row) => ({ key: row.key, masked: mask(row.value) })),
  });
}

export async function PUT(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const access = await requireProject(id);
  if ("error" in access) return access.error;
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Use an uppercase key such as VITE_ARCHITECT_KEY." }, { status: 400 });
  await saveEnv(access.project.id, parsed.data.key, parsed.data.value);
  return NextResponse.json({ key: parsed.data.key, masked: mask(parsed.data.value) });
}

function mask(value: string) {
  if (!value) return "••••";
  if (value.length <= 2) return "••••";
  return `${"•".repeat(Math.min(8, value.length - 2))}${value.slice(-2)}`;
}
