import Link from "next/link";

export function GuestBanner() {
  return (
    <div className="flex min-h-10 shrink-0 flex-wrap items-center justify-between gap-2 border-b border-border bg-accent-soft px-4 py-2 text-sm">
      <p>You&apos;re trying Architect as a guest. Sign up to keep your work.</p>
      <Link href="/login?claim=1" className="rounded-sm border border-accent px-3 py-1 text-xs font-medium text-accent">
        Sign up
      </Link>
    </div>
  );
}
