"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-lg flex-col justify-center px-6">
      <h1 className="text-[32px] leading-10 font-medium">Something went wrong</h1>
      <p className="mt-2 text-sm text-text-muted">The page could not finish loading.</p>
      <button type="button" className="mt-4 text-left text-sm font-medium text-accent" onClick={() => reset()}>
        Try again
      </button>
    </main>
  );
}
