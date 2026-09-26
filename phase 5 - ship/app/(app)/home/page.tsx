import { HomeScreen } from "@/components/home/home-screen";
import { listProjects } from "@/lib/projects";
import { requireUser } from "@/lib/login-redirect";

export default async function HomePage() {
  const session = await requireUser();
  const projects = await listProjects(session.id);
  return <HomeScreen name={session.fullName} projects={projects} mode={session.mode} />;
}
