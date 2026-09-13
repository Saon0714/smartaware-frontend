/**
 * Where each role belongs after signing in.
 *
 * Derived from the role the server returns, never from which login tab was
 * used. The tab is presentation; the role is authority.
 */

import type { UserRole } from "@/lib/api/auth";

export type LoginAudience = "client" | "admin";

export const LOGIN_PATHS: Record<LoginAudience, string> = {
  client: "/login/client",
  admin: "/login/admin",
};

export function homeForRole(role: UserRole): string {
  return role === "client" ? "/portal" : "/admin";
}

/** The login page a protected path should send an anonymous visitor to. */
export function loginPathForTarget(pathname: string): string {
  return pathname.startsWith("/admin") ? LOGIN_PATHS.admin : LOGIN_PATHS.client;
}

/**
 * Resolve the post-login destination.
 *
 * A `next` parameter is honoured only when it points inside the area the role
 * actually has. Otherwise a client arriving via a deep link to /admin/clients
 * would be redirected straight into a page that bounces them back out.
 */
export function destinationFor(role: UserRole, next: string | null): string {
  const home = homeForRole(role);
  if (next && next.startsWith("/") && !next.startsWith("//") && next.startsWith(home)) {
    return next;
  }
  return home;
}
