import Link from "next/link";
import { redirect } from "next/navigation";
import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { getSession } from "@/lib/session";

export default async function LandingPage() {
  const session = await getSession();
  if (session) redirect("/home");

  return (
    <main className="mx-auto flex min-h-screen max-w-3xl flex-col justify-center px-6">
      <Logo withWord />
      <h1 className="mt-8 text-[40px] leading-[48px] font-medium tracking-tight">
        From idea to a live AI app in minutes
      </h1>
      <p className="mt-3 max-w-xl text-base text-text-muted">
        Plan it, design the agents, watch it build, and ship — with or without code.
      </p>
      <div className="mt-8 flex items-center gap-3">
        <Button asChild>
          <Link href="/login">Start building</Link>
        </Button>
        <Link href="/try" className="text-sm text-text-muted hover:text-text">
          Try without an account
        </Link>
      </div>
    </main>
  );
}
