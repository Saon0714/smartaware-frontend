"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { FormBanner, Input, Label } from "@/components/ui/Field";
import { ApiError } from "@/lib/api/client";
import {
  destinationFor, LOGIN_PATHS, type LoginAudience,
} from "@/lib/auth/destinations";
import { useSession } from "@/lib/auth/SessionProvider";

const COPY: Record<LoginAudience, { heading: string; blurb: string }> = {
  client: {
    heading: "Client sign in",
    blurb: "View your tasks, documents and invoices.",
  },
  admin: {
    heading: "Staff sign in",
    blurb: "For SmartAWARE administrators and managers.",
  },
};

function AudienceToggle({ active }: { active: LoginAudience }) {
  const params = useSearchParams();
  const next = params.get("next");
  const query = next ? `?next=${encodeURIComponent(next)}` : "";

  const tabs: readonly { key: LoginAudience; label: string }[] = [
    { key: "client", label: "Client" },
    { key: "admin", label: "SmartAWARE staff" },
  ];

  return (
    <div
      role="tablist"
      aria-label="Choose account type"
      className="grid grid-cols-2 gap-1 rounded-lg border border-border bg-surface p-1"
    >
      {tabs.map((tab) => {
        const selected = tab.key === active;
        return (
          <Link
            key={tab.key}
            href={`${LOGIN_PATHS[tab.key]}${query}`}
            role="tab"
            aria-selected={selected}
            className={`rounded-md px-3 py-2 text-center text-sm transition-colors ${
              selected
                ? "bg-bg font-medium text-primary shadow-sm"
                : "text-muted hover:text-text"
            }`}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}

export function LoginForm({ audience }: { audience: LoginAudience }) {
  const { signIn, status, user } = useSession();
  const router = useRouter();
  const params = useSearchParams();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const passwordChanged = params.get("changed") === "1";

  // Already signed in — go where this account belongs.
  useEffect(() => {
    if (status === "authenticated" && user) {
      router.replace(
        user.must_change_password
          ? "/change-password"
          : destinationFor(user.role, params.get("next")),
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, user]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const signedIn = await signIn(email, password);
      // Destination comes from the role the server returned, not from the tab
      // the visitor happened to be on.
      router.replace(
        signedIn.must_change_password
          ? "/change-password"
          : destinationFor(signedIn.role, params.get("next")),
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

  const copy = COPY[audience];

  return (
    <div className="rounded-lg border border-border bg-bg p-8">
      <AudienceToggle active={audience} />

      <h1 className="mt-6 text-2xl font-semibold tracking-tight">{copy.heading}</h1>
      <p className="mt-2 text-sm text-muted">{copy.blurb}</p>

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        {passwordChanged && (
          <FormBanner tone="info">
            Your password has been changed. Please sign in again.
          </FormBanner>
        )}
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

      {audience === "client" ? (
        <p className="mt-6 border-t border-border pt-6 text-sm text-muted">
          SmartAWARE accounts are created by invitation only. If you need
          access, please{" "}
          <Link href="/contact" className="text-primary underline underline-offset-4">
            contact us
          </Link>
          .
        </p>
      ) : (
        <p className="mt-6 border-t border-border pt-6 text-sm text-muted">
          Staff accounts are issued by a SmartAWARE administrator.
        </p>
      )}
    </div>
  );
}
