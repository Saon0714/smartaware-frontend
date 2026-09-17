/**
 * Enquiry form: fetching its definition and submitting it.
 */

import { apiFetch, type ApiPaths } from "./client";

type Json<T> = T extends { content: { "application/json": infer R } } ? R : never;

export type FormDefinition = Json<
  ApiPaths["/api/v1/public/forms/{form_key}"]["get"]["responses"][200]
>;
export type FormField = FormDefinition["fields"][number];
export type FieldType = FormField["field_type"];

export function getForm(formKey: string): Promise<FormDefinition> {
  return apiFetch<FormDefinition>(`/public/forms/${encodeURIComponent(formKey)}`);
}

export function submitEnquiry(
  answers: Record<string, unknown>,
  honeypot: string,
): Promise<{ id: string; message: string }> {
  return apiFetch("/public/enquiries", {
    method: "POST",
    body: { answers, website: honeypot || null },
  });
}

export type EnquiryCatalogue = Json<
  ApiPaths["/api/v1/public/enquiry-catalogue"]["get"]["responses"][200]
>;
// Every list on this payload has a server-side default, so the generated type
// marks it optional. It is always present in practice.
export type CatalogueMarket = NonNullable<EnquiryCatalogue["markets"]>[number];
export type CatalogueService = NonNullable<CatalogueMarket["services"]>[number];
export type SubServiceOption = NonNullable<CatalogueService["sub_services"]>[number];

/**
 * Services and their specific services, per market.
 *
 * Fetched whole so the form can narrow itself as boxes are ticked without a
 * round trip, and so a brief outage costs the narrowing rather than the form.
 */
export function getEnquiryCatalogue(): Promise<EnquiryCatalogue> {
  return apiFetch<EnquiryCatalogue>("/public/enquiry-catalogue");
}
