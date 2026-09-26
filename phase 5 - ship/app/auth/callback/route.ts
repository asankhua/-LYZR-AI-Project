import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { githubLogin } from "@/lib/github/client";
import { seedGuestProject } from "@/lib/projects";
import { getSession } from "@/lib/session";
import { saveGithubAccount } from "@/lib/ship/data";
import { safeNext } from "@/lib/ship/guard";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin));
    const token = data.session?.provider_token;
    const user = data.session?.user;
    if (token && user) {
      try {
        await saveGithubAccount(user.id, token, await githubLogin(token));
      } catch {
        // A missing encryption key should not block the sign-in itself.
      }
    }
  }
  const cookieStore = await cookies();
  const next = safeNext(cookieStore.get("architect_github_next")?.value);
  cookieStore.set("architect_github_next", "", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 0 });
  if (next) return NextResponse.redirect(new URL(next, url.origin));
  const session = await getSession();
  if (session) await seedGuestProject(session.id);
  const destination = session && !session.onboardingDone ? "/onboarding" : "/home";
  return NextResponse.redirect(new URL(destination, url.origin));
}
