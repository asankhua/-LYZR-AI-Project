import Link from "next/link";

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-[32px] leading-10 font-medium">Terms</h1>
      <p className="mt-3 text-sm text-text-muted">
        Architect builds a Vite + React app from your prompt. You can export the files or push them to a repository you control.
      </p>
      <Link href="/" className="mt-6 inline-block text-sm text-accent">
        Back
      </Link>
    </main>
  );
}
