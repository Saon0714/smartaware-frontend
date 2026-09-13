/**
 * Typed wrapper for the health endpoint.
 *
 * Illustrates the pattern every endpoint module follows: response types are
 * *derived* from the generated schema, never hand-written. If the backend
 * changes `HealthResponse`, regenerating the schema makes this file fail to
 * typecheck rather than failing silently at runtime.
 */

import { apiFetch, type ApiPaths } from "./client";

export type HealthResponse =
  ApiPaths["/api/v1/health"]["get"]["responses"][200]["content"]["application/json"];

export function getHealth(): Promise<HealthResponse> {
  return apiFetch<HealthResponse>("/health");
}
