import Link from "next/link";
import { Button } from "@/components/ui/button";

export function LaterPage({ title, body }: { title: string; body: string }) {
  return (
    <main className="mx-auto flex max-w-xl flex-col gap-3 px-6 py-16">
      <h1 className="text-[28px] leading-9 font-medium">{title}</h1>
      <p className="text-sm text-text-muted">{body}</p>
      <div>
        <Button asChild variant="outline">
          <Link href="/home">Back to Home</Link>
        </Button>
      </div>
    </main>
  );
}
