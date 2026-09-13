/**
 * Typed wrappers for the public content endpoints.
 *
 * These are called from Server Components, so they run on the server at render
 * time rather than in the browser. That keeps the marketing pages
 * server-rendered for SEO — spec Section 2 calls the public site SEO-sensitive
 * — and means no content flashes in after hydration.
 */

import { apiFetch, type ApiPaths } from "./client";

type Json<T> = T extends { content: { "application/json": infer R } } ? R : never;

export type HomePage = Json<ApiPaths["/api/v1/public/home"]["get"]["responses"][200]>;
export type AboutPage = Json<ApiPaths["/api/v1/public/about"]["get"]["responses"][200]>;
export type ContactPage = Json<ApiPaths["/api/v1/public/contact"]["get"]["responses"][200]>;
export type LegalPage = Json<
  ApiPaths["/api/v1/public/legal/{slug}"]["get"]["responses"][200]
>;
export type LegalPageSummary = Json<
  ApiPaths["/api/v1/public/legal"]["get"]["responses"][200]
>[number];

export type ContentBlock = NonNullable<AboutPage["intro"]>;
export type ServiceTeaser = HomePage["services"][number];
export type ContactDetail = ContactPage["details"][number];

export function getHomePage(): Promise<HomePage> {
  return apiFetch<HomePage>("/public/home");
}

export function getAboutPage(): Promise<AboutPage> {
  return apiFetch<AboutPage>("/public/about");
}

export function getContactPage(): Promise<ContactPage> {
  return apiFetch<ContactPage>("/public/contact");
}

export function listLegalPages(): Promise<LegalPageSummary[]> {
  return apiFetch<LegalPageSummary[]>("/public/legal");
}

export function getLegalPage(slug: string): Promise<LegalPage> {
  return apiFetch<LegalPage>(`/public/legal/${encodeURIComponent(slug)}`);
}
