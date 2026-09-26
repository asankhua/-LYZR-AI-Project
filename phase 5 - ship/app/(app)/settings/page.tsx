import { SettingsScreen } from "@/components/settings/settings-screen";
import { getSession } from "@/lib/session";
import { redirect } from "next/navigation";

export default async function SettingsPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <SettingsScreen name={session.fullName} mode={session.mode} />;
}
