/**
 * Profile, onboarding and notes.
 *
 * None of these take a client identifier: the backend resolves the record from
 * the caller's session, so there is nothing here that could address another
 * account.
 */

import { apiFetch, type ApiPaths } from "./client";

type Json<T> = T extends { content: { "application/json": infer R } } ? R : never;

export type Profile = Json<
  ApiPaths["/api/v1/portal/profile"]["get"]["responses"][200]
>;
export type ProfileField = Profile["fields"][number];

export type Onboarding = Json<
  ApiPaths["/api/v1/portal/onboarding"]["get"]["responses"][200]
>;
export type OnboardingStep = Onboarding["steps"][number];

export type ClientNote = Json<
  ApiPaths["/api/v1/portal/notes"]["get"]["responses"][200]
>[number];

export type StaffNote = Json<
  ApiPaths["/api/v1/admin/notes"]["get"]["responses"][200]
>[number];

export const getProfile = () => apiFetch<Profile>("/portal/profile");

export const updateProfile = (values: Record<string, unknown>) =>
  apiFetch<Profile>("/portal/profile", { method: "PATCH", body: { values } });

export const getOnboarding = () => apiFetch<Onboarding>("/portal/onboarding");

export const saveOnboarding = (
  answers: Record<string, unknown>,
  complete: boolean,
) =>
  apiFetch<Onboarding>("/portal/onboarding", {
    method: "POST",
    body: { answers, complete },
  });

export const listMyNotes = () => apiFetch<ClientNote[]>("/portal/notes");

// --- Staff -----------------------------------------------------------------------

export const listNotes = (clientId?: string) =>
  apiFetch<StaffNote[]>(`/admin/notes${clientId ? `?client_id=${clientId}` : ""}`);

export const createNote = (body: Record<string, unknown>) =>
  apiFetch<StaffNote>("/admin/notes", { method: "POST", body });

export const updateNote = (id: string, body: Record<string, unknown>) =>
  apiFetch<StaffNote>(`/admin/notes/${id}`, { method: "PATCH", body });

export const deleteNote = (id: string) =>
  apiFetch<void>(`/admin/notes/${id}`, { method: "DELETE" });

export const getClientOnboarding = (clientId: string) =>
  apiFetch<{
    completed_at: string | null;
    steps: { title: string; answers: { label: string; value: unknown }[] }[];
  }>(`/admin/clients/${clientId}/onboarding`);
