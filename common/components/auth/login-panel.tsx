import { sendMagicLink, signInWithProvider } from "@/lib/actions";
import { isAuthDisabled, isSupabaseConfigured } from "@/lib/supabase/env";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function LoginPanel({
  sent,
  error,
  claim,
}: {
  sent?: string;
  error?: string;
  claim?: boolean;
}) {
  const configured = isSupabaseConfigured();
  const authOff = isAuthDisabled();

  if (sent) {
    return (
      <Card className="w-full max-w-[400px] p-6">
        <h1 className="text-xl font-medium">Check your email</h1>
        <p className="mt-2 text-sm text-text-muted">We sent a sign-in link to {sent}.</p>
        <Button className="mt-6 w-full" disabled>
          Resend in 30s
        </Button>
        <a href="/login" className="mt-3 block text-center text-sm text-accent">
          Use a different email
        </a>
      </Card>
    );
  }

  return (
    <Card className="w-full max-w-[400px] p-6">
      <h1 className="text-xl font-medium">Sign in to Architect</h1>
      <p className="mt-1 text-sm text-text-muted">
        {claim ? "Create an account to keep this guest project." : "Use Google, GitHub, or a magic link."}
      </p>
      {authOff ? (
        <p className="mt-3 rounded-sm bg-surface-2 px-3 py-2 text-sm text-text-muted">
          Sign-in is turned off while you review the app. Continue as a guest.
        </p>
      ) : !configured ? (
        <p className="mt-3 rounded-sm bg-surface-2 px-3 py-2 text-sm text-text-muted">
          Google, GitHub and magic link need the Supabase keys in the root <span className="font-mono">.env</span>.
          You can still try the app as a guest.
        </p>
      ) : null}
      {error ? <p className="mt-3 text-sm text-danger">{messageFor(error)}</p> : null}
      <form action={signInWithProvider.bind(null, "google")} className="mt-5">
        <Button type="submit" variant="outline" className="w-full" disabled={!configured}>
          Continue with Google
        </Button>
      </form>
      <form action={signInWithProvider.bind(null, "github")} className="mt-2">
        <Button type="submit" variant="outline" className="w-full" disabled={!configured}>
          Continue with GitHub
        </Button>
      </form>
      <div className="my-4 flex items-center gap-3 text-xs text-text-muted">
        <span className="h-px flex-1 bg-border" />
        or
        <span className="h-px flex-1 bg-border" />
      </div>
      <form action={sendMagicLink} className="space-y-3">
        <label className="block text-sm" htmlFor="email">
          Work email
          <Input
            id="email"
            name="email"
            type="email"
            required
            placeholder="asha@acme.com"
            className="mt-1"
            disabled={!configured}
          />
        </label>
        <Button type="submit" className="w-full" disabled={!configured}>
          Send magic link
        </Button>
      </form>
      <a href="/try" className="mt-4 block text-center text-sm text-accent">
        Try without an account
      </a>
    </Card>
  );
}

function messageFor(error: string) {
  if (error === "email") return "Enter a valid email address.";
  if (error === "config") return "Sign-in isn't configured yet.";
  return error;
}
