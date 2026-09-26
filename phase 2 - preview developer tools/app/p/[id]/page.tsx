import { notFound, redirect } from "next/navigation";
import { WorkspaceShell } from "@/components/workspace/workspace-shell";
import { getProject, listMessages } from "@/lib/projects";
import { getPlan, listAgents, listFiles } from "@/lib/records";
import { getSession } from "@/lib/session";

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;
  const project = await getProject(session.id, id);
  if (!project) notFound();
  const [messages, plan, agents, files] = await Promise.all([
    listMessages(project.id),
    getPlan(project.id),
    listAgents(project.id),
    listFiles(project.id),
  ]);
  return (
    <WorkspaceShell
      project={project}
      messages={messages}
      mode={session.mode}
      initialPlan={plan?.doc ?? null}
      initialAgents={agents}
      initialFiles={files}
    />
  );
}
