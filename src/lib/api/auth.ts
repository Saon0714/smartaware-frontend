/**
 * Typed wrappers for the auth endpoints.
 *
 * Every type is derived from the generated schema rather than declared, so a
 * backend field rename becomes a TypeScript error here instead of a runtime
 * surprise in a component.
 */

import { apiFetch, type ApiPaths } from "./client";

type Json<T> = T extends { content: { "application/json": infer R } } ? R : never;

export type SessionOut = Json<
  ApiPaths["/api/v1/auth/login"]["post"]["responses"][200]
>;
export type UserOut = SessionOut["user"];
export type MeOut = Json<ApiPaths["/api/v1/auth/me"]["get"]["responses"][200]>;
export type ClientSummary = NonNullable<MeOut["client"]>;
export type InviteCheckOut = Json<
  ApiPaths["/api/v1/auth/invite/{token}"]["get"]["responses"][200]
>;
export type UserRole = UserOut["role"];

export function login(email: string, password: string): Promise<SessionOut> {
  return apiFetch<SessionOut>("/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

/** Exchange the httpOnly refresh cookie for a fresh access token. */
export function refresh(): Promise<SessionOut> {
  return apiFetch<SessionOut>("/auth/refresh", { method: "POST" });
}

export function logout(): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/auth/logout", { method: "POST" });
}

export function getMe(): Promise<MeOut> {
  return apiFetch<MeOut>("/auth/me");
}

export function changePassword(
  currentPassword: string,
  newPassword: string,
): Promise<{ message: string }> {
  return apiFetch<{ message: string }>("/auth/change-password", {
    method: "POST",
    body: { current_password: currentPassword, new_password: newPassword },
  });
}

export function checkInvite(token: string): Promise<InviteCheckOut> {
  return apiFetch<InviteCheckOut>(`/auth/invite/${encodeURIComponent(token)}`);
}

export function acceptInvite(
  token: string,
  password: string,
  fullName?: string,
): Promise<SessionOut> {
  return apiFetch<SessionOut>(
    `/auth/invite/${encodeURIComponent(token)}/accept`,
    { method: "POST", body: { password, full_name: fullName ?? null } },
  );
}
