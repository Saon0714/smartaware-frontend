"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { describeError, useAsync } from "@/components/admin/useAsync";
import { Button } from "@/components/ui/Button";
import { Checkbox, Select, Textarea } from "@/components/ui/Controls";
import { FormBanner, Input, Label } from "@/components/ui/Field";
import { getOnboarding, saveOnboarding, type Onboarding } from "@/lib/api/profile";

/**
 * The onboarding wizard — spec Section 5.2.
 *
 * Steps and questions come from the database, so this renders whatever it is
 * given. Progress is saved on each step rather than only at the end, because
 * the real question set is not yet known and could be long.
 */
export default function OnboardingPage() {
  const onboarding = useAsync(getOnboarding, "onboarding");
  const router = useRouter();

  const [index, setIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, unknown> | null>(null);
  const [busy, setBusy] = useState(false);

  if (onboarding.loading) return <p className="text-sm text-muted">Loading…</p>;
  if (!onboarding.data) {
    return (
      <FormBanner tone="error">
        {onboarding.error ?? "The onboarding questions could not be loaded."}
      </FormBanner>
    );
  }

  const data: Onboarding = onboarding.data;
  const values = answers ?? (data.answers as Record<string, unknown>);
  const steps = data.steps;
  const step = steps[index];
  const isLast = index === steps.length - 1;

  if (steps.length === 0) {
    return (
      <FormBanner tone="info">
        There are no onboarding questions to answer at the moment.
      </FormBanner>
    );
  }

  if (data.completed_at && answers === null) {
    return (
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Onboarding complete</h1>
        <p className="mt-2 text-muted">
          Thank you — you completed this on{" "}
          {new Date(data.completed_at).toLocaleDateString("en-GB")}. You can
          review or update your answers below.
        </p>
        <Button className="mt-6" onClick={() => setAnswers({ ...data.answers })}>
          Review my answers
        </Button>
      </div>
    );
  }

  function set(key: string, value: unknown) {
    setAnswers((current) => ({ ...(current ?? data.answers), [key]: value }));
  }

  async function persist(complete: boolean) {
    setBusy(true);
    onboarding.setError(null);
    try {
      await saveOnboarding(values, complete);
      if (complete) {
        router.push("/portal");
        return true;
      }
      return true;
    } catch (err) {
      onboarding.setError(describeError(err));
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <p className="text-sm text-muted">
        Step {index + 1} of {steps.length}
      </p>
      <div
        className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-surface"
        role="progressbar"
        aria-valuenow={index + 1}
        aria-valuemin={1}
        aria-valuemax={steps.length}
      >
        <div
          className="h-full bg-primary transition-all"
          style={{ width: `${((index + 1) / steps.length) * 100}%` }}
        />
      </div>

      <h1 className="mt-6 text-2xl font-semibold tracking-tight">{step?.title}</h1>
      {step?.description && <p className="mt-2 text-muted">{step.description}</p>}

      {onboarding.error && (
        <div className="mt-4">
          <FormBanner tone="error">{onboarding.error}</FormBanner>
        </div>
      )}

      <form
        className="mt-6 space-y-5"
        onSubmit={async (event) => {
          event.preventDefault();
          const ok = await persist(isLast);
          if (ok && !isLast) setIndex((i) => i + 1);
        }}
      >
        {(step?.questions ?? []).map((question) => (
          <Question
            key={question.id}
            question={question}
            value={values[question.key]}
            onChange={(v) => set(question.key, v)}
          />
        ))}

        <div className="flex flex-wrap gap-2 pt-2">
          {index > 0 && (
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => setIndex((i) => i - 1)}
            >
              Back
            </Button>
          )}
          <Button type="submit" loading={busy}>
            {isLast ? "Finish" : "Save and continue"}
          </Button>
          {!isLast && (
            <Button
              type="button"
              variant="secondary"
              disabled={busy}
              onClick={() => void persist(false)}
            >
              Save for later
            </Button>
          )}
        </div>
        <p className="text-xs text-muted">
          Your answers are saved as you go — you can leave and come back.
        </p>
      </form>
    </div>
  );
}

function Question({
  question,
  value,
  onChange,
}: {
  question: Onboarding["steps"][number]["questions"][number];
  value: unknown;
  onChange: (value: unknown) => void;
}) {
  const id = `q-${question.key}`;
  const options = (question.options ?? []) as unknown[];

  const label = (
    <Label htmlFor={id}>
      {question.label}
      {question.is_required && <span className="text-danger"> *</span>}
    </Label>
  );
  const help = question.help_text ? (
    <p className="mt-1 text-xs text-muted">{question.help_text}</p>
  ) : null;

  if (question.field_type === "select" || question.field_type === "country") {
    return (
      <div>
        {label}
        <Select
          id={id}
          required={question.is_required}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        >
          <option value="">Please choose…</option>
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

  if (question.field_type === "radio") {
    return (
      <fieldset>
        <legend className="text-sm font-medium">{question.label}</legend>
        <div className="mt-2 space-y-1.5">
          {options.map((option) => (
            <label key={String(option)} className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name={question.key}
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

  if (question.field_type === "multiselect") {
    const selected = Array.isArray(value) ? (value as string[]) : [];
    return (
      <fieldset>
        <legend className="text-sm font-medium">{question.label}</legend>
        <div className="mt-2 space-y-1.5">
          {options.map((option) => {
            const text = String(option);
            return (
              <Checkbox
                key={text}
                label={text}
                checked={selected.includes(text)}
                onChange={(e) =>
                  onChange(
                    e.target.checked
                      ? [...selected, text]
                      : selected.filter((v) => v !== text),
                  )
                }
              />
            );
          })}
        </div>
        {options.length === 0 && (
          <p className="mt-1 text-xs text-muted">No options configured yet.</p>
        )}
        {help}
      </fieldset>
    );
  }

  if (question.field_type === "textarea") {
    return (
      <div>
        {label}
        <Textarea
          id={id}
          required={question.is_required}
          value={String(value ?? "")}
          onChange={(e) => onChange(e.target.value)}
        />
        {help}
      </div>
    );
  }

  return (
    <div>
      {label}
      <Input
        id={id}
        type={question.field_type === "date" ? "date" : "text"}
        required={question.is_required}
        value={String(value ?? "")}
        onChange={(e) => onChange(e.target.value)}
      />
      {help}
    </div>
  );
}
