"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { describeError, useAsync } from "@/components/admin/useAsync";
import { Button } from "@/components/ui/Button";
import { Badge, Checkbox, EmptyState, PageHeader } from "@/components/ui/Controls";
import { FormBanner, Input, Label } from "@/components/ui/Field";
import {
  listClients, listStaff, setManagerClients, type ClientSummary, type StaffSummary,
} from "@/lib/api/admin";

/**
 * The team, and which clients each manager covers.
 *
 * Assignment already exists on each client's own page, one at a time. This is
 * the same relationship read the other way round — "who does this manager look
 * after?" — which is the question asked when someone joins, leaves, or picks up
 * a colleague's work, and answering it client by client is unreasonable.
 *
 * A client has exactly one manager, so tagging one here takes the client off
 * whoever held them. That is shown rather than hidden: the current manager is
 * named against every row.
 *
 * Admin only. Section 6.1 gives Managers no say in their own allocation, and
 * the API refuses them regardless of what this renders.
 */
export default function StaffPage() {
  const staff = useAsync(() => listStaff(true), "managers");
  const clients = useAsync(() => listClients(), "clients");

  const [selected, setSelected] = useState<string | null>(null);

  const managers = staff.data ?? [];
  // Memoised so the fallback does not produce a fresh array on every render,
  // which would defeat every memo below it.
  const allClients = useMemo(() => clients.data ?? [], [clients.data]);

  const countsByManager = useMemo(() => {
    const counts = new Map<string, number>();
    for (const client of allClients) {
      const id = client.assigned_manager?.id;
      if (id) counts.set(id, (counts.get(id) ?? 0) + 1);
    }
    return counts;
  }, [allClients]);

  const unassigned = allClients.filter((c) => !c.assigned_manager).length;
  const active = managers.find((m) => m.id === selected) ?? null;

  return (
    <div>
      <PageHeader
        title="Team"
        description="Managers, and the clients each of them covers."
        actions={
          <Link
            href="/admin/invites"
            className="inline-flex items-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-white hover:bg-primary-hover"
          >
            Invite a manager
          </Link>
        }
      />

      {(staff.error || clients.error) && (
        <div className="mt-4">
          <FormBanner tone="error">{staff.error ?? clients.error}</FormBanner>
        </div>
      )}

      {staff.loading && <p className="mt-6 text-sm text-muted">Loading…</p>}

      {!staff.loading && managers.length === 0 && (
        <div className="mt-6">
          <EmptyState>
            No managers yet. Staff accounts are created by invitation — use
            “Invite a manager” to add one.
          </EmptyState>
        </div>
      )}

      {managers.length > 0 && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[2fr_3fr]">
          <div>
            <ul className="space-y-2">
              {managers.map((manager) => {
                const count = countsByManager.get(manager.id) ?? 0;
                const chosen = manager.id === selected;
                return (
                  <li key={manager.id}>
                    <button
                      type="button"
                      onClick={() => setSelected(chosen ? null : manager.id)}
                      aria-pressed={chosen}
                      className={`sa-card w-full rounded-lg border p-4 text-left transition-colors ${
                        chosen
                          ? "border-primary bg-primary/5"
                          : "border-border hover:border-primary"
                      }`}
                    >
                      <p className="font-medium">{manager.full_name ?? manager.email}</p>
                      <p className="text-xs text-muted">{manager.email}</p>
                      <p className="mt-2 text-xs text-muted">
                        {count === 0
                          ? "No clients yet"
                          : `${count} client${count === 1 ? "" : "s"}`}
                      </p>
                    </button>
                  </li>
                );
              })}
            </ul>

            {unassigned > 0 && (
              <p className="mt-4 rounded-lg border border-dashed border-border p-4 text-xs text-muted">
                {unassigned} client{unassigned === 1 ? " has" : "s have"} no
                manager. Nobody is working {unassigned === 1 ? "it" : "them"}
                {" "}until someone is tagged.
              </p>
            )}
          </div>

          <div>
            {active ? (
              <PortfolioEditor
                key={active.id}
                manager={active}
                clients={allClients}
                onSaved={() => clients.reload()}
              />
            ) : (
              <EmptyState>
                Choose a manager to see and change the clients they cover.
              </EmptyState>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Which clients one manager covers.
 *
 * Ticks are local until Save, and the whole set is sent at once. Saving
 * per-click would mean a burst of individual reassignments — each one audited,
 * each one moving visibility — for what is a single decision.
 */
function PortfolioEditor({
  manager,
  clients,
  onSaved,
}: {
  manager: StaffSummary;
  clients: readonly ClientSummary[];
  onSaved: () => void | Promise<void>;
}) {
  const saved = useMemo(
    () => clients.filter((c) => c.assigned_manager?.id === manager.id).map((c) => c.id),
    [clients, manager.id],
  );

  const [draft, setDraft] = useState<string[]>(saved);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<string | null>(null);

  const dirty =
    draft.length !== saved.length || draft.some((id) => !saved.includes(id));

  // Taking a client from a colleague is a bigger decision than picking up an
  // unassigned one, so it is counted separately and said out loud.
  const takenFrom = clients.filter(
    (c) => draft.includes(c.id) && c.assigned_manager && c.assigned_manager.id !== manager.id,
  );
  const dropped = saved.filter((id) => !draft.includes(id));

  return (
    <form
      className="sa-card rounded-lg border border-border p-5"
      onSubmit={async (event) => {
        event.preventDefault();
        setBusy(true);
        setError(null);
        setDone(null);
        try {
          await setManagerClients(manager.id, draft, note);
          await onSaved();
          setNote("");
          setDone(`${manager.full_name ?? manager.email} now covers ${draft.length} client${draft.length === 1 ? "" : "s"}.`);
        } catch (err) {
          setError(describeError(err));
        } finally {
          setBusy(false);
        }
      }}
    >
      <h2 className="font-medium">{manager.full_name ?? manager.email}</h2>
      <p className="mt-1 text-xs text-muted">
        Tick the clients this manager should cover. They see only these — their
        tasks, documents, notes and invoices are scoped to them by the API.
      </p>

      {error && (
        <div className="mt-4">
          <FormBanner tone="error">{error}</FormBanner>
        </div>
      )}
      {done && !dirty && (
        <div className="mt-4">
          <FormBanner tone="info">{done}</FormBanner>
        </div>
      )}

      {clients.length === 0 ? (
        <p className="mt-4 text-sm text-muted">There are no client accounts yet.</p>
      ) : (
        <ul className="mt-4 max-h-96 space-y-1 overflow-y-auto pr-1">
          {clients.map((client) => {
            const held = client.assigned_manager;
            const elsewhere = held && held.id !== manager.id;
            return (
              <li key={client.id} className="rounded-md px-1 py-0.5 hover:bg-surface">
                <Checkbox
                  id={`portfolio-${client.id}`}
                  disabled={busy}
                  checked={draft.includes(client.id)}
                  onChange={(event) =>
                    setDraft((current) =>
                      event.target.checked
                        ? [...current, client.id]
                        : current.filter((existing) => existing !== client.id),
                    )
                  }
                  label={client.company_name ?? client.user_email}
                />
                {/* Only when there is something to say — a client already
                    this manager's needs no note beyond the tick. */}
                {(elsewhere || !held || client.status !== "active") && (
                  <p className="ml-6 flex items-center gap-2 text-xs text-muted">
                    {elsewhere && <span>Currently {held.full_name ?? held.email}</span>}
                    {!held && <span>Unassigned</span>}
                    {client.status !== "active" && (
                      <Badge tone={client.status === "hold" ? "warning" : "danger"}>
                        {client.status === "hold" ? "On hold" : "Deactivated"}
                      </Badge>
                    )}
                  </p>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {(takenFrom.length > 0 || dropped.length > 0) && (
        <ul className="mt-4 space-y-1 text-xs text-muted">
          {takenFrom.map((client) => (
            <li key={client.id}>
              {client.company_name ?? client.user_email} moves from{" "}
              {client.assigned_manager?.full_name ?? client.assigned_manager?.email}.
            </li>
          ))}
          {dropped.length > 0 && (
            <li>
              {dropped.length} client{dropped.length === 1 ? "" : "s"} will be left
              with no manager.
            </li>
          )}
        </ul>
      )}

      <div className="mt-4">
        <Label htmlFor="portfolio-note">Reason (optional)</Label>
        <Input
          id="portfolio-note"
          placeholder="Recorded against each account that changes hands."
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <div className="mt-4 flex items-center gap-3">
        <Button type="submit" loading={busy} disabled={!dirty}>
          Save assignments
        </Button>
        {dirty && !busy && <span className="text-xs text-muted">Unsaved changes</span>}
      </div>
    </form>
  );
}
