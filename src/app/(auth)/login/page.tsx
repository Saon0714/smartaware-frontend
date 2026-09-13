"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { FormBanner, Input, Label } from "@/components/ui/Field";
import { ApiError } from "@/lib/api/client";
import { useSession } from "@/lib/auth/SessionProvider";

function LoginForm() {
  const { signIn, status, user } = useSession();
  const router = useRouter();
  const params = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const destination = (role: string) => {
    const next = params.get("next");
    if (next?.startsWith("/")) return next;
    return role === "client" ? "/portal" : "/admin";
  };

  // Already signed in — skip the form.
  useEffect(() => {
    if (status === "authenticated" && user) {
      router.replace(user.must_change_password ? "/change-password" : destination(user.role));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, user]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const signedIn = await signIn(email, password);
      router.replace(
        signedIn.must_change_password ? "/change-password" : destination(signedIn.role),
      );
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.detail
          : "Could not sign in. Please check your connection and try again.",
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-lg border border-border bg-bg p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Sign in</h1>
      <p className="mt-2 text-sm text-muted">
        Access your SmartAWARE client portal.
      </p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        {error && <FormBanner tone="error">{error}</FormBanner>}

        <div>
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="password">Password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        <Button type="submit" loading={submitting} className="w-full">
          Sign in
        </Button>
      </form>

      <p className="mt-6 border-t border-border pt-6 text-sm text-muted">
        SmartAWARE accounts are created by invitation only. If you need access,
        please{" "}
        <Link href="/contact" className="text-primary underline underline-offset-4">
          contact us
        </Link>
        .
      </p>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="text-sm text-muted">Loading…</div>}>
      <LoginForm />
    </Suspense>
  );
}
