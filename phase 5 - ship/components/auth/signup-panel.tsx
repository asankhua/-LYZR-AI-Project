import { signUpDemo } from "@/lib/auth/signup";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export function SignupPanel({
  next,
  error,
  defaultName,
}: {
  next: string;
  error?: string;
  defaultName?: string;
}) {
  return (
    <Card className="w-full max-w-[400px] p-6">
      <h1 className="text-xl font-medium">Create your account</h1>
      <p className="mt-1 text-sm text-text-muted">Your projects stay with this account. Use the same email to come back to Home.</p>
      {error ? <p className="mt-3 text-sm text-danger">{error === "name" ? "Enter your name." : "Enter a valid email address."}</p> : null}
      <form action={signUpDemo} className="mt-5 space-y-3">
        <input type="hidden" name="next" value={next} />
        <label className="block text-sm" htmlFor="name">
          Name
          <Input id="name" name="name" required maxLength={80} defaultValue={defaultName} className="mt-1" />
        </label>
        <label className="block text-sm" htmlFor="email">
          Email
          <Input id="email" name="email" type="email" required autoComplete="email" placeholder="asha@acme.com" className="mt-1" />
        </label>
        <Button type="submit" className="w-full">
          Create account
        </Button>
      </form>
      <a href="/try" className="mt-4 block text-center text-sm text-accent">
        Try without an account
      </a>
    </Card>
  );
}
