import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { safeNext } from "@/lib/ship/guard";
import type { SessionUser } from "@/lib/types";

export async function redirectToLogin(): Promise<never> {
  const path = safeNext((await headers()).get("x-architect-path")) ?? "/home";
  redirect(`/login?next=${encodeURIComponent(path)}`);
}

export async function requireUser(): Promise<SessionUser> {
  const session = await getSession();
  if (session) return session;
  return redirectToLogin();
}
