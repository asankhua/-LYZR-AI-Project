import { NextResponse } from "next/server";
import { z } from "zod";
import { getDemoProjectTheme, setDemoProjectTheme } from "@/lib/demo/store";
import { deleteProject } from "@/lib/projects";
import { applyFiles, listFiles } from "@/lib/records";
import { renameProject } from "@/lib/ship/data";
import { requireProject } from "@/lib/ship/guard";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { themeCss, themePresets, type ThemePresetId } from "@/lib/templates/themes";

const themeIds = Object.keys(themePresets) as [ThemePresetId, ...ThemePresetId[]];

const patchSchema = z
  .object({
    name: z.string().trim().min(1).max(80).optional(),
    theme: z.enum(themeIds).optional(),
  })
  .refine((body) => body.name !== undefined || body.theme !== undefined, { message: "Nothing to update" });

export async function GET(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const access = await requireProject(id);
  if ("error" in access) return access.error;
  const theme = isSupabaseConfigured() ? null : await getDemoProjectTheme(access.project.id);
  return NextResponse.json({ name: access.project.name, theme });
}

export async function PATCH(request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const access = await requireProject(id);
  if ("error" in access) return access.error;
  const parsed = patchSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Check the project settings and try again." }, { status: 400 });
  if (parsed.data.name) await renameProject(access.project.id, parsed.data.name);
  if (parsed.data.theme) {
    if (!isSupabaseConfigured()) await setDemoProjectTheme(access.project.id, parsed.data.theme);
    const files = await listFiles(access.project.id);
    if (files.some((file) => file.path === "src/theme.css")) {
      await applyFiles(access.project.id, [{ path: "src/theme.css", content: themeCss(parsed.data.theme) }]);
    }
  }
  return NextResponse.json({ ok: true });
}

export async function DELETE(_request: Request, context: { params: Promise<{ id: string }> }) {
  const { id } = await context.params;
  const access = await requireProject(id);
  if ("error" in access) return access.error;
  await deleteProject(access.session.id, access.project.id);
  return NextResponse.json({ ok: true });
}
