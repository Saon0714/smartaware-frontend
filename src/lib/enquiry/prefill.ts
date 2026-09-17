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

/**
 * Field keys the form is wired to by name.
 *
 * The field list is otherwise entirely data — these three are structural, the
 * way a column name is. The backend names the same three for the same reason:
 * it narrows the catalogue by country, checks the services against it, and
 * checks the specific services against the services.
 */
export const ENQUIRY_FIELDS = {
  country: "country",
  services: "service_required",
  subServices: "sub_services",
} as const;

export type EnquiryContext = {
  /** The service category, named as the chosen market names it. */
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
 * Read the context back out of the query string.
 *
 * Values are length-capped: they arrive from the URL, so a hostile link should
 * not be able to paste an essay into somebody's form. Turning them into form
 * answers happens later, against the live catalogue — a service page names a
 * specific service, and only the catalogue knows which stored value that is.
 */
export function enquiryContext(
  searchParams: Record<string, string | string[] | undefined>,
): EnquiryContext {
  const cap = (value: string | null, max: number) =>
    value ? value.trim().slice(0, max) : null;

  return {
    service: cap(one(searchParams[ENQUIRY_PARAMS.service]), 120),
    subService: cap(one(searchParams[ENQUIRY_PARAMS.subService]), 160),
    country: cap(one(searchParams[ENQUIRY_PARAMS.country]), 80),
  };
}
