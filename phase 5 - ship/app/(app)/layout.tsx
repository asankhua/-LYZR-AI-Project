import { GuestBanner } from "@/components/guest-banner";
import { AppChrome } from "@/components/shell/app-chrome";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { listProjects } from "@/lib/projects";
import { requireUser } from "@/lib/login-redirect";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireUser();
  const projects = await listProjects(session.id);

  return (
    <div className="min-h-screen bg-bg">
      <AppSidebar mode={session.mode} name={session.fullName} email={session.email} guest={session.isAnonymous} />
      <div className="pl-16">
        {session.isAnonymous ? <GuestBanner /> : null}
        <AppChrome projects={projects.map((project) => ({ id: project.id, name: project.name }))}>{children}</AppChrome>
      </div>
    </div>
  );
}
