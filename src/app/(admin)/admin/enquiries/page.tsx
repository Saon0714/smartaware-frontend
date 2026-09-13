"use client";

import Link from "next/link";
import { useState } from "react";

import { describeError, useAsync } from "@/components/admin/useAsync";
import { Button } from "@/components/ui/Button";
import { Badge, EmptyState, PageHeader, Textarea } from "@/components/ui/Controls";
import { FormBanner } from "@/components/ui/Field";
import { listEnquiries, updateEnquiry, type Enquiry } from "@/lib/api/admin";

/**
 * Website enquiries.
 *
 * The payload is rendered generically rather than field by field: the form's
 * fields are editable, so hardcoding them here would break the moment someone
 * added one — and older enquiries would lose the answers they do hold.
 */
export default function EnquiriesPage() {
  const [filter, setFilter] = useState<"all" | "open" | "handled">("open");
  const { data, error, loading, reload, setError } = useAsync(
    () => listEnquiries(filter === "all" ? undefined : filter === "handled"),
    filter,
  );
  const [busy, setBusy] = useState(false);

  const enquiries = data ?? [];

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await reload();
    } catch (err) {
      setError(describeError(err));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        title="Enquiries"
        description="Submissions from the website contact form."
        actions={
          <div className="flex gap-1 rounded-md border border-border p-1">
            {(["open", "handled", "all"] as const).map((key) => (
              <button
                key={key}
                type="button"
                onClick={() => setFilter(key)}
                className={`rounded px-3 py-1.5 text-sm capitalize transition-colors ${
                  filter === key ? "bg-surface font-medium text-primary" : "text-muted"
                }`}
              >
                {key}
              </button>
            ))}
          </div>
        }
      />

      {error && (
        <div className="mt-4">
          <FormBanner tone="error">{error}</FormBanner>
        </div>
      )}
      {loading && <p className="mt-6 text-sm text-muted">Loading…</p>}

      {!loading && enquiries.length === 0 && (
        <div className="mt-6">
          <EmptyState>
            {filter === "open"
              ? "No open enquiries."
              : "No enquiries match this filter."}
          </EmptyState>
        </div>
      )}

      <ul className="mt-6 space-y-3">
        {enquiries.map((enquiry) => (
          <EnquiryCard
            key={enquiry.id}
            enquiry={enquiry}
            busy={busy}
            onUpdate={(body) => run(() => updateEnquiry(enquiry.id, body))}
          />
        ))}
      </ul>

      <p className="mt-8 rounded-lg border border-dashed border-border p-4 text-sm text-muted">
        Email alerts go to the addresses in{" "}
        <Link href="/admin/settings" className="text-primary underline underline-offset-4">
          notification settings
        </Link>
        . While that list is empty, enquiries are still recorded here but no
        email is sent.
      </p>
    </div>
  );
}

function EnquiryCard({
  enquiry,
  busy,
  onUpdate,
}: {
  enquiry: Enquiry;
  busy: boolean;
  onUpdate: (body: Record<string, unknown>) => void;
}) {
  const [note, setNote] = useState(enquiry.internal_note ?? "");
  const [open, setOpen] = useState(false);

  const received = new Date(enquiry.created_at).toLocaleString("en-GB");

  return (
    <li className="rounded-lg border border-border p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium">{enquiry.name ?? "Unnamed enquiry"}</p>
            <Badge tone={enquiry.is_handled ? "success" : "warning"}>
              {enquiry.is_handled ? "Handled" : "Open"}
            </Badge>
            {enquiry.service_required && <Badge>{enquiry.service_required}</Badge>}
          </div>
          <p className="mt-1 text-sm text-muted">
            {enquiry.email}
            {enquiry.company_name ? ` · ${enquiry.company_name}` : ""}
            {enquiry.country ? ` · ${enquiry.country}` : ""}
          </p>
          <p className="mt-1 text-xs text-muted">{received}</p>
        </div>

        <div className="flex shrink-0 gap-2">
          <Button variant="secondary" onClick={() => setOpen((v) => !v)}>
            {open ? "Hide" : "Details"}
          </Button>
          <Button
            disabled={busy}
            onClick={() => onUpdate({ is_handled: !enquiry.is_handled })}
          >
            {enquiry.is_handled ? "Reopen" : "Mark handled"}
          </Button>
        </div>
      </div>

      {open && (
        <div className="mt-4 border-t border-border pt-4">
          <dl className="grid gap-x-6 gap-y-2 sm:grid-cols-[auto_1fr]">
            {Object.entries(enquiry.payload).map(([key, value]) => (
              <div key={key} className="contents">
                <dt className="text-sm text-muted">{key.replace(/_/g, " ")}</dt>
                <dd className="text-sm">
                  {Array.isArray(value) ? value.join(", ") : String(value)}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-4">
            <Textarea
              aria-label="Internal note"
              placeholder="Internal note (not visible to the enquirer)"
              value={note}
              onChange={(e) => setNote(e.target.value)}
            />
            <Button
              className="mt-2"
              variant="secondary"
              disabled={busy}
              onClick={() => onUpdate({ internal_note: note || null })}
            >
              Save note
            </Button>
          </div>
        </div>
      )}
    </li>
  );
}
