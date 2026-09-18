"use client";

import { useState } from "react";

import { describeError, useAsync } from "@/components/admin/useAsync";
import { UploadField } from "@/components/documents/UploadField";
import { Button } from "@/components/ui/Button";
import {
  Badge,
  EmptyState,
  PageHeader,
  Panel,
  Select,
  TableHead,
  TableShell,
} from "@/components/ui/Controls";
import { FormBanner, Input, Label } from "@/components/ui/Field";
import { downloadDocument } from "@/lib/api/documents";
import { listClients } from "@/lib/api/admin";
import {
  attachInvoiceDocument,
  cancelInvoice,
  createInvoice,
  formatMoney,
  listInvoices,
  markInvoicePaid,
  STATE_LABELS,
  STATE_TONES,
  type StaffInvoice,
} from "@/lib/api/invoices";
import { useSession } from "@/lib/auth/SessionProvider";

const CURRENCIES = ["GBP", "EUR", "USD", "INR", "AED", "OMR"] as const;

/**
 * Invoices — spec Sections 5.3.D and 12.
 *
 * Raising one and settling one are different jobs and different permissions.
 * Wise never tells us the money arrived, so "Mark as paid" is a person saying
 * they checked the account, and the screen says as much rather than presenting
 * it as a status toggle.
 */
