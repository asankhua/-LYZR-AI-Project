import { ImportScreen } from "@/components/import/import-screen";
import { requireUser } from "@/lib/login-redirect";

export default async function ImportPage() {
  const session = await requireUser();
  return <ImportScreen guest={session.isAnonymous} />;
}
