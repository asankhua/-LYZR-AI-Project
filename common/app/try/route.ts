import { redirect } from "next/navigation";
import { seedGuestProject } from "@/lib/projects";
import { getSession, startDemoSession } from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  if (!isSupabaseConfigured()) {
    const id = await startDemoSession();
    await seedGuestProject(id);
    redirect("/home");
  }

  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) {
    const { error } = await supabase.auth.signInAnonymously();
    if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  }
  const session = await getSession();
  if (!session) redirect("/login?error=guest");
  await seedGuestProject(session.id);
  redirect("/home");
}
