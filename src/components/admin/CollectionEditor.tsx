"use client";

import { useState } from "react";

import { describeError, useAsync } from "@/components/admin/useAsync";
import type { CollectionSpec, FieldSpec } from "@/components/admin/collections";
import { Button } from "@/components/ui/Button";
import { Badge, Checkbox, EmptyState, PageHeader, Select, Textarea } from "@/components/ui/Controls";
import { FormBanner, Input, Label } from "@/components/ui/Field";
import {
  createCollectionRow, deleteCollectionRow, listCollection, reorderCollection,
  updateCollectionRow, type CollectionRow,
} from "@/lib/api/admin";

/**
 * Editor for any of the ordered content collections.
 *
 * One component driven by a descriptor, mirroring the backend's router factory,
 * rather than nine near-identical screens that would drift apart.
 *
 * Reordering uses move-up/move-down buttons rather than drag-and-drop: it is
 * keyboard accessible without extra work, and these lists are short enough that
 * dragging would not be meaningfully faster.
 */
export function CollectionEditor({ spec }: { spec: CollectionSpec }) {
  const { data, error, loading, reload, setError } = useAsync(() => listCollection(spec.path), spec.path);
  const [editing, setEditing] = useState<CollectionRow | "new" | null>(null);
  const [busy, setBusy] = useState(false);

  const rows = data ?? [];

  async function run(action: () => Promise<unknown>) {
    setBusy(true);
    setError(null);
    try {
      await action();
      await reload();
      return true;
    } catch (err) {
      setError(describeError(err));
      return false;
    } finally {
      setBusy(false);
    }
  }

  async function move(index: number, direction: -1 | 1) {
    const next = [...rows];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    const a = next[index];
    const b = next[target];
    if (!a || !b) return;
    next[index] = b;
    next[target] = a;
    await run(() => reorderCollection(spec.path, next.map((r) => r.id)));
  }

  return (
    <div>
      <PageHeader
        title={spec.title}
        description={spec.description}
        actions={
          <Button onClick={() => setEditing("new")} disabled={busy}>
            {spec.addLabel}
          </Button>
        }
      />

      {error && (
        <div className="mt-4">
          <FormBanner tone="error">{error}</FormBanner>
        </div>
      )}

      {editing && (
        <div className="mt-6">
          <RowForm
            spec={spec}
            row={editing === "new" ? null : editing}
            busy={busy}
            onCancel={() => setEditing(null)}
            onSubmit={async (values) => {
              const ok = await run(() =>
                editing === "new"
                  ? createCollectionRow(spec.path, values)
                  : updateCollectionRow(spec.path, editing.id, values),
              );
              if (ok) setEditing(null);
            }}
          />
        </div>
      )}

      <div className="mt-6">
        {loading && <p className="text-sm text-muted">Loading…</p>}

        {!loading && rows.length === 0 && (
          <EmptyState>
            Nothing here yet. Use “{spec.addLabel}” to create the first entry.
          </EmptyState>
        )}

        <ul className="space-y-2">
          {rows.map((row, index) => (
            <li
              key={row.id}
              className="sa-card flex items-start gap-4 rounded-xl border border-border bg-bg p-4 shadow-[var(--sa-shadow-sm)]"
            >
              <div className="flex shrink-0 flex-col gap-1">
                <button
                  type="button"
                  onClick={() => void move(index, -1)}
                  disabled={busy || index === 0}
                  aria-label="Move up"
                  className="rounded border border-border px-2 text-xs disabled:opacity-30"
                >
                  ↑
                </button>
                <button
                  type="button"
                  onClick={() => void move(index, 1)}
                  disabled={busy || index === rows.length - 1}
                  aria-label="Move down"
                  className="rounded border border-border px-2 text-xs disabled:opacity-30"
                >
                  ↓
                </button>
              </div>

              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-medium">{String(row[spec.titleField] ?? "—")}</p>
                  {"is_published" in row && (
                    <Badge tone={row.is_published ? "success" : "neutral"}>
                      {row.is_published ? "Published" : "Draft"}
                    </Badge>
                  )}
                  {"is_verified" in row && !row.is_verified && (
                    <Badge tone="warning">Unverified</Badge>
                  )}
                  {/* The public site shows sample reviews exactly as it will
                      show real ones, so this list is the only place an editor
                      can tell them apart. */}
                  {row.source === "placeholder" && (
                    <Badge tone="warning">Sample — not a real review</Badge>
                  )}
                  {typeof row.source === "string" &&
                    row.source !== "placeholder" &&
                    row.source !== "manual" && <Badge>{String(row.source)}</Badge>}
                </div>
                {spec.subtitleField && (
                  <p className="mt-1 line-clamp-2 text-sm text-muted">
                    {String(row[spec.subtitleField] ?? "")}
                  </p>
                )}
              </div>

              <div className="flex shrink-0 gap-2">
                <Button variant="secondary" onClick={() => setEditing(row)} disabled={busy}>
                  Edit
                </Button>
                <Button
                  variant="secondary"
                  disabled={busy}
                  onClick={() => {
                    if (
                      window.confirm(
                        `Delete “${String(row[spec.titleField])}”? This cannot be undone.`,
                      )
                    ) {
                      void run(() => deleteCollectionRow(spec.path, row.id));
                    }
                  }}
                >
                  Delete
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function RowForm({
  spec,
  row,
  busy,
  onSubmit,
  onCancel,
}: {
  spec: CollectionSpec;
  row: CollectionRow | null;
  busy: boolean;
  onSubmit: (values: Record<string, unknown>) => void;
  onCancel: () => void;
}) {
  const [values, setValues] = useState<Record<string, unknown>>(() => {
    const initial: Record<string, unknown> = {};
    for (const field of spec.fields) {
      initial[field.key] =
        row?.[field.key] ?? (field.type === "checkbox" ? false : "");
    }
    return initial;
  });

  function set(key: string, value: unknown) {
    setValues((current) => ({ ...current, [key]: value }));
  }

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        // Empty optional text fields are sent as null rather than "", so the
        // database holds an absent value rather than a blank string.
        const payload: Record<string, unknown> = {};
        for (const field of spec.fields) {
          const value = values[field.key];
          if (field.type === "checkbox") payload[field.key] = Boolean(value);
          else if (field.type === "number")
            payload[field.key] = value === "" ? null : Number(value);
          else payload[field.key] = value === "" ? null : value;
        }
        onSubmit(payload);
      }}
      className="sa-card rounded-xl border border-border bg-bg p-6 shadow-[var(--sa-shadow-sm)]"
    >
      <h2 className="font-medium">{row ? "Edit entry" : spec.addLabel}</h2>

      <div className="mt-4 space-y-4">
        {spec.fields.map((field) => (
          <FieldInput
            key={field.key}
            field={field}
            value={values[field.key]}
            onChange={(value) => set(field.key, value)}
          />
        ))}
      </div>

      <div className="mt-6 flex gap-2">
        <Button type="submit" loading={busy}>
          {row ? "Save changes" : "Create"}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel} disabled={busy}>
          Cancel
        </Button>
      </div>
    </form>
  );
}

function FieldInput({
  field,
  value,
  onChange,
}: {
  field: FieldSpec;
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const id = `field-${field.key}`;

  if (field.type === "checkbox") {
    return (
      <div>
        <Checkbox
          id={id}
          label={field.label}
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
        {field.help && <p className="mt-1 text-xs text-muted">{field.help}</p>}
      </div>
    );
  }

  return (
    <div>
      <Label htmlFor={id}>
        {field.label}
        {field.required && <span className="text-danger"> *</span>}
      </Label>
      {field.type === "choice" ? (
        <Select
          id={id}
          required={field.required}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">{field.required ? "Choose one…" : "None"}</option>
          {(field.options ?? []).map((option) => {
            const { value: optionValue, label } =
              typeof option === "string" ? { value: option, label: option } : option;
            return (
              <option key={optionValue} value={optionValue}>
                {label}
              </option>
            );
          })}
        </Select>
      ) : field.type === "textarea" ? (
        <Textarea
          id={id}
          required={field.required}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      ) : (
        <Input
          id={id}
          type={field.type === "number" ? "number" : "text"}
          required={field.required}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
      )}
      {field.help && <p className="mt-1 text-xs text-muted">{field.help}</p>}
    </div>
  );
}
