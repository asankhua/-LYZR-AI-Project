import { notFound, redirect } from "next/navigation";
import { DeployWizard } from "@/components/deploy/deploy-wizard";
import { getProject } from "@/lib/projects";
import { getSession } from "@/lib/session";
import { getShipMeta } from "@/lib/ship/data";

export default async function DeployPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const { id } = await params;
  const project = await getProject(session.id, id);
  if (!project) notFound();
  const ship = await getShipMeta(project.id);
  return <DeployWizard project={project} guest={session.isAnonymous} initialKey={ship.publicKey} />;
}
