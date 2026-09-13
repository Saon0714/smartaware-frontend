"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/Button";
import { FieldError, FormBanner, Input, Label } from "@/components/ui/Field";
import { acceptInvite, checkInvite, type InviteCheckOut } from "@/lib/api/auth";
import { ApiError } from "@/lib/api/client";
import { useSession } from "@/lib/auth/SessionProvider";

const MIN_PASSWORD_LENGTH = 12;

type State =
  | { kind: "checking" }
  | { kind: "valid"; invite: InviteCheckOut }
  | { kind: "invalid"; message: string };

export default function AcceptInvitePage() {
  const params = useParams<{ token: string }>();
  const token = params.token;
  const router = useRouter();
  const { adoptSession } = useSession();

  const [state, setState] = useState<State>({ kind: "checking" });
  const [fullName, setFullName] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  // Validate the link before showing a form, so an expired or already-used
  // invite gives a clear explanation rather than failing at submit.
  useEffect(() => {
    let cancelled = false;
    checkInvite(token)
      .then((invite) => {
        if (!cancelled) setState({ kind: "valid", invite });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setState({
          kind: "invalid",
          message:
            err instanceof ApiError
              ? err.detail
              : "This invitation link could not be checked. Please try again.",
        });
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);

    if (password.length < MIN_PASSWORD_LENGTH) {
      setError(`Please choose a password of at least ${MIN_PASSWORD_LENGTH} characters.`);
      return;
    }
    if (password !== confirm) {
      setError("The two passwords do not match.");
      return;
    }

    setSubmitting(true);
    try {
      const session = await acceptInvite(token, password, fullName || undefined);
      adoptSession(session.access_token, session.user);
      router.replace(session.user.role === "client" ? "/portal" : "/admin");
    } catch (err) {
      setError(
        err instanceof ApiError ? err.detail : "Could not create your account. Please try again.",
      );
      setSubmitting(false);
    }
  }

  if (state.kind === "checking") {
    return <p className="text-center text-sm text-muted">Checking your invitation…</p>;
  }

  if (state.kind === "invalid") {
    return (
      <div className="sa-card rounded-lg border border-border bg-bg p-8">
        <h1 className="text-xl font-semibold tracking-tight">Invitation unavailable</h1>
        <p className="mt-3 text-sm text-muted">{state.message}</p>
        <div className="mt-6 flex gap-3">
          <Link
            href="/login/client"
            className="rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-surface"
          >
            Sign in
          </Link>
          <Link
            href="/contact"
            className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Contact SmartAWARE
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="sa-card rounded-lg border border-border bg-bg p-8">
      <h1 className="text-2xl font-semibold tracking-tight">Create your account</h1>
      <p className="mt-2 text-sm text-muted">
        {state.invite.role === "client"
          ? "Setting up the Client Portal for "
          : "Setting up your SmartAWARE staff account for "}
        <strong className="text-text">{state.invite.email}</strong>
        {state.invite.company_name ? ` (${state.invite.company_name})` : ""}.
      </p>

      {/* A new manager arrives knowing nothing about how the portal works.
          Saying it here saves them signing in to an empty screen and
          wondering whether something is broken. */}
      {state.invite.role === "manager" && (
        <p className="mt-3 rounded-lg border border-border bg-surface p-4 text-sm text-muted">
          You will see the clients SmartAWARE tags you to, along with their
          tasks, documents and notes. If the portal looks empty when you first
          sign in, an administrator has not assigned you any clients yet.
        </p>
      )}

      {/* Shown, not offered. What the account covers was agreed with
          SmartAWARE before the invitation was sent, so there is no control
          here — and nothing this form submits could change it. */}
      {(state.invite.services ?? []).length > 0 && (
        <div className="mt-5 rounded-lg border border-border bg-surface p-4">
          <p className="text-sm font-medium">Your account will be set up for</p>
          <ul className="mt-2 flex flex-wrap gap-1.5">
            {(state.invite.services ?? []).map((service) => (
              <li
                key={service.id}
                className="rounded-full border border-primary/25 bg-primary/5 px-2.5 py-1 text-xs text-primary"
              >
                {service.name}
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs text-muted">
            Need something else? Speak to SmartAWARE and they will update it.
          </p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-6 space-y-4" noValidate>
        {error && <FormBanner tone="error">{error}</FormBanner>}

        <div>
          <Label htmlFor="full_name">Your name</Label>
          <Input
            id="full_name"
            name="full_name"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>

        <div>
          <Label htmlFor="password">Choose a password</Label>
          <Input
            id="password"
            name="password"
            type="password"
            autoComplete="new-password"
            required
            aria-describedby="password-help"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <p id="password-help" className="mt-2 text-xs text-muted">
            At least {MIN_PASSWORD_LENGTH} characters. A short phrase you will
            remember is stronger than a short complicated word.
          </p>
        </div>

        <div>
          <Label htmlFor="confirm">Confirm password</Label>
          <Input
            id="confirm"
            name="confirm"
            type="password"
            autoComplete="new-password"
            required
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
          />
          <FieldError id="confirm-error">
            {confirm && password !== confirm ? "Passwords do not match." : null}
          </FieldError>
        </div>

        <Button type="submit" loading={submitting} className="w-full">
          Create account
        </Button>
      </form>
    </div>
  );
}
