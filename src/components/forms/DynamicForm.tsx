"use client";

import { useState } from "react";

import { Button } from "@/components/ui/Button";
import { Checkbox, Select, Textarea } from "@/components/ui/Controls";
import { FormBanner, Input, Label } from "@/components/ui/Field";
import type { FormDefinition, FormField } from "@/lib/api/enquiries";

/**
 * Renders a form from a definition supplied by the API.
 *
 * Nothing about the enquiry form's fields is encoded here — labels, order,
 * which are required and what options a select offers all arrive as data. That
 * is what lets SmartAWARE change the form from the Admin Portal with no
 * frontend change and no deploy (spec Section 3.2, Section 13 item 1).
 *
 * Client-side validation is a courtesy only. The server validates every
 * submission against the live definition, which is the check that counts.
 */

export type FormValues = Record<string, string | string[] | boolean>;

/**
 * One choice. `value` is what gets submitted, `label` what is read, and
 * `group` an optional heading to sit the choice under.
 *
 * The three differ when a label is only meaningful under its heading: the
 * enquiry form's specific services read as plain names beneath the service
 * they belong to, but store a value that names the service too, because a
 * stored answer has no heading above it.
 */
export type FieldOption = { value: string; label: string; group?: string };

/**
 * Options a field takes from the other answers rather than from its own row.
 *
 * Returning null means "this field is not one of those" and its stored options
 * stand. Nothing here knows what the dependency *is* — the caller does.
 */
export type DependentOptions = (
  field: FormField,
  values: FormValues,
) => readonly FieldOption[] | null;

function asOptions(values: readonly unknown[]): FieldOption[] {
  return values.map((option) => ({ value: String(option), label: String(option) }));
}

function initialValue(field: FormField): string | string[] | boolean {
  if (field.field_type === "checkbox") return false;
  if (field.field_type === "multiselect") return [];
  return "";
}

export function DynamicForm({
  definition,
  initialValues,
  submitLabel = "Submit",
  onSubmit,
  busy = false,
  error,
  showHoneypot = true,
  dependentOptions,
}: {
  definition: FormDefinition;
  /** Existing values, for forms that edit a record rather than create one. */
  initialValues?: Record<string, unknown>;
  submitLabel?: string;
  busy?: boolean;
  error?: string | null;
  /** The honeypot belongs on public forms; a signed-in editor is not a bot. */
  showHoneypot?: boolean;
  /** Narrow a field's choices from the answers so far. */
  dependentOptions?: DependentOptions;
  onSubmit: (answers: Record<string, unknown>, honeypot: string) => void;
}) {
  const [values, setValues] = useState<FormValues>(() =>
    Object.fromEntries(
      definition.fields.map((field) => {
        const existing = initialValues?.[field.key];
        if (existing === undefined || existing === null) {
          return [field.key, initialValue(field)];
        }
        // Everything arrives from JSON, so coerce to what the control expects
        // rather than trusting the stored shape.
        if (field.field_type === "checkbox") return [field.key, Boolean(existing)];
        if (field.field_type === "multiselect") {
          return [field.key, Array.isArray(existing) ? existing.map(String) : []];
        }
        return [field.key, String(existing)];
      }),
    ),
  );
  // Hidden from sight and from assistive technology, so only a bot fills it.
  const [honeypot, setHoneypot] = useState("");

  function set(key: string, value: string | string[] | boolean) {
    setValues((current) => {
      const next = { ...current, [key]: value };
      if (!dependentOptions) return next;
      // An answer that the latest change took off the menu is dropped. Leaving
      // it would submit something the person can no longer see — untick a
      // service and its specific services have to go with it.
      for (const field of definition.fields) {
        if (field.key === key) continue;
        const allowed = dependentOptions(field, next);
        if (!allowed) continue;
        const permitted = new Set(allowed.map((option) => option.value));
        const chosen = next[field.key];
        if (Array.isArray(chosen)) {
          const kept = chosen.filter((entry) => permitted.has(entry));
          if (kept.length !== chosen.length) next[field.key] = kept;
        } else if (typeof chosen === "string" && chosen && !permitted.has(chosen)) {
          next[field.key] = "";
        }
      }
      return next;
    });
  }

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(values, honeypot);
      }}
      className="space-y-5"
    >
      {error && <FormBanner tone="error">{error}</FormBanner>}

      {showHoneypot && (
      <div
        aria-hidden
        className="absolute left-[-9999px] h-0 w-0 overflow-hidden"
      >
        <label htmlFor="website">Leave this field empty</label>
        <input
          id="website"
          name="website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>
      )}

      {definition.fields.map((field) => (
        <DynamicField
          key={field.id}
          field={field}
          value={values[field.key] ?? initialValue(field)}
          options={dependentOptions?.(field, values) ?? null}
          onChange={(value) => set(field.key, value)}
        />
      ))}

      <Button type="submit" loading={busy}>
        {submitLabel}
      </Button>
    </form>
  );
}

