"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useState } from "react";

import { describeError, useAsync } from "@/components/admin/useAsync";
import { Button } from "@/components/ui/Button";
import { Badge, Checkbox, EmptyState, PageHeader, Select } from "@/components/ui/Controls";
import { FormBanner, Input, Label } from "@/components/ui/Field";
import {
  createInvite, listClientFilterOptions, listInvites, resendInvite, revokeInvite,
} from "@/lib/api/admin";

/**
 * Invitations — spec Sections 5.1 and 6.2.
 *
 * There is no public sign-up, so this is the only route to a client account.
 * Status is derived server-side, which matters for expiry: nothing runs at the
 * moment a link lapses, so "expired" is computed on read rather than stored.
 *
 * The services a client is engaged for are chosen here, before the account
 * exists. That is a commercial decision rather than a preference, so the
 * invitee is shown it and given no way to alter it — holding it on the
 * invitation is what makes that true, since nothing they submit at sign-up
 * reaches it.
 */

function InviteStatusBadge({ status }: { status: string }) {
  if (status === "pending") return <Badge tone="success">Awaiting sign-up</Badge>;
  if (status === "used") return <Badge>Accepted</Badge>;
  if (status === "expired") return <Badge tone="warning">Expired</Badge>;
  return <Badge tone="danger">Revoked</Badge>;
}

export default function InvitesPage() {
  // useSearchParams needs a boundary: this route is prerendered, and reading
  // the query string is what makes it wait for the request.
  return (
    <Suspense fallback={<p className="text-sm text-muted">Loading…</p>}>
      <Invitations />
    </Suspense>
  );
}

function Invitations() {
  const params = useSearchParams();
  const invites = useAsync(listInvites, "invites");
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState("");
  // Seeded from the link that brought us here. "Invite a manager" on the Team
  // page should not land on a form set to Client — the choice was already made
  // by the button that was pressed.
  const [role, setRole] = useState<"client" | "manager">(
    params.get("role") === "manager" ? "manager" : "client",
  );
  const [company, setCompany] = useState("");
  const [serviceIds, setServiceIds] = useState<string[]>([]);
  const [lastLink, setLastLink] = useState<string | null>(null);

  const options = useAsync(() => listClientFilterOptions(), "client-filters");
  // Archived services are withheld: an existing client may still be engaged for
  // one, but nobody new can be sold it — and the API refuses it anyway.
  const services = (options.data?.services ?? []).filter((s) => !s.is_archived);

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
        description="Client and staff accounts are both created by invitation only. There is no public sign-up."
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
            // Company and services belong to a client account. A manager has
            // neither, and the API refuses services on a staff invitation.
            const result = await createInvite(
              role === "manager"
                ? { email, role }
                : { email, role, company_name: company || null, service_ids: serviceIds },
            );
            setEmail("");
            setCompany("");
            setServiceIds([]);
            setLastLink(result.invite_url ?? null);
            await invites.reload();
          } catch (err) {
            invites.setError(describeError(err));
          } finally {
            setBusy(false);
          }
        }}
      >
        <h2 className="font-medium">Send an invitation</h2>
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
            <Label htmlFor="role">Account type</Label>
            <Select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as "client" | "manager")}
            >
              <option value="client">Client — portal access to their own account</option>
              <option value="manager">Manager — staff portal, for the clients you tag them to</option>
            </Select>
            <p className="mt-1 text-xs text-muted">
              {role === "manager"
                ? "A manager sees nothing until you tag them to clients on the Team page."
                : "A client sees only their own tasks, documents and invoices."}
            </p>
          </div>
        </div>

        {role === "client" && (
          <div className="mt-4 sm:w-1/2 sm:pr-2">
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
        )}

        <fieldset className={role === "manager" ? "hidden" : "mt-5"}>
          <legend className="text-sm font-medium">Services</legend>
          <p className="mt-1 text-xs text-muted">
            What this client is being signed up for. Applied to their account
            when they accept. They are shown it and cannot change it — adjust it
            here, or on their record afterwards.
          </p>
          {options.loading ? (
            <p className="mt-3 text-sm text-muted">Loading…</p>
          ) : (
            <div className="mt-3 grid gap-x-6 sm:grid-cols-2 lg:grid-cols-3">
              {services.map((service) => (
                <Checkbox
                  key={service.id}
                  id={`invite-service-${service.id}`}
                  label={service.name}
                  checked={serviceIds.includes(service.id)}
                  onChange={(event) =>
                    setServiceIds((current) =>
                      event.target.checked
                        ? [...current, service.id]
                        : current.filter((existing) => existing !== service.id),
                    )
                  }
                />
              ))}
            </div>
          )}
        </fieldset>

        <Button type="submit" className="mt-5" loading={busy}>
          {role === "manager" ? "Invite manager" : "Invite client"}
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
                  {invite.role !== "client" && (
                    <Badge tone="warning">
                      {invite.role === "manager" ? "Manager" : invite.role}
                    </Badge>
                  )}
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
                {(invite.services ?? []).length > 0 && (
                  <ul className="mt-2 flex flex-wrap gap-1.5">
                    {(invite.services ?? []).map((service) => (
                      <li
                        key={service.id}
                        className="rounded-full border border-primary/25 bg-primary/5 px-2 py-0.5 text-xs text-primary"
                      >
                        {service.name}
                      </li>
                    ))}
                  </ul>
                )}
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
