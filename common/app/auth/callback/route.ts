import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (error) {
      return NextResponse.redirect(new URL(`/login?error=${encodeURIComponent(error.message)}`, url.origin));
    }
  }
  const session = await getSession();
  const destination = session && !session.onboardingDone ? "/onboarding" : "/home";
  return NextResponse.redirect(new URL(destination, url.origin));
}
