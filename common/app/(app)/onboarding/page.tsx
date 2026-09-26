import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function OnboardingPage() {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-4 px-6 py-16">
      <p className="font-mono text-xs text-text-muted">Step 1 of 3</p>
      <h1 className="text-[28px] leading-9 font-medium">What takes up most of your week?</h1>
      <p className="text-sm text-text-muted">
        The AI Consultant asks a few questions and suggests apps. That conversation arrives in a later phase.
        You can skip it and start from Home.
      </p>
      <div>
        <Button asChild>
          <Link href="/home">Continue to Home</Link>
        </Button>
      </div>
    </main>
  );
}
