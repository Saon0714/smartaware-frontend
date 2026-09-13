/**
 * Next.js Proxy (renamed from Middleware in Next.js 16).
 *
 * Redirects anonymous visitors away from portal and admin routes before the
 * page renders, purely so they see the login screen instead of a flash of
 * empty layout.
 *
 * It checks only that a refresh cookie EXISTS. It cannot validate it — the
 * signing secret lives in the backend — and the Next.js documentation is
 * explicit that Proxy "should not be used as a full session management or
 * authorization solution". The real boundary is the API: every request the
 * portal makes is authorised server-side, so forging this cookie grants
 * nothing.
 */

import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const REFRESH_COOKIE = "smartaware_refresh";

export function proxy(request: NextRequest) {
  const hasSession = request.cookies.has(REFRESH_COOKIE);

  if (!hasSession) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(login);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/portal/:path*", "/admin/:path*"],
};
