import { notFound } from "next/navigation";
import { requireUser } from "@/lib/login-redirect";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { getProject, listMessages } from "@/lib/projects";
import { getPlan, listAgents, listFiles } from "@/lib/records";
import { getShipMeta } from "@/lib/ship/data";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  const { id } = await params;
  const project = await getProject(session.id, id);
  if (!project) notFound();
  const [messages, plan, agents, files, ship] = await Promise.all([
    listMessages(project.id),
    getPlan(project.id),
    listAgents(project.id),
    listFiles(project.id),
    getShipMeta(project.id),
  ]);
  return (
    <WorkspaceShell
      project={project}
      messages={messages}
      mode={session.mode}
      initialPlan={plan?.doc ?? null}
      initialAgents={agents}
      initialFiles={files}
      guest={session.isAnonymous}
      codeOnly={ship.codeOnly}
    />
  );
}
