/**
 * Carrying an enquiry's context from a service page to the contact form.
 *
 * The service pages offer "Enquire about this" next to each specific service,
 * and the contact form should already know what was clicked. That context
 * travels in the query string rather than in a cookie or client state: it
 * survives a shared link, a new tab and a page refresh, it is visible to the
 * person sending it, and the contact page stays a plain server-rendered URL.
 *
 * The values are *suggestions*. They land in ordinary editable controls, and
 * the person can change or clear any of them before sending — so nothing here
 * is trusted on submission, and the server validates the enquiry exactly as it
 * would one typed from scratch.
 */

export const ENQUIRY_PARAMS = {
  service: "service",
  subService: "sub",
  country: "country",
} as const;

/** The form field keys these map onto (spec 3.2 / the seeded enquiry form). */
const FIELD = {
  service: "service_required",
  country: "country",
  detail: "nature_of_requirement",
} as const;

export type EnquiryContext = {
  /** The service category, as named in the catalogue. */
  service?: string | null;
  /** The specific service under it, when the enquiry came from one. */
  subService?: string | null;
  /** The market, which matches a Country option because both come from Region. */
  country?: string | null;
};

/** A link to the contact form, pre-loaded with what the visitor clicked. */
export function enquiryHref(context: EnquiryContext): string {
  const params = new URLSearchParams();
  if (context.service) params.set(ENQUIRY_PARAMS.service, context.service);
  if (context.subService) params.set(ENQUIRY_PARAMS.subService, context.subService);
  if (context.country) params.set(ENQUIRY_PARAMS.country, context.country);
  const query = params.toString();
  // The anchor lands the visitor on the form rather than at the top of a page
  // whose first screen is contact details they did not ask for.
  return query ? `/contact?${query}#enquiry` : "/contact#enquiry";
}

function one(value: string | string[] | undefined): string | null {
  if (Array.isArray(value)) return value[0] ?? null;
  return value ?? null;
}

/**
 * Turn the query string into initial values for the enquiry form.
 *
 * The sub-service has no field of its own — the form's shape is admin-editable
 * and inventing one here would hardcode exactly what Section 3.2 says must stay
 * in the database. It is instead phrased into the free-text requirement, which
 * is where a person would have written it anyway, and which they can rewrite.
 *
 * Values are length-capped: they arrive from the URL, so a hostile link should
 * not be able to paste an essay into somebody's form.
 */
export function enquiryPrefill(
  searchParams: Record<string, string | string[] | undefined>,
): Record<string, string> {
  const cap = (value: string | null, max: number) =>
    value ? value.trim().slice(0, max) : "";

  const service = cap(one(searchParams[ENQUIRY_PARAMS.service]), 120);
  const subService = cap(one(searchParams[ENQUIRY_PARAMS.subService]), 160);
  const country = cap(one(searchParams[ENQUIRY_PARAMS.country]), 80);

  const prefill: Record<string, string> = {};
  if (service) prefill[FIELD.service] = service;
  if (country) prefill[FIELD.country] = country;
  if (subService) {
    prefill[FIELD.detail] = service
      ? `I would like to enquire about ${subService} (${service}).`
      : `I would like to enquire about ${subService}.`;
  }
  return prefill;
}
