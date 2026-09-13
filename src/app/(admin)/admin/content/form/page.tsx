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

const FIELD_TYPES = [
  "text", "textarea", "email", "phone", "number", "date",
  "select", "multiselect", "checkbox", "radio", "country",
] as const;

export default function EnquiryFormFieldsPage() {
  const form = useAsync(() => getAdminForm("enquiry"), "enquiry");
  const [busy, setBusy] = useState(false);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState({
    key: "", label: "", field_type: "text", is_required: false,
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
                sort_order: fields.length + 1,
              }),
            );
            if (ok) {
              setDraft({ key: "", label: "", field_type: "text", is_required: false });
              setAdding(false);
            }
          }}
          className="mt-6 sa-card rounded-lg border border-border bg-surface p-6"
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
              <Label htmlFor="key">
                Key<span className="text-danger"> *</span>
              </Label>
              <Input
                id="key"
                required
                pattern="[a-z][a-z0-9_]*"
                placeholder="referred_by"
                value={draft.key}
                onChange={(e) => setDraft({ ...draft, key: e.target.value })}
              />
              <p className="mt-1 text-xs text-muted">
                Lower case and underscores. Stored with every submission and
                cannot be changed later.
              </p>
            </div>
            <div>
              <Label htmlFor="field_type">Type</Label>
              <Select
                id="field_type"
                value={draft.field_type}
                onChange={(e) => setDraft({ ...draft, field_type: e.target.value })}
              >
                {FIELD_TYPES.map((type) => (
                  <option key={type} value={type}>
                    {type}
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
            className="flex flex-wrap items-center justify-between gap-4 sa-card rounded-lg border border-border p-4"
          >
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <p className="font-medium">{field.label}</p>
                <Badge>{field.field_type}</Badge>
                {field.is_required && <Badge tone="warning">Required</Badge>}
              </div>
              <p className="mt-1 font-mono text-xs text-muted">{field.key}</p>
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
