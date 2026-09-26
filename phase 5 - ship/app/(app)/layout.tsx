import { redirect } from "next/navigation";
import { GuestBanner } from "@/components/guest-banner";
import { AppChrome } from "@/components/shell/app-chrome";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { listProjects } from "@/lib/projects";
import { getSession } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");
  const projects = await listProjects(session.id);

  return (
    <div className="min-h-screen bg-bg">
      <AppSidebar mode={session.mode} name={session.fullName} />
      <div className="pl-16">
        {session.isAnonymous ? <GuestBanner /> : null}
        <AppChrome projects={projects.map((project) => ({ id: project.id, name: project.name }))}>{children}</AppChrome>
      </div>
    </div>
  );
}
