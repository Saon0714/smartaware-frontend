"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { FormBanner, Input, Label } from "@/components/ui/Field";
import { changePassword } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { homeForRole, loginPathForTarget } from "@/lib/auth/destinations";
import { useSession } from "@/lib/auth/SessionProvider";

const MIN_PASSWORD_LENGTH = 12;

/**
 * Changing a password revokes every session for that user, including this one.
 * That is deliberate — if the reason was a suspected compromise, leaving other
 * devices signed in would defeat the point — so this page signs the user out
 * and returns them to the login screen.
 */
export default function ChangePasswordPage() {
  const { user, status, signOut } = useSession();
  const router = useRouter();

  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (status === "loading") {
    return <p className="text-center text-sm text-muted">Loading…</p>;
  }

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (next.length < MIN_PASSWORD_LENGTH) {
      setError(`Please choose a password of at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (next !== confirm) {
      setError("The two passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      await changePassword(current, next);
      const login = loginPathForTarget(user ? homeForRole(user.role) : "/portal");
      await signOut();
      router.replace(`${login}?changed=1`);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.detail : "Could not change your password. Please try again.",
      );
      setSubmitting(false);
    }
  }

  return (
    <div className="sa-card rounded-lg border border-border bg-bg p-8">
      <h1 className="text-2xl font-semibold tracking-tight">
        {user?.must_change_password ? "Set your password" : "Change password"}
      </h1>
      {user?.must_change_password && (
        <p className="mt-2 text-sm text-muted">
          Your account was created with a temporary password. Please choose your
          own before continuing.
        </p>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        {error && <FormBanner tone="error">{error}</FormBanner>}

        <div>
          <Label htmlFor="current">Current password</Label>
          <Input
            id="current"
            type="password"
            autoComplete="current-password"
            required
            value={current}
            onChange={(e) => setCurrent(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="next">New password</Label>
          <Input
            id="next"
            type="password"
            autoComplete="new-password"
            required
            value={next}
            onChange={(e) => setNext(e.target.value)}
          />
          <p className="mt-2 text-xs text-muted">At least {MIN_PASSWORD_LENGTH} characters.</p>
        </div>

        <div>
          <Label htmlFor="confirm">Confirm new password</Label>
          <Input
            id="confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
        </div>

        <FormBanner tone="info">
          You will be signed out of all devices and asked to sign in again.
        </FormBanner>

        <Button type="submit" loading={submitting} className="w-full">
          Update password
        </Button>
      </form>
    </div>
  );
}
