import { redirect } from "next/navigation";
import { seedGuestProject } from "@/lib/projects";
import { getSession, startDemoSession } from "@/lib/session";
import { safeNext } from "@/lib/ship/guard";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

function afterTry(request: Request) {
  const next = safeNext(new URL(request.url).searchParams.get("next"));
  if (!next || next === "/try" || next.startsWith("/try?") || next.startsWith("/login") || next.startsWith("/auth")) return "/home";
  return next;
}

export async function GET(request: Request) {
  const destination = afterTry(request);
  if (!isSupabaseConfigured()) {
    const id = await startDemoSession();
    await seedGuestProject(id);
    redirect(destination);
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
  redirect(destination);
}
