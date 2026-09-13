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

function initialValue(field: FormField): string | string[] | boolean {
  if (field.field_type === "checkbox") return false;
  if (field.field_type === "multiselect") return [];
  return "";
}

export function DynamicForm({
  definition,
  submitLabel = "Submit",
  onSubmit,
  busy = false,
  error,
}: {
  definition: FormDefinition;
  submitLabel?: string;
  busy?: boolean;
  error?: string | null;
  onSubmit: (answers: Record<string, unknown>, honeypot: string) => void;
}) {
  const [values, setValues] = useState<FormValues>(() =>
    Object.fromEntries(definition.fields.map((f) => [f.key, initialValue(f)])),
  );
  // Hidden from sight and from assistive technology, so only a bot fills it.
  const [honeypot, setHoneypot] = useState("");

  function set(key: string, value: string | string[] | boolean) {
    setValues((current) => ({ ...current, [key]: value }));
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

      {definition.fields.map((field) => (
        <DynamicField
          key={field.id}
          field={field}
          value={values[field.key] ?? initialValue(field)}
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
  onChange,
}: {
  field: FormField;
  value: string | string[] | boolean;
  onChange: (value: string | string[] | boolean) => void;
}) {
  const id = `enquiry-${field.key}`;
  const describedBy = field.help_text ? `${id}-help` : undefined;
  const options = field.options ?? [];

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
    return (
      <div>
        {label}
        <Select
          id={id}
          required={field.is_required}
          aria-describedby={describedBy}
          value={String(value)}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">
            {field.placeholder ?? "Please choose…"}
          </option>
          {options.map((option) => (
            <option key={String(option)} value={String(option)}>
              {String(option)}
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
            <label key={String(option)} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={field.key}
                value={String(option)}
                checked={value === option}
                onChange={() => onChange(String(option))}
                className="h-4 w-4 border-border text-primary"
              />
              {String(option)}
            </label>
          ))}
        </div>
        {help}
      </fieldset>
    );
  }

  if (field.field_type === "multiselect") {
    const selected = Array.isArray(value) ? value : [];
    return (
      <fieldset>
        <legend className="text-sm font-medium">{field.label}</legend>
        <div className="mt-2 space-y-1.5">
          {options.map((option) => {
            const text = String(option);
            return (
              <label key={text} className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={selected.includes(text)}
                  onChange={(e) =>
                    onChange(
                      e.target.checked
                        ? [...selected, text]
                        : selected.filter((v) => v !== text),
                    )
                  }
                  className="h-4 w-4 rounded border-border text-primary"
                />
                {text}
              </label>
            );
          })}
        </div>
        {help}
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
