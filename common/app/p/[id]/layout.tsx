import { GuestBanner } from "@/components/guest-banner";
import { getSession } from "@/lib/session";

export default async function ProjectLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  return (
    <div className="flex h-screen flex-col">
      {session?.isAnonymous ? <GuestBanner /> : null}
      <div className="min-h-0 flex-1">{children}</div>
    </div>
  );
}
