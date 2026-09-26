import type { ReactNode } from "react";
import { redirect } from "next/navigation";
import { SignupPanel } from "@/components/auth/signup-panel";
import { LoginPanel } from "@/components/auth/login-panel";
import { Logo } from "@/components/logo";
import { getSession } from "@/lib/session";
import { safeNext } from "@/lib/ship/guard";
import { isAuthDisabled } from "@/lib/supabase/env";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ sent?: string; error?: string; claim?: string; next?: string }>;
}) {
  const params = await searchParams;
  const next = safeNext(params.next) ?? "/home";
  if (isAuthDisabled()) {
    const session = await getSession();
    if (session && !session.isAnonymous) redirect(next);
    return (
      <AuthShell>
        <SignupPanel
          next={next}
          error={params.error}
          defaultName={session?.fullName && session.fullName !== "Guest" ? session.fullName : ""}
        />
      </AuthShell>
    );
  }
  return (
    <AuthShell>
      <LoginPanel sent={params.sent} error={params.error} claim={params.claim === "1"} />
    </AuthShell>
  );
}

function AuthShell({ children }: { children: ReactNode }) {
  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="hidden flex-col justify-between bg-accent-soft p-10 pb-16 lg:flex">
        <Logo withWord />
        <div>
          <p className="max-w-md text-[32px] leading-10 font-medium">Build and ship agentic apps from a prompt</p>
          <div className="mt-6 max-w-sm rounded-md border border-border bg-surface p-4 text-sm">
            <p className="font-mono text-xs text-text-muted">Plan · Agents · Build</p>
            <p className="mt-2">A plan turns into agents, then into an app you can preview.</p>
          </div>
        </div>
        <p className="text-xs text-text-muted">Powered by Groq</p>
      </section>
      <section className="flex items-center justify-center p-6">{children}</section>
    </main>
  );
}
