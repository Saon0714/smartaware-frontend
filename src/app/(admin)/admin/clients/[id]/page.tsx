"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState } from "react";

import { StatusBadge } from "@/components/admin/StatusBadge";
import { describeError, useAsync } from "@/components/admin/useAsync";
import { Button } from "@/components/ui/Button";
import { PageHeader, Select, Textarea } from "@/components/ui/Controls";
import { FormBanner, Label } from "@/components/ui/Field";
import { useSession } from "@/lib/auth/SessionProvider";
import {
  assignManager, getClient, listClientAudit, listStaff, setClientStatus,
} from "@/lib/api/admin";

/**
 * One client account.
 *
 * Status and manager assignment are Admin-only and the API enforces it, so a
 * Manager viewing this page sees the account but not those controls.
 */

const STATUS_HELP: Record<string, string> = {
  active: "Normal operations. The client can sign in and work proceeds as usual.",
  hold:
    "A pause, not a termination. The client cannot sign in, and no work may be recorded against the account until it is set back to active.",
  deactive:
    "The relationship has ended. Access is blocked exactly as with hold — the difference is what it records, so you can tell a paused client from a departed one.",
};

export default function ClientDetailPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const { user } = useSession();
  const isAdmin = user?.role === "admin";

  const client = useAsync(() => getClient(id), id);
  const staff = useAsync(() => listStaff(true), "staff");
  const audit = useAsync(() => listClientAudit(id), id);

  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [statusChoice, setStatusChoice] = useState("");
  const [statusNote, setStatusNote] = useState("");

  async function run(action: () => Promise<unknown>, message: string) {
    setBusy(true);
    client.setError(null);
    setNotice(null);
    try {
      await action();
      await Promise.all([client.reload(), audit.reload()]);
      setNotice(message);
      return true;
    } catch (err) {
      client.setError(describeError(err));
      return false;
    } finally {
      setBusy(false);
    }
  }

  if (client.loading) return <p className="text-sm text-muted">Loading…</p>;
  if (!client.data) {
    return (
      <div>
        {client.error && <FormBanner tone="error">{client.error}</FormBanner>}
        <p className="mt-4 text-sm text-muted">
          <Link href="/admin/clients" className="text-primary underline underline-offset-4">
            Back to clients
          </Link>
        </p>
      </div>
    );
  }

  const record = client.data;

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
        <Link href="/admin/clients" className="hover:text-primary">
          Clients
        </Link>
        <span aria-hidden> / </span>
        <span>{record.company_name ?? record.user_email}</span>
      </nav>

      <PageHeader
        title={record.company_name ?? record.user_email}
        description={`${record.client_ref} · ${record.user_email}`}
      />

      {client.error && (
        <div className="mt-4">
          <FormBanner tone="error">{client.error}</FormBanner>
        </div>
      )}
      {notice && (
        <div className="mt-4">
          <FormBanner tone="info">{notice}</FormBanner>
        </div>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-6">
          <section className="rounded-lg border border-border p-5">
            <h2 className="font-medium">Profile</h2>
            <dl className="mt-4 grid gap-x-6 gap-y-3 sm:grid-cols-2">
              {[
                ["Owner / Director", record.owner_name],
                ["Registration number", record.company_registration_number],
                ["Registration date", record.registration_date],
                ["Contact email", record.contact_email],
                ["Contact phone", record.contact_phone],
                ["Country", record.country],
                ["City", record.city],
                ["Postcode", record.postcode],
              ].map(([label, value]) => (
                <div key={String(label)}>
                  <dt className="text-xs text-muted">{label}</dt>
                  <dd className="mt-0.5 text-sm">{value || "—"}</dd>
                </div>
              ))}
            </dl>
            <p className="mt-4 text-xs text-muted">
              Onboarding:{" "}
              {record.onboarding_completed_at
                ? `completed ${new Date(record.onboarding_completed_at).toLocaleDateString("en-GB")}`
                : "not started"}
            </p>
          </section>

          <section className="rounded-lg border border-border p-5">
            <h2 className="font-medium">History</h2>
            <p className="mt-1 text-xs text-muted">
              Status changes and manager reassignments, with who made them.
            </p>
            {(audit.data ?? []).length === 0 ? (
              <p className="mt-4 text-sm text-muted">Nothing recorded yet.</p>
            ) : (
              <ul className="mt-4 space-y-3">
                {(audit.data ?? []).map((entry) => (
                  <li key={entry.id} className="border-l-2 border-border pl-3 text-sm">
                    <p className="font-medium">
                      {entry.action === "client.status_changed"
                        ? `Status: ${entry.old_value?.status} → ${entry.new_value?.status}`
                        : `Manager: ${entry.old_value?.manager_email ?? "unassigned"} → ${entry.new_value?.manager_email ?? "unassigned"}`}
                    </p>
                    {entry.reason && (
                      <p className="mt-0.5 text-muted">{entry.reason}</p>
                    )}
                    <p className="mt-0.5 text-xs text-muted">
                      {entry.actor_email ?? "system"} ·{" "}
                      {new Date(entry.created_at).toLocaleString("en-GB")}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>

        <div className="space-y-6">
          <section className="rounded-lg border border-border p-5">
            <div className="flex items-center justify-between gap-3">
              <h2 className="font-medium">Account status</h2>
              <StatusBadge status={record.status} />
            </div>
            {record.status_note && (
              <p className="mt-2 text-sm text-muted">{record.status_note}</p>
            )}

            {isAdmin ? (
              <form
                className="mt-4 space-y-3"
                onSubmit={async (event) => {
                  event.preventDefault();
                  const ok = await run(
                    () => setClientStatus(id, statusChoice, statusNote),
                    "Account status updated.",
                  );
                  if (ok) {
                    setStatusChoice("");
                    setStatusNote("");
                  }
                }}
              >
                <div>
                  <Label htmlFor="status">Change status to</Label>
                  <Select
                    id="status"
                    required
                    value={statusChoice}
                    onChange={(e) => setStatusChoice(e.target.value)}
                  >
                    <option value="">Choose…</option>
                    {["active", "hold", "deactive"]
                      .filter((s) => s !== record.status)
                      .map((s) => (
                        <option key={s} value={s}>
                          {s === "deactive" ? "Deactivated" : s === "hold" ? "On hold" : "Active"}
                        </option>
                      ))}
                  </Select>
                  {statusChoice && (
                    <p className="mt-2 text-xs text-muted">{STATUS_HELP[statusChoice]}</p>
                  )}
                </div>
                <div>
                  <Label htmlFor="note">Reason</Label>
                  <Textarea
                    id="note"
                    required
                    minLength={3}
                    placeholder="Why is this changing? Recorded against the account."
                    value={statusNote}
                    onChange={(e) => setStatusNote(e.target.value)}
                  />
                </div>
                <Button type="submit" loading={busy} disabled={!statusChoice}>
                  Update status
                </Button>
                {(statusChoice === "hold" || statusChoice === "deactive") && (
                  <p className="text-xs text-muted">
                    This signs the client out immediately and prevents them
                    signing back in.
                  </p>
                )}
              </form>
            ) : (
              <p className="mt-3 text-xs text-muted">
                Only an administrator can change account status.
              </p>
            )}
          </section>

          <section className="rounded-lg border border-border p-5">
            <h2 className="font-medium">Assigned manager</h2>
            <p className="mt-2 text-sm">
              {record.assigned_manager
                ? (record.assigned_manager.full_name ?? record.assigned_manager.email)
                : "Unassigned"}
            </p>

            {isAdmin ? (
              <div className="mt-4">
                <Label htmlFor="manager">Reassign to</Label>
                <Select
                  id="manager"
                  disabled={busy}
                  value={record.assigned_manager?.id ?? ""}
                  onChange={(e) =>
                    void run(
                      () => assignManager(id, e.target.value || null),
                      "Manager updated.",
                    )
                  }
                >
                  <option value="">Unassigned</option>
                  {(staff.data ?? []).map((member) => (
                    <option key={member.id} value={member.id}>
                      {member.full_name ?? member.email}
                    </option>
                  ))}
                </Select>
                <p className="mt-2 text-xs text-muted">
                  Reassigning changes who can see this client&apos;s records. The
                  change is recorded in the history.
                </p>
              </div>
            ) : (
              <p className="mt-3 text-xs text-muted">
                Only an administrator can change the assigned manager.
              </p>
            )}
          </section>
        </div>
      </div>
    </div>
  );
}
