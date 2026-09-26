"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { claimDemoAccount } from "@/lib/demo/store";
import { seedGuestProject } from "@/lib/projects";
import { DEMO_COOKIE, startDemoSession } from "@/lib/session";
import { safeNext } from "@/lib/ship/guard";

export async function signUpDemo(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const next = safeNext(String(formData.get("next") ?? "")) ?? "/home";
  const back = `/login?next=${encodeURIComponent(next)}`;
  if (name.length < 1 || name.length > 80) redirect(`${back}&error=name`);
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 120) redirect(`${back}&error=email`);
  const id = await startDemoSession();
  const accountId = await claimDemoAccount(id, name, email);
  if (accountId !== id) {
    const cookieStore = await cookies();
    cookieStore.set(DEMO_COOKIE, accountId, {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
  }
  await seedGuestProject(accountId);
  redirect(next);
}
