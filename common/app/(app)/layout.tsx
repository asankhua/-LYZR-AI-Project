import { redirect } from "next/navigation";
import { GuestBanner } from "@/components/guest-banner";
import { AppSidebar } from "@/components/shell/app-sidebar";
import { AppTopBar } from "@/components/shell/app-topbar";
import { getSession } from "@/lib/session";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/login");

  return (
    <div className="min-h-screen bg-bg">
      <AppSidebar mode={session.mode} name={session.fullName} />
      <div className="pl-16">
        {session.isAnonymous ? <GuestBanner /> : null}
        <AppTopBar />
        <main>{children}</main>
      </div>
    </div>
  );
}
