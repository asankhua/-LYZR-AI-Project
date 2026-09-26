import { SettingsScreen } from "@/components/settings/settings-screen";
import { requireUser } from "@/lib/login-redirect";

export default async function SettingsPage() {
  const session = await requireUser();
  return <SettingsScreen name={session.fullName} mode={session.mode} />;
}
