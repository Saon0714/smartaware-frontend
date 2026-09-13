"use client";

import { useState } from "react";

import { describeError, useAsync } from "@/components/admin/useAsync";
import { Button } from "@/components/ui/Button";
import { Badge, EmptyState, PageHeader } from "@/components/ui/Controls";
import { FormBanner, Input, Label } from "@/components/ui/Field";
import { createInvite, listInvites, resendInvite, revokeInvite } from "@/lib/api/admin";

/**
 * Invitations — spec Sections 5.1 and 6.2.
 *
 * There is no public sign-up, so this is the only route to a client account.
 * Status is derived server-side, which matters for expiry: nothing runs at the
 * moment a link lapses, so "expired" is computed on read rather than stored.
 */

function InviteStatusBadge({ status }: { status: string }) {
  if (status === "pending") return <Badge tone="success">Awaiting sign-up</Badge>;
  if (status === "used") return <Badge>Accepted</Badge>;
  if (status === "expired") return <Badge tone="warning">Expired</Badge>;
  return <Badge tone="danger">Revoked</Badge>;
}

export default function InvitesPage() {
  const invites = useAsync(listInvites, "invites");
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [lastLink, setLastLink] = useState<string | null>(null);

  const rows = invites.data ?? [];

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    invites.setError(null);
    try {
      await action();
      await invites.reload();
      return true;
    } catch (err) {
      invites.setError(describeError(err));
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Invitations"
        description="Client accounts are created by invitation only. There is no public sign-up."
      />

      {invites.error && (
        <div className="mt-4">
          <FormBanner tone="error">{invites.error}</FormBanner>
        </div>
      )}

      <form
        className="mt-6 sa-card rounded-lg border border-border bg-surface p-6"
        onSubmit={async (event) => {
          event.preventDefault();
          setLastLink(null);
          setBusy(true);
          invites.setError(null);
          try {
            const result = await createInvite({
              email,
              company_name: company || null,
            });
            setEmail("");
            setCompany("");
            setLastLink(result.invite_url ?? null);
            await invites.reload();
          } catch (err) {
            invites.setError(describeError(err));
          } finally {
            setBusy(false);
          }
        }}
      >
        <h2 className="font-medium">Invite a client</h2>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <div>
            <Label htmlFor="email">
              Email address<span className="text-danger"> *</span>
            </Label>
            <Input
              id="email"
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div>
            <Label htmlFor="company">Company name</Label>
            <Input
              id="company"
              value={company}
              onChange={(e) => setCompany(e.target.value)}
            />
            <p className="mt-1 text-xs text-muted">
              Pre-fills their profile. They can change it.
            </p>
          </div>
        </div>
        <Button type="submit" className="mt-4" loading={busy}>
          Send invitation
        </Button>
        <p className="mt-3 text-xs text-muted">
          The link can be used once and expires after the configured window.
          Sending a new invitation to the same address cancels any earlier one.
        </p>
      </form>

      {lastLink && (
        <div className="mt-4">
          <FormBanner tone="info">
            <span className="font-medium">Invitation created.</span> While email
            delivery is not configured, share this link directly — it is shown
            once and is not retrievable later:
            <code className="mt-2 block break-all rounded bg-bg px-2 py-1 text-xs">
              {lastLink}
            </code>
          </FormBanner>
        </div>
      )}

      {invites.loading && <p className="mt-6 text-sm text-muted">Loading…</p>}
      {!invites.loading && rows.length === 0 && (
        <div className="mt-6">
          <EmptyState>No invitations sent yet.</EmptyState>
        </div>
      )}

      {rows.length > 0 && (
        <ul className="mt-6 space-y-2">
          {rows.map((invite) => (
            <li
              key={invite.id}
              className="flex flex-wrap items-center justify-between gap-4 sa-card rounded-lg border border-border p-4"
            >
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{invite.email}</p>
                  <InviteStatusBadge status={invite.status} />
                  {invite.role !== "client" && <Badge tone="warning">{invite.role}</Badge>}
                </div>
                <p className="mt-1 text-xs text-muted">
                  {invite.prefill_company_name
                    ? `${invite.prefill_company_name} · `
                    : ""}
                  sent {new Date(invite.created_at).toLocaleDateString("en-GB")}
                  {invite.status === "pending"
                    ? ` · expires ${new Date(invite.expires_at).toLocaleDateString("en-GB")}`
                    : ""}
                  {invite.used_at
                    ? ` · accepted ${new Date(invite.used_at).toLocaleDateString("en-GB")}`
                    : ""}
                </p>
              </div>

              <div className="flex shrink-0 gap-2">
                {invite.status !== "used" && (
                  <>
                    <Button
                      variant="secondary"
                      disabled={busy}
                      onClick={async () => {
                        setBusy(true);
                        try {
                          const result = await resendInvite(invite.id);
                          setLastLink(result.invite_url ?? null);
                          await invites.reload();
                        } catch (err) {
                          invites.setError(describeError(err));
                        } finally {
                          setBusy(false);
                        }
                      }}
                    >
                      Resend
                    </Button>
                    {invite.status === "pending" && (
                      <Button
                        variant="secondary"
                        disabled={busy}
                        onClick={() => {
                          if (
                            window.confirm(
                              `Cancel the invitation to ${invite.email}? Their link will stop working.`,
                            )
                          ) {
                            void run(() => revokeInvite(invite.id));
                          }
                        }}
                      >
                        Cancel
                      </Button>
                    )}
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
