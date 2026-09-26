import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/session";
import { isAuthDisabled } from "@/lib/supabase/env";

const steps = [
  { title: "Plan", body: "A prompt becomes a short plan you can edit." },
  { title: "Agents", body: "The work is split across agents you can see." },
  { title: "Build", body: "A Vite + React app runs in the browser." },
  { title: "Ship", body: "Push to GitHub and open a live URL." },
];

export default async function LandingPage() {
  const session = await getSession();
  if (session) redirect("/home");

  return (
    <main className="mx-auto flex min-h-screen max-w-5xl flex-col px-6 py-16">
      <Logo withWord />
      <h1 className="mt-10 max-w-2xl text-[40px] leading-[48px] font-medium tracking-tight">
        From idea to a live AI app in minutes
      </h1>
      <p className="mt-3 max-w-xl text-base text-text-muted">
        Plan it, design the agents, watch it build, and ship — with or without code.
      </p>
      <div className="mt-8 flex items-center gap-3">
        <Button asChild>
          <Link href={isAuthDisabled() ? "/try" : "/login"}>Start building</Link>
        </Button>
        <Link href="/try" className="text-sm text-text-muted hover:text-text">
          Try without an account
        </Link>
      </div>
      <section className="mt-14">
        <h2 className="text-sm font-medium">How it works</h2>
        <ol className="mt-3 grid gap-3 sm:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.title} className="rounded-md border border-border bg-surface p-4">
              <span className="font-mono text-xs text-text-muted">0{index + 1}</span>
              <p className="mt-1 text-sm font-medium">{step.title}</p>
              <p className="mt-1 text-sm text-text-muted">{step.body}</p>
            </li>
          ))}
        </ol>
      </section>
      <section className="mt-10 grid gap-3 md:grid-cols-2">
        <article className="rounded-md border border-border bg-surface p-4">
          <h2 className="text-sm font-medium">Built for people who do not write code</h2>
          <p className="mt-1 text-sm text-text-muted">Simple mode stays on the plan, the agents, and the preview.</p>
        </article>
        <article className="rounded-md border border-border bg-surface p-4">
          <h2 className="text-sm font-medium">Built for people who do</h2>
          <p className="mt-1 text-sm text-text-muted">Developer mode adds the editor, terminal, env, and Git.</p>
        </article>
      </section>
      <p className="mt-12 font-mono text-xs text-text-muted">Powered by Groq · Vite + React app · Default agent runtime</p>
      <p className="mt-4 flex gap-4 text-sm text-text-muted">
        <Link href="/privacy">Privacy</Link>
        <Link href="/terms">Terms</Link>
      </p>
    </main>
  );
}
