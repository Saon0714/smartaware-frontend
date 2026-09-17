"use client";

import { useEffect, useState } from "react";

import {
  DynamicForm,
  type DependentOptions,
  type FieldOption,
  type FormValues,
} from "@/components/forms/DynamicForm";
import { ApiError } from "@/lib/api/client";
import {
  getEnquiryCatalogue,
  getForm,
  type CatalogueService,
  type EnquiryCatalogue,
  type FormDefinition,
  submitEnquiry,
} from "@/lib/api/enquiries";
import { ENQUIRY_FIELDS, type EnquiryContext } from "@/lib/enquiry/prefill";

/**
 * The services on offer, narrowed by the market if one has been chosen.
 *
 * Without a market every market's services are offered, because a market can
 * rename a service — India lists "VAT / GST Services" where the UK lists "VAT
 * Services" — and until the person says where they are, either name is a fair
 * answer. The server applies the same rule to what it will accept.
 */
function servicesFor(
  catalogue: EnquiryCatalogue | null,
  country: string,
): CatalogueService[] {
  const markets = catalogue?.markets ?? [];
  const scoped = country ? markets.filter((m) => m.country === country) : markets;
  const chosen = scoped.length > 0 ? scoped : markets;

  const seen = new Set<string>();
  const services: CatalogueService[] = [];
  for (const market of chosen) {
    for (const service of market.services ?? []) {
      if (seen.has(service.name)) continue;
      seen.add(service.name);
      services.push(service);
    }
  }
  return services;
}

function text(values: FormValues, key: string): string {
  const value = values[key];
  return typeof value === "string" ? value : "";
}

function list(values: FormValues, key: string): string[] {
  const value = values[key];
  return Array.isArray(value) ? value : [];
}

/**
 * The website enquiry form.
 *
 * Fetched at render time rather than baked in, so a field added in the Admin
 * Portal appears on the next page load.
 *
 * `context` carries whatever the visitor clicked to get here — a service, a
 * specific service under it, a market. It becomes starting values in ordinary
 * editable controls, not a locked-in submission.
 */
export function EnquiryForm({ context }: { context?: EnquiryContext }) {
  const [definition, setDefinition] = useState<FormDefinition | null>(null);
  const [catalogue, setCatalogue] = useState<EnquiryCatalogue | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    Promise.all([
      getForm("enquiry"),
      // Losing the catalogue costs the narrowing, not the form: the fields
      // fall back to the options their own rows carry, and the server still
      // checks what is sent. Losing the definition leaves nothing to render.
      getEnquiryCatalogue().catch(() => null),
    ])
      .then(([form, tree]) => {
        if (cancelled) return;
        setDefinition(form);
        setCatalogue(tree);
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
      <p className="sa-card rounded-lg border border-border p-6 text-sm text-muted">
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
      initialValues={initialValues(catalogue, context)}
      dependentOptions={dependentOptions(catalogue)}
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


/**
 * Turn what the visitor clicked into starting answers.
 *
 * Resolved against the catalogue rather than composed here, so the value a
 * specific service is stored under is decided in one place — the server's —
 * and a link that no longer matches the catalogue starts a blank field instead
 * of one the server is certain to refuse. These are suggestions either way:
 * every one of them lands in a control the person can change.
 */
function initialValues(
  catalogue: EnquiryCatalogue | null,
  context: EnquiryContext | undefined,
): Record<string, unknown> | undefined {
  if (!context) return undefined;

  const country = context.country ?? "";
  const values: Record<string, unknown> = {};
  if (country) values[ENQUIRY_FIELDS.country] = country;
  // Carried from Smart AI when it could not answer. Starting text in an
  // ordinary box — the person reads it, edits it, or clears it.
  if (context.question) values[ENQUIRY_FIELDS.message] = context.question;

  const service = servicesFor(catalogue, country).find(
    (candidate) => candidate.name === context.service,
  );
  // Without the catalogue there is nothing to check the service against, so it
  // is taken at its word — the field falls back to its own options too.
  if (!catalogue && context.service) {
    values[ENQUIRY_FIELDS.services] = [context.service];
    return values;
  }
  if (!service) return values;

  values[ENQUIRY_FIELDS.services] = [service.name];
  const sub = (service.sub_services ?? []).find(
    (option) => option.label === context.subService,
  );
  if (sub) values[ENQUIRY_FIELDS.subServices] = [sub.value];
  return values;
}

/**
 * The two fields that take their choices from the others.
 *
 * Services follow the market; the specific services follow the services. Both
 * read from the catalogue the server built, so the form cannot offer something
 * the server would then refuse.
 */
function dependentOptions(catalogue: EnquiryCatalogue | null): DependentOptions | undefined {
  if (!catalogue) return undefined;

  return (field, values) => {
    const country = text(values, ENQUIRY_FIELDS.country);
    const services = servicesFor(catalogue, country);

    if (field.key === ENQUIRY_FIELDS.services) {
      return services.map((service) => ({ value: service.name, label: service.name }));
    }

    if (field.key === ENQUIRY_FIELDS.subServices) {
      const chosen = new Set(list(values, ENQUIRY_FIELDS.services));
      const options: FieldOption[] = [];
      for (const service of services) {
        if (!chosen.has(service.name)) continue;
        for (const option of service.sub_services ?? []) {
          options.push({ ...option, group: service.name });
        }
      }
      return options;
    }

    return null;
  };
}
