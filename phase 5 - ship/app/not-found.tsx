import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
      <h1 className="text-[32px] leading-10 font-medium">Page not found</h1>
      <p className="mt-2 text-sm text-text-muted">That address is not part of Architect.</p>
      <Link href="/home" className="mt-4 text-sm text-accent">
        Go to Home
      </Link>
    </main>
  );
}
