"use client";

import { useState } from "react";

import { describeError, useAsync } from "@/components/admin/useAsync";
import { UploadField } from "@/components/documents/UploadField";
import { Button } from "@/components/ui/Button";
import { Badge, EmptyState, PageHeader } from "@/components/ui/Controls";
import { FormBanner } from "@/components/ui/Field";
import { downloadDocument, formatBytes } from "@/lib/api/documents";
import {
  formatMoney,
  listMyInvoices,
  payInvoice,
  STATE_LABELS,
  STATE_TONES,
  uploadReceipt,
  type ClientInvoice,
} from "@/lib/api/invoices";

/**
 * A client's invoices — spec Sections 5.3.D and 12.
 *
 * The payment is a redirect to Wise, and Wise tells us nothing afterwards, so
 * this page is honest about the gap rather than papering over it: paying opens
 * Wise in a new tab, and the invoice only leaves "unpaid" once somebody at
 * SmartAWARE has checked the account. Sending the receipt back is what starts
 * that, which is why the upload sits on the invoice rather than being another
 * file in Documents.
 */
export default function MyInvoicesPage() {
  const invoices = useAsync(listMyInvoices, "invoices");
  const [notice, setNotice] = useState<string | null>(null);

  const all = invoices.data ?? [];
  const settled = all.filter((i) => i.state === "paid" || i.state === "cancelled");
  const outstanding = all.filter((i) => !settled.includes(i));

  return (
    <div>
      <PageHeader
        title="Invoices"
        description="What SmartAWARE has invoiced you for, and how to pay it."
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

      {invoices.loading && <p className="mt-6 text-sm text-muted">Loading…</p>}

      {!invoices.loading && all.length === 0 && (
        <div className="mt-6">
          <EmptyState>
            No invoices yet. Anything SmartAWARE invoices you for will appear here.
          </EmptyState>
        </div>
      )}

      {outstanding.length > 0 && (
        <section className="mt-8">
          <h2 className="text-lg font-semibold tracking-tight">To pay</h2>
          <span aria-hidden className="sa-accent-bar mt-2" />
          <ul className="mt-5 space-y-4">
            {outstanding.map((invoice) => (
              <li key={invoice.id}>
                <InvoiceCard
                  invoice={invoice}
                  onDone={async (message) => {
                    setNotice(message);
                    await invoices.reload();
                  }}
                  onError={(message) => invoices.setError(message)}
                />
              </li>
            ))}
          </ul>
        </section>
      )}

      {settled.length > 0 && (
        <section className="mt-10">
          <h2 className="text-lg font-semibold tracking-tight">Settled</h2>
          <span aria-hidden className="sa-accent-bar mt-2" />
          <ul className="mt-5 space-y-4">
            {settled.map((invoice) => (
              <li key={invoice.id}>
                <InvoiceCard
                  invoice={invoice}
                  onDone={async () => {}}
                  onError={() => {}}
                />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function InvoiceCard({
  invoice,
  onDone,
  onError,
}: {
  invoice: ClientInvoice;
  onDone: (message: string) => Promise<void>;
  onError: (message: string) => void;
}) {
  const [busy, setBusy] = useState(false);
  const settled = invoice.state === "paid" || invoice.state === "cancelled";
  const file = invoice.document;
  const receipt = invoice.receipt;

  async function pay() {
    setBusy(true);
    try {
      const link = await payInvoice(invoice.id);
      // A new tab, so the portal stays open behind it — the next thing they
      // need to do is come back here and send the receipt.
      window.open(link.pay_url, "_blank", "noopener,noreferrer");
      await onDone(
        `Wise has opened in a new tab for ${formatMoney(link.amount, link.currency)}. ` +
          "When you have paid, send us the receipt below.",
      );
    } catch (err) {
      onError(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  async function sendReceipt(chosen: File) {
    setBusy(true);
    try {
      await uploadReceipt(invoice.id, chosen);
      await onDone(
        `“${chosen.name}” sent. SmartAWARE will confirm the payment against their account.`,
      );
    } catch (err) {
      onError(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <article className="sa-card rounded-xl border border-border bg-bg p-5 shadow-[var(--sa-shadow-sm)]">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-medium">{invoice.invoice_reference}</h3>
            <Badge tone={STATE_TONES[invoice.state]}>{STATE_LABELS[invoice.state]}</Badge>
          </div>
          <p className="mt-1 text-sm text-muted">{invoice.service_description}</p>
          <dl className="mt-3 flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted">
            {invoice.issued_at && (
              <div className="flex gap-1.5">
                <dt>Issued</dt>
                <dd className="text-text">{invoice.issued_at}</dd>
              </div>
            )}
            {invoice.due_date && (
              <div className="flex gap-1.5">
                <dt>Due</dt>
                <dd className={invoice.state === "overdue" ? "text-danger" : "text-text"}>
                  {invoice.due_date}
                </dd>
              </div>
            )}
          </dl>
        </div>

        <p className="text-2xl font-semibold tracking-tight">
          {formatMoney(invoice.amount, invoice.currency)}
        </p>
      </div>

      {file && (
        <p className="mt-4 flex flex-wrap items-center gap-2 text-sm">
          <button
            type="button"
            onClick={() => void downloadDocument("portal", file.id, file.file_name)}
            className="sa-link text-primary"
          >
            Download {file.file_name}
          </button>
          {file.size_bytes != null && (
            <span className="text-xs text-muted">{formatBytes(file.size_bytes)}</span>
          )}
        </p>
      )}

      {!settled && (
        <div className="mt-5 border-t border-border pt-5">
          {receipt ? (
            // Their receipt is in, so this invoice is waiting on us. A Pay
            // button here would sit under "we have your receipt" and invite a
            // second payment for the same invoice — the one mistake the
            // redirect makes impossible to undo from our side.
            <>
              <h4 className="text-sm font-medium">Your receipt</h4>
              <p className="mt-1 text-sm text-muted">
                We have{" "}
                <button
                  type="button"
                  onClick={() => void downloadDocument("portal", receipt.id, receipt.file_name)}
                  className="sa-link text-primary"
                >
                  {receipt.file_name}
                </button>
                . SmartAWARE will check it against their account and mark this
                invoice as paid.
              </p>
              {invoice.pay_url && (
                <p className="mt-4 text-sm text-muted">
                  If that payment did not go through,{" "}
                  <button
                    type="button"
                    onClick={() => void pay()}
                    disabled={busy}
                    className="sa-link text-primary disabled:opacity-60"
                  >
                    pay it again with Wise
                  </button>
                  .
                </p>
              )}
            </>
          ) : (
            <>
              {invoice.pay_url ? (
                <Button onClick={() => void pay()} disabled={busy}>
                  Pay {formatMoney(invoice.amount, invoice.currency)} with Wise
                </Button>
              ) : (
                // Said plainly. They cannot fix a link SmartAWARE has not
                // supplied, so a dead button would only waste their time.
                <p className="text-sm text-muted">
                  Online payment is not available yet. Please contact SmartAWARE
                  and the team will arrange payment with you.
                </p>
              )}

              <div className="mt-5">
                <h4 className="text-sm font-medium">Send us your receipt</h4>
                <p className="mt-1 text-sm text-muted">
                  Once you have paid, download the confirmation from Wise and send
                  it here. It goes to your manager and to SmartAWARE.
                </p>
                <div className="mt-3">
                  <UploadField
                    busy={busy}
                    showDocType={false}
                    label="Choose your receipt"
                    onUpload={(chosen) => sendReceipt(chosen)}
                  />
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </article>
  );
}
