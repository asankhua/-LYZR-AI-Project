import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { z } from "zod";
import { safeNext } from "@/lib/ship/guard";
import { getSession } from "@/lib/session";
import { isSupabaseConfigured } from "@/lib/supabase/env";
import { createClient } from "@/lib/supabase/server";

const bodySchema = z.object({ next: z.string().optional() });

export async function POST(request: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Sign in required" }, { status: 401 });
  if (session.isAnonymous) return NextResponse.json({ error: "Sign up to connect GitHub." }, { status: 403 });
  if (!isSupabaseConfigured()) return NextResponse.json({ error: "GitHub connect needs a signed-in Supabase account." }, { status: 400 });
  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  const next = safeNext(parsed.success ? parsed.data.next : undefined) ?? "/home";
  const cookieStore = await cookies();
  cookieStore.set("architect_github_next", next, { httpOnly: true, sameSite: "lax", path: "/", maxAge: 600 });
  const supabase = await createClient();
  const origin = process.env.NEXT_PUBLIC_APP_URL ?? new URL(request.url).origin;
  const { data, error } = await supabase.auth.linkIdentity({
    provider: "github",
    options: { scopes: "read:user user:email repo", redirectTo: `${origin}/auth/callback` },
  });
  if (error || !data?.url) return NextResponse.json({ error: error?.message ?? "Could not start GitHub connect." }, { status: 400 });
  return NextResponse.json({ url: data.url });
}
