/**
 * Typed HTTP client for the SmartAWARE backend.
 *
 * The backend is a separate origin and a separate repository. This module is
 * the ONLY place the frontend knows how to reach it — there are no shared
 * packages or local imports across the two repos, by design.
 *
 * Auth (see BUILD_PLAN Q1): the refresh token lives in an httpOnly cookie the
 * browser sends automatically because of `credentials: "include"`. The
 * short-lived access token is held in memory by the session layer (Chunk 2)
 * and attached here. Nothing durable is kept in localStorage, so an XSS bug
 * cannot walk away with a lasting session.
 */

import type { paths } from "./schema";

export type ApiPaths = paths;

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";
const API_PREFIX = "/api/v1";

export class ApiError extends Error {
  constructor(
    readonly status: number,
    readonly detail: string,
    readonly body: unknown,
  ) {
    super(`${status}: ${detail}`);
    this.name = "ApiError";
  }
}

let accessToken: string | null = null;

/** Set by the session layer after login/refresh. Memory only — never persisted. */
export function setAccessToken(token: string | null): void {
  accessToken = token;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  /** Prefix with /api/v1. Disable for unversioned routes. */
  versioned?: boolean;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, versioned = true, headers, ...rest } = options;
  const url = `${BASE_URL}${versioned ? API_PREFIX : ""}${path}`;

  const requestHeaders = new Headers(headers);
  if (body !== undefined && !requestHeaders.has("Content-Type")) {
    requestHeaders.set("Content-Type", "application/json");
  }
  if (accessToken) {
    requestHeaders.set("Authorization", `Bearer ${accessToken}`);
  }

  const response = await fetch(url, {
    ...rest,
    headers: requestHeaders,
    // Sends the httpOnly refresh cookie cross-origin. Requires the backend's
    // CORS allowlist to name this exact origin — a wildcard will not work.
    credentials: "include",
    ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    const detail =
      payload && typeof payload === "object" && "detail" in payload
        ? String((payload as { detail: unknown }).detail)
        : response.statusText;
    throw new ApiError(response.status, detail, payload);
  }

  return payload as T;
}