function DynamicField({
  field,
  value,
  options: dependent,
  onChange,
}: {
  field: FormField;
  value: string | string[] | boolean;
  /** Supplied when this field's choices come from the other answers. */
  options: readonly FieldOption[] | null;
  onChange: (value: string | string[] | boolean) => void;
}) {
  const id = `enquiry-${field.key}`;
  const describedBy = field.help_text ? `${id}-help` : undefined;
  const options = dependent ?? asOptions(field.options ?? []);

  const label = (
    <Label htmlFor={id}>
      {field.label}
      {field.is_required && (
        <span className="text-danger" aria-label="required">
          {" "}
          *
        </span>
      )}
    </Label>
  );

  const help = field.help_text ? (
    <p id={describedBy} className="mt-1 text-xs text-muted">
      {field.help_text}
    </p>
  ) : null;

  if (field.field_type === "checkbox") {
    return (
      <div>
        <Checkbox
          id={id}
          label={field.label}
          checked={Boolean(value)}
          onChange={(e) => onChange(e.target.checked)}
        />
        {help}
      </div>
    );
  }

  if (field.field_type === "select" || field.field_type === "country") {
    // A supplied value that is not among the options is offered as one rather
    // than dropped. Options are admin-editable and a value can arrive from a
    // saved record or a prefilled link, so the list it was chosen from may no
    // longer match — silently resetting the control to blank would lose the
    // answer without telling anyone.
    const current = String(value);
    const unlisted =
      current && !options.some((option) => option.value === current) ? current : null;

    return (
      <div>
        {label}
        <Select
          id={id}
          required={field.is_required}
          aria-describedby={describedBy}
          value={current}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">
            {field.placeholder ?? "Please choose…"}
          </option>
          {unlisted && <option value={unlisted}>{unlisted}</option>}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
        {help}
      </div>
    );
  }

  if (field.field_type === "radio") {
    return (
      <fieldset>
        <legend className="text-sm font-medium">{field.label}</legend>
        <div className="mt-2 space-y-1.5">
          {options.map((option) => (
            <label key={option.value} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={field.key}
                value={option.value}
                checked={value === option.value}
                onChange={() => onChange(option.value)}
                className="h-4 w-4 accent-[var(--sa-color-primary)]"
              />
              {option.label}
            </label>
          ))}
        </div>
        {help}
      </fieldset>
    );
  }

  if (field.field_type === "multiselect") {
    const selected = Array.isArray(value) ? value : [];
    // A chosen value the list no longer offers is shown rather than hidden.
    // It would otherwise be submitted invisibly and refused by the server,
    // with nothing on screen to say which answer caused it.
    const listed = new Set(options.map((option) => option.value));
    const shown: FieldOption[] = [
      ...options,
      ...selected.filter((v) => !listed.has(v)).map((v) => ({ value: v, label: v })),
    ];

    const toggle = (optionValue: string, on: boolean) =>
      onChange(
        on
          ? [...selected, optionValue]
          : selected.filter((entry) => entry !== optionValue),
      );

    const box = (option: FieldOption) => (
      <label key={option.value} className="flex items-start gap-2 text-sm">
        <input
          type="checkbox"
          checked={selected.includes(option.value)}
          onChange={(e) => toggle(option.value, e.target.checked)}
          className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--sa-color-primary)]"
        />
        {option.label}
      </label>
    );

    // Headings, when the choices carry them. A label is sometimes only
    // meaningful under one — "VAT registration support" says which tax but not
    // which service, and two services can offer a specific service by the very
    // same name.
    const groups: { name: string | null; options: FieldOption[] }[] = [];
    for (const option of shown) {
      const name = option.group ?? null;
      const last = groups[groups.length - 1];
      if (last && last.name === name) last.options.push(option);
      else groups.push({ name, options: [option] });
    }

    return (
      <fieldset aria-describedby={describedBy}>
        <legend className="text-sm font-medium">
          {field.label}
          {field.is_required && (
            <span className="text-danger" aria-label="required">
              {" "}
              *
            </span>
          )}
        </legend>
        {help}
        {shown.length === 0 ? (
          <p className="mt-2 text-sm text-muted">
            {field.placeholder ?? "Nothing to choose from yet."}
          </p>
        ) : (
          <div className="mt-2 max-h-72 space-y-3 overflow-y-auto rounded-lg border border-border bg-bg p-3 [scrollbar-color:var(--sa-color-border)_transparent] [scrollbar-width:thin]">
            {groups.map((group, index) =>
              group.name ? (
                <div key={`${group.name}-${index}`}>
                  <p className="text-xs font-medium uppercase tracking-wide text-muted">
                    {group.name}
                  </p>
                  <div className="mt-1.5 space-y-1.5 pl-1">
                    {group.options.map(box)}
                  </div>
                </div>
              ) : (
                <div key={`ungrouped-${index}`} className="space-y-1.5">
                  {group.options.map(box)}
                </div>
              ),
            )}
          </div>
        )}
      </fieldset>
    );
  }

  if (field.field_type === "textarea") {
    return (
      <div>
        {label}
        <Textarea
          id={id}
          rows={5}
          required={field.is_required}
          placeholder={field.placeholder ?? undefined}
          aria-describedby={describedBy}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
        />
        {help}
      </div>
    );
  }

  const inputType =
    field.field_type === "email"
      ? "email"
      : field.field_type === "phone"
        ? "tel"
        : field.field_type === "number"
          ? "number"
          : field.field_type === "date"
            ? "date"
            : "text";

  return (
    <div>
      {label}
      <Input
        id={id}
        type={inputType}
        required={field.is_required}
        placeholder={field.placeholder ?? undefined}
        aria-describedby={describedBy}
        value={String(value)}
        onChange={(e) => onChange(e.target.value)}
      />
      {help}
    </div>
  );
}
