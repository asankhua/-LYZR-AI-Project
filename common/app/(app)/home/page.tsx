import { HomeScreen } from "@/components/home/home-screen";
import { listProjects } from "@/lib/projects";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function HomePage() {
  const session = await getSession();
  if (!session) redirect("/login");
  const projects = await listProjects(session.id);
  return <HomeScreen name={session.fullName} projects={projects} />;
}
