import { notFound } from "next/navigation";
import { requireUser } from "@/lib/login-redirect";
import { DeployWizard } from "@/components/deploy/deploy-wizard";
import { getProject } from "@/lib/projects";
import { getShipMeta } from "@/lib/ship/data";

export default async function DeployPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await requireUser();
  const { id } = await params;
  const project = await getProject(session.id, id);
  if (!project) notFound();
  const ship = await getShipMeta(project.id);
  return <DeployWizard project={project} guest={session.isAnonymous} initialKey={ship.publicKey} />;
}
