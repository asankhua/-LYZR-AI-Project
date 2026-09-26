"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";
import { getSession, updateSessionMode } from "@/lib/session";
import type { Mode } from "@/lib/types";

export async function setMode(formData: FormData) {
  const mode = String(formData.get("mode"));
  const session = await getSession();
  if (!session) redirect("/login");
  if (mode !== "simple" && mode !== "developer") return;
  await updateSessionMode(mode as Mode);
  revalidatePath("/", "layout");
}

export async function sendMagicLink(formData: FormData) {
  const email = String(formData.get("email") ?? "").trim();
  if (!email.includes("@")) redirect("/login?error=email");
  if (!isSupabaseConfigured()) redirect("/login?error=config");
  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const { error } = await supabase.auth.signInWithOtp({
    email,
    options: { emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) redirect(`/login?error=${encodeURIComponent(error.message)}`);
  redirect(`/login?sent=${encodeURIComponent(email)}`);
}

export async function signInWithProvider(provider: "google" | "github") {
  if (!isSupabaseConfigured()) redirect("/login?error=config");
  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const session = await getSession();
  if (session?.isAnonymous) {
    const { data, error } = await supabase.auth.linkIdentity({
      provider,
      options: { redirectTo: `${origin}/auth/callback` },
    });
    if (error || !data.url) redirect(`/login?error=${encodeURIComponent(error?.message ?? "link")}`);
    redirect(data.url);
  }
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: { redirectTo: `${origin}/auth/callback` },
  });
  if (error || !data.url) redirect(`/login?error=${encodeURIComponent(error?.message ?? "oauth")}`);
  redirect(data.url);
}

export async function signOut() {
  if (isSupabaseConfigured()) {
    const supabase = await createClient();
    await supabase.auth.signOut();
  }
  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();
  cookieStore.delete("architect_demo_user");
  redirect("/login");
}
