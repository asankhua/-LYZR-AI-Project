import Link from "next/link";
import { notFound } from "next/navigation";
import { requireUser } from "@/lib/login-redirect";
import { HistoryView } from "@/components/workspace/history-view";
import { getProject } from "@/lib/projects";
import { listFiles, listSnapshots } from "@/lib/records";

export default async function HistoryPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  const { id } = await params;
  const project = await getProject(session.id, id);
  if (!project) notFound();
  const [snapshots, files] = await Promise.all([listSnapshots(project.id), listFiles(project.id)]);
  return (
    <div className="min-h-full bg-bg">
      <header className="flex h-14 items-center gap-3 border-b border-border px-4">
        <Link href={`/p/${project.id}`} className="text-sm text-text-muted">
          Back to {project.name}
        </Link>
      </header>
      <HistoryView projectId={project.id} snapshots={snapshots} current={files} />
    </div>
  );
}
