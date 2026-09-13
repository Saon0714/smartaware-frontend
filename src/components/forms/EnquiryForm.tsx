"use client";

import { useEffect, useState } from "react";

import { DynamicForm } from "@/components/forms/DynamicForm";
import { ApiError } from "@/lib/api/client";
import { getForm, submitEnquiry, type FormDefinition } from "@/lib/api/enquiries";

/**
 * The website enquiry form.
 *
 * Fetched at render time rather than baked in, so a field added in the Admin
 * Portal appears on the next page load.
 */
export function EnquiryForm() {
  const [definition, setDefinition] = useState<FormDefinition | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    getForm("enquiry")
      .then((form) => {
        if (!cancelled) setDefinition(form);
      })
      .catch(() => {
        if (!cancelled) {
          setLoadError(
            "The enquiry form could not be loaded. Please try again shortly.",
          );
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (done) {
    return (
      <div
        role="status"
        className="rounded-lg border border-success/30 bg-success/5 p-6"
      >
        <h3 className="font-medium text-success">Enquiry received</h3>
        <p className="mt-2 text-sm text-muted">{done}</p>
      </div>
    );
  }

  if (loadError) {
    return (
      <p className="rounded-lg border border-border p-6 text-sm text-muted">
        {loadError}
      </p>
    );
  }

  if (!definition) {
    return <p className="text-sm text-muted">Loading the enquiry form…</p>;
  }

  return (
    <DynamicForm
      definition={definition}
      submitLabel="Send enquiry"
      busy={busy}
      error={error}
      onSubmit={async (answers, honeypot) => {
        setBusy(true);
        setError(null);
        try {
          const result = await submitEnquiry(answers, honeypot);
          setDone(result.message);
        } catch (err) {
          // The server validates against the live definition, so its message is
          // the accurate one — surface it rather than a generic failure.
          setError(
            err instanceof ApiError
              ? err.detail
              : "Your enquiry could not be sent. Please try again.",
          );
          setBusy(false);
        }
      }}
    />
  );
}
