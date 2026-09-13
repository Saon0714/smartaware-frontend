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
