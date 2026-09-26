import Link from "next/link";

export default function PrivacyPage() {
  return (
    <main className="mx-auto max-w-2xl px-6 py-16">
      <h1 className="text-[32px] leading-10 font-medium">Privacy</h1>
      <p className="mt-3 text-sm text-text-muted">
        Guest projects stay in a local demo store on this machine until you sign in. Model keys and env values stay on the server.
      </p>
      <Link href="/" className="mt-6 inline-block text-sm text-accent">
        Back
      </Link>
    </main>
  );
}
