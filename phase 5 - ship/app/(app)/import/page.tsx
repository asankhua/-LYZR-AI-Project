import { redirect } from "next/navigation";
import { ImportScreen } from "@/components/import/import-screen";
import { getSession } from "@/lib/session";

export default async function ImportPage() {
  const session = await getSession();
  if (!session) redirect("/login");
  return <ImportScreen guest={session.isAnonymous} />;
}
