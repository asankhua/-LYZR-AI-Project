import Link from "next/link";
import { notFound } from "next/navigation";
import { ProjectSettings } from "@/components/project/project-settings";
import { getDemoProjectTheme } from "@/lib/demo/store";
import { requireUser } from "@/lib/login-redirect";
import { getProject } from "@/lib/projects";
import { getShipMeta } from "@/lib/ship/data";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { themePresets, type ThemePresetId } from "@/lib/templates/themes";

export default async function ProjectSettingsPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  const { id } = await params;
  const project = await getProject(session.id, id);
  if (!project) notFound();
  const [ship, storedTheme] = await Promise.all([
    getShipMeta(project.id),
    isSupabaseConfigured() ? Promise.resolve(null) : getDemoProjectTheme(project.id),
  ]);
  const theme = storedTheme && storedTheme in themePresets ? (storedTheme as ThemePresetId) : "minimal";
  return (
    <div className="min-h-full bg-bg">
      <header className="flex h-14 items-center gap-3 border-b border-border px-4">
        <Link href={`/p/${project.id}`} className="text-sm text-text-muted">
          Back to {project.name}
        </Link>
      </header>
      <ProjectSettings projectId={project.id} initialName={project.name} initialTheme={theme} initialKey={ship.publicKey} />
    </div>
  );
}
