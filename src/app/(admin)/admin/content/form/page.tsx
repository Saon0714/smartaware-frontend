"use client";

import Link from "next/link";
import { useState } from "react";

import { describeError, useAsync } from "@/components/admin/useAsync";
import { Button } from "@/components/ui/Button";
import { Badge, Checkbox, PageHeader, Select } from "@/components/ui/Controls";
import { FormBanner, Input, Label } from "@/components/ui/Field";
import {
  createFormField, deactivateFormField, getAdminForm, updateFormField,
} from "@/lib/api/admin";

/**
 * Enquiry form fields.
 *
 * Section 13 leaves the final field list unconfirmed, so it is data rather than
 * code. Changes here take effect on the public form immediately, and the server
 * validates submissions against this same definition.
 */

/** What each answer looks like on the form, named as an editor would name it. */
const FIELD_TYPES: readonly { value: string; label: string }[] = [
  { value: "text", label: "Short text" },
  { value: "textarea", label: "Long text" },
  { value: "email", label: "Email address" },
  { value: "phone", label: "Phone number" },
  { value: "number", label: "Number" },
  { value: "date", label: "Date" },
  { value: "select", label: "Dropdown, one answer" },
  { value: "multiselect", label: "Dropdown, several answers" },
  { value: "checkbox", label: "Tick box" },
  { value: "radio", label: "Buttons, one answer" },
  { value: "country", label: "Country" },
];

function typeLabel(value: string): string {
  return FIELD_TYPES.find((t) => t.value === value)?.label ?? value;
}

/**
 * The name a submission is filed under, derived from the label.
 *
 * It has to be a lower-case identifier because it is a key in every stored
 * answer, but that is a storage detail — asking whoever writes the question to
 * also invent an identifier for it only invites a typo in something that can
 * never be changed afterwards.
 */
export function keyForLabel(label: string, taken: readonly string[]): string {
  const base =
    label
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "_")
      .replace(/^_+|_+$/g, "")
      .slice(0, 56) || "field";
  const stem = /^[a-z]/.test(base) ? base : `field_${base}`;
  if (!taken.includes(stem)) return stem;
  for (let n = 2; ; n += 1) {
    const candidate = `${stem}_${n}`;
    if (!taken.includes(candidate)) return candidate;
  }
}

export default function EnquiryFormFieldsPage() {
  const form = useAsync(() => getAdminForm("enquiry"), "enquiry");
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({
    label: "", field_type: "text", is_required: false,
  });

  const fields = form.data?.fields ?? [];

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    form.setError(null);
    try {
      await action();
      await form.reload();
      return true;
    } catch (err) {
      form.setError(describeError(err));
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted">
        <Link href="/admin/content" className="hover:text-primary">
          Website Content
        </Link>
        <span aria-hidden> / </span>
        <span>Enquiry Form</span>
      </nav>

      <PageHeader
        title="Enquiry Form"
        description="The fields shown on the website contact form. Changes appear immediately."
        actions={
          <Button onClick={() => setAdding((v) => !v)} disabled={busy}>
            Add field
          </Button>
        }
      />

      {form.error && (
        <div className="mt-4">
          <FormBanner tone="error">{form.error}</FormBanner>
        </div>
      )}

      {adding && (
        <form
          onSubmit={async (event) => {
            event.preventDefault();
            const ok = await run(() =>
              createFormField("enquiry", {
                ...draft,
                key: keyForLabel(draft.label, fields.map((f) => f.key)),
                sort_order: fields.length + 1,
              }),
            );
            if (ok) {
              setDraft({ label: "", field_type: "text", is_required: false });
              setAdding(false);
            }
          }}
          className="sa-card mt-6 rounded-xl border border-border bg-bg p-6 shadow-[var(--sa-shadow-sm)]"
        >
          <h2 className="font-medium">Add a field</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div>
              <Label htmlFor="label">
                Label<span className="text-danger"> *</span>
              </Label>
              <Input
                id="label"
                required
                value={draft.label}
                onChange={(e) => setDraft({ ...draft, label: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="field_type">Type</Label>
              <Select
                id="field_type"
                value={draft.field_type}
                onChange={(e) => setDraft({ ...draft, field_type: e.target.value })}
              >
                {FIELD_TYPES.map((type) => (
                  <option key={type.value} value={type.value}>
                    {type.label}
                  </option>
                ))}
              </Select>
            </div>
            <div className="flex items-end">
              <Checkbox
                label="Required"
                checked={draft.is_required}
                onChange={(e) => setDraft({ ...draft, is_required: e.target.checked })}
              />
            </div>
          </div>
          <div className="mt-6 flex gap-2">
            <Button type="submit" loading={busy}>
              Add field
            </Button>
            <Button type="button" variant="secondary" onClick={() => setAdding(false)}>
              Cancel
            </Button>
          </div>
        </form>
      )}

      {form.loading && <p className="mt-6 text-sm text-muted">Loading…</p>}

      <ul className="mt-6 space-y-2">
        {fields.map((field) => (
          <li
            key={field.id}
            className="sa-card flex flex-wrap items-center justify-between gap-4 rounded-xl border border-border bg-bg p-4 shadow-[var(--sa-shadow-sm)]"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{field.label}</p>
                <Badge>{typeLabel(field.field_type)}</Badge>
                {field.is_required && <Badge tone="warning">Required</Badge>}
              </div>
              {field.options && field.options.length > 0 && (
                <p className="mt-1 text-xs text-muted">
                  {field.options.length} options
                  {field.key === "service_required" ? " (from the service list)" : ""}
                </p>
              )}
            </div>

            <div className="flex items-center gap-3">
              <Checkbox
                label="Required"
                checked={field.is_required}
                disabled={busy}
                onChange={(e) =>
                  void run(() =>
                    updateFormField(field.id, { is_required: e.target.checked }),
                  )
                }
              />
              <Button
                variant="secondary"
                disabled={busy}
                onClick={() => {
                  if (
                    window.confirm(
                      `Remove “${field.label}” from the form? Answers already submitted are kept.`,
                    )
                  ) {
                    void run(() => deactivateFormField(field.id));
                  }
                }}
              >
                Remove
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
