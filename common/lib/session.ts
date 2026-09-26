import { cookies } from "next/headers";
import { ensureDemoProfile, setDemoMode } from "@/lib/demo/store";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import type { Mode, SessionUser } from "@/lib/types";

export const DEMO_COOKIE = "architect_demo_user";

export async function getSession(): Promise<SessionUser | null> {
  if (isSupabaseConfigured()) return getSupabaseSession();
  const cookieStore = await cookies();
  const id = cookieStore.get(DEMO_COOKIE)?.value;
  if (!id) return null;
  return ensureDemoProfile(id);
}

export async function startDemoSession(): Promise<string> {
  const cookieStore = await cookies();
  const existing = cookieStore.get(DEMO_COOKIE)?.value;
  const id = existing ?? crypto.randomUUID();
  cookieStore.set(DEMO_COOKIE, id, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
  await ensureDemoProfile(id);
  return id;
}

export async function updateSessionMode(mode: Mode): Promise<void> {
  const session = await getSession();
  if (!session) return;
  if (!isSupabaseConfigured()) {
    await setDemoMode(session.id, mode);
    return;
  }
  const supabase = await createClient();
  await supabase.from("profiles").update({ mode }).eq("id", session.id);
}

async function getSupabaseSession(): Promise<SessionUser | null> {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) return null;
  const { data: profile } = await supabase
    .from("profiles")
    .select("full_name, mode, onboarding")
    .eq("id", user.id)
    .maybeSingle();
  const metadata = user.user_metadata as { full_name?: string; name?: string } | undefined;
  return {
    id: user.id,
    email: user.email ?? null,
    fullName: profile?.full_name ?? metadata?.full_name ?? metadata?.name ?? null,
    mode: profile?.mode === "developer" ? "developer" : "simple",
    isAnonymous: Boolean(user.is_anonymous),
    onboardingDone: profile?.onboarding != null,
  };
}