export default function InvoicesPage() {
  const { can } = useSession();
  const [statusFilter, setStatusFilter] = useState("");
  const invoices = useAsync(() => listInvoices({ status: statusFilter || undefined }), statusFilter);
  const clients = useAsync(() => listClients(), "clients");
  const [adding, setAdding] = useState(false);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const rows = invoices.data ?? [];
  const mayManage = can("invoice:manage");
  const mayReconcile = can("invoice:reconcile");

  async function run(action: () => Promise<unknown>, message: string) {
    setBusy(true);
    invoices.setError(null);
    setNotice(null);
    try {
      await action();
      await invoices.reload();
      setNotice(message);
      return true;
    } catch (err) {
      invoices.setError(describeError(err));
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="What each client owes, and whether the money has arrived."
        actions={
          mayManage ? (
            <Button onClick={() => setAdding((v) => !v)} disabled={busy}>
              Raise an invoice
            </Button>
          ) : undefined
        }
      />

      {invoices.error && (
        <div className="mt-4">
          <FormBanner tone="error">{invoices.error}</FormBanner>
        </div>
      )}
      {notice && (
        <div className="mt-4">
          <FormBanner tone="info">{notice}</FormBanner>
        </div>
      )}

      {adding && mayManage && (
        <NewInvoiceForm
          clients={(clients.data ?? []).map((c) => ({
            id: c.id,
            name: c.company_name ?? c.owner_name ?? "Unnamed client",
          }))}
          busy={busy}
          onCancel={() => setAdding(false)}
          onCreate={async (body) => {
            const ok = await run(
              () => createInvoice(body),
              "Invoice raised. Attach the invoice file to share it with the client.",
            );
            if (ok) setAdding(false);
          }}
        />
      )}

      <div className="mt-6">
        <Panel>
          <Label htmlFor="status">Show</Label>
          <Select
            id="status"
            className="sm:w-60"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">All invoices</option>
            <option value="unpaid">Unpaid</option>
            <option value="paid">Paid</option>
            <option value="cancelled">Cancelled</option>
          </Select>
        </Panel>
      </div>

      {invoices.loading && <p className="mt-6 text-sm text-muted">Loading…</p>}

      {!invoices.loading && rows.length === 0 && (
        <div className="mt-6">
          <EmptyState>No invoices match this filter.</EmptyState>
        </div>
      )}

      {rows.length > 0 && (
        <div className="mt-6">
          <TableShell>
            <TableHead
              columns={["Invoice", "Client", "Amount", "Due", "Status", ""]}
            />
            <tbody>
              {rows.map((invoice) => (
                <InvoiceRow
                  key={invoice.id}
                  invoice={invoice}
                  busy={busy}
                  mayManage={mayManage}
                  mayReconcile={mayReconcile}
                  run={run}
                />
              ))}
            </tbody>
          </TableShell>
        </div>
      )}
    </div>
  );
}

function InvoiceRow({
  invoice,
  busy,
  mayManage,
  mayReconcile,
  run,
}: {
  invoice: StaffInvoice;
  busy: boolean;
  mayManage: boolean;
  mayReconcile: boolean;
  run: (action: () => Promise<unknown>, message: string) => Promise<boolean>;
}) {
  const [open, setOpen] = useState(false);
  const settled = invoice.state === "paid" || invoice.state === "cancelled";

  return (
    <>
      <tr className="border-b border-border last:border-0">
        <td className="px-4 py-3 align-top">
          <p className="font-medium">{invoice.invoice_reference}</p>
          <p className="mt-0.5 line-clamp-1 text-sm text-muted">{invoice.service_description}</p>
        </td>
        <td className="px-4 py-3 align-top text-sm">{invoice.client_name ?? "—"}</td>
        <td className="whitespace-nowrap px-4 py-3 align-top font-medium">
          {formatMoney(invoice.amount, invoice.currency)}
        </td>
        <td className="whitespace-nowrap px-4 py-3 align-top text-sm">
          <span className={invoice.state === "overdue" ? "text-danger" : ""}>
            {invoice.due_date ?? "—"}
          </span>
        </td>
        <td className="px-4 py-3 align-top">
          <Badge tone={STATE_TONES[invoice.state]}>{STATE_LABELS[invoice.state]}</Badge>
        </td>
        <td className="px-4 py-3 align-top text-right">
          <Button variant="secondary" onClick={() => setOpen((v) => !v)} disabled={busy}>
            {open ? "Hide" : "Details"}
          </Button>
        </td>
      </tr>

      {open && (
        <tr className="border-b border-border last:border-0">
          <td colSpan={6} className="bg-surface px-4 py-5">
            <div className="grid gap-6 lg:grid-cols-2">
              <div>
                <h3 className="text-sm font-medium">The invoice</h3>
                {invoice.document ? (
                  <p className="mt-2 text-sm">
                    Shared with the client:{" "}
                    <button
                      type="button"
                      onClick={() =>
                        void downloadDocument(
                          "admin",
                          invoice.document!.id,
                          invoice.document!.file_name,
                        )
                      }
                      className="sa-link text-primary"
                    >
                      {invoice.document.file_name}
                    </button>
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-muted">
                    No file attached yet. The client can see the figures; attaching
                    the invoice sends it to their portal and emails them.
                  </p>
                )}
                {mayManage && !settled && (
                  <div className="mt-3 max-w-sm">
                    <UploadField
                      busy={busy}
                      showDocType={false}
                      label={invoice.document ? "Replace the invoice" : "Attach the invoice"}
                      onUpload={async (file) => {
                        await run(
                          () => attachInvoiceDocument(invoice.id, file),
                          `“${file.name}” shared with the client.`,
                        );
                      }}
                    />
                  </div>
                )}
              </div>

              <div>
                <h3 className="text-sm font-medium">Payment</h3>
                {invoice.receipt ? (
                  <p className="mt-2 text-sm">
                    The client sent{" "}
                    <button
                      type="button"
                      onClick={() =>
                        void downloadDocument(
                          "admin",
                          invoice.receipt!.id,
                          invoice.receipt!.file_name,
                        )
                      }
                      className="sa-link text-primary"
                    >
                      {invoice.receipt.file_name}
                    </button>
                    .
                  </p>
                ) : (
                  <p className="mt-2 text-sm text-muted">No receipt from the client yet.</p>
                )}

                {invoice.state === "paid" ? (
                  <p className="mt-3 text-sm text-muted">
                    Marked paid by {invoice.reconciled_by ?? "a colleague"}
                    {invoice.external_payment_ref ? ` against ${invoice.external_payment_ref}` : ""}.
                  </p>
                ) : (
                  mayReconcile &&
                  invoice.state !== "cancelled" && (
                    <MarkPaidForm invoice={invoice} busy={busy} run={run} />
                  )
                )}

                {mayManage && !settled && (
                  <div className="mt-4">
                    <Button
                      variant="secondary"
                      disabled={busy}
                      onClick={() => {
                        if (
                          window.confirm(
                            `Cancel ${invoice.invoice_reference}? The client will see it as cancelled.`,
                          )
                        ) {
                          void run(
                            () => cancelInvoice(invoice.id),
                            `${invoice.invoice_reference} cancelled.`,
                          );
                        }
                      }}
                    >
                      Cancel invoice
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {invoice.notes && (
              <p className="mt-5 whitespace-pre-line border-t border-border pt-4 text-sm text-muted">
                {invoice.notes}
              </p>
            )}
          </td>
        </tr>
      )}
    </>
  );
}

function MarkPaidForm({
  invoice,
  busy,
  run,
}: {
  invoice: StaffInvoice;
  busy: boolean;
  run: (action: () => Promise<unknown>, message: string) => Promise<boolean>;
}) {
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");

  return (
    <form
      className="mt-4 space-y-3"
      onSubmit={(event) => {
        event.preventDefault();
        void run(
          () =>
            markInvoicePaid(invoice.id, {
              external_payment_ref: reference.trim() || null,
              note: note.trim() || null,
            }),
          `${invoice.invoice_reference} marked as paid.`,
        );
      }}
    >
      {/* Wise sends no confirmation, so this is a person's word. The reference
          is what makes it checkable afterwards. */}
      <p className="text-xs text-muted">
        Confirm this against the Wise account first — nothing here is told by Wise.
      </p>
      <div>
        <Label htmlFor={`ref-${invoice.id}`}>Wise transaction reference</Label>
        <Input
          id={`ref-${invoice.id}`}
          value={reference}
          placeholder="Optional, but makes this checkable later"
          onChange={(e) => setReference(e.target.value)}
        />
      </div>
      <div>
        <Label htmlFor={`note-${invoice.id}`}>Note</Label>
        <Input
          id={`note-${invoice.id}`}
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>
      <Button type="submit" disabled={busy}>
        Mark as paid
      </Button>
    </form>
  );
}

function NewInvoiceForm({
  clients,
  busy,
  onCancel,
  onCreate,
}: {
  clients: { id: string; name: string }[];
  busy: boolean;
  onCancel: () => void;
  onCreate: (body: {
    client_id: string;
    service_description: string;
    amount: string;
    currency: string;
    invoice_reference?: string | null;
    issued_at?: string | null;
    due_date?: string | null;
    notes?: string | null;
  }) => Promise<void>;
}) {
  const [draft, setDraft] = useState({
    client_id: "",
    service_description: "",
    amount: "",
    currency: "GBP",
    invoice_reference: "",
    due_date: "",
    notes: "",
  });

  return (
    <form
      className="sa-card mt-6 rounded-xl border border-border bg-bg p-6 shadow-[var(--sa-shadow-sm)]"
      onSubmit={(event) => {
        event.preventDefault();
        void onCreate({
          client_id: draft.client_id,
          service_description: draft.service_description.trim(),
          amount: draft.amount,
          currency: draft.currency,
          invoice_reference: draft.invoice_reference.trim() || null,
          due_date: draft.due_date || null,
          notes: draft.notes.trim() || null,
        });
      }}
    >
      <h2 className="font-medium">Raise an invoice</h2>
      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="client">
            Client<span className="text-danger"> *</span>
          </Label>
          <Select
            id="client"
            required
            value={draft.client_id}
            onChange={(e) => setDraft({ ...draft, client_id: e.target.value })}
          >
            <option value="">Choose one…</option>
            {clients.map((client) => (
              <option key={client.id} value={client.id}>
                {client.name}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="description">
            What this is for<span className="text-danger"> *</span>
          </Label>
          <Input
            id="description"
            required
            value={draft.service_description}
            onChange={(e) => setDraft({ ...draft, service_description: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="amount">
            Amount<span className="text-danger"> *</span>
          </Label>
          <Input
            id="amount"
            required
            type="number"
            min="0.01"
            step="0.01"
            value={draft.amount}
            onChange={(e) => setDraft({ ...draft, amount: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="currency">Currency</Label>
          <Select
            id="currency"
            value={draft.currency}
            onChange={(e) => setDraft({ ...draft, currency: e.target.value })}
          >
            {CURRENCIES.map((code) => (
              <option key={code} value={code}>
                {code}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="reference">Reference</Label>
          <Input
            id="reference"
            value={draft.invoice_reference}
            placeholder="Left blank, one is allocated"
            onChange={(e) => setDraft({ ...draft, invoice_reference: e.target.value })}
          />
          <p className="mt-1 text-xs text-muted">
            This travels with the payment into Wise, and is how it is matched back.
          </p>
        </div>
        <div>
          <Label htmlFor="due">Due date</Label>
          <Input
            id="due"
            type="date"
            value={draft.due_date}
            onChange={(e) => setDraft({ ...draft, due_date: e.target.value })}
          />
        </div>
      </div>

      <div className="mt-4">
        <Label htmlFor="notes">Internal note</Label>
        <Input
          id="notes"
          value={draft.notes}
          placeholder="Not shown to the client"
          onChange={(e) => setDraft({ ...draft, notes: e.target.value })}
        />
      </div>

      <div className="mt-5 flex gap-2">
        <Button type="submit" disabled={busy}>
          Raise invoice
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </form>
  );
}
