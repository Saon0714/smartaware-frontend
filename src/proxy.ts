/**
 * Next.js Proxy (renamed from Middleware in Next.js 16).
 *
 * Must live beside `app/` — with the App Router under `src/`, that means
 * `src/proxy.ts`. At the repository root it is silently ignored.
 *
 * Redirects anonymous visitors away from portal and admin routes before the
 * page renders, so they see a login screen rather than a flash of empty
 * layout, and land on the tab matching where they were going.
 *
 * It checks only that a refresh cookie EXISTS. It cannot validate one — the
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
  if (request.cookies.has(REFRESH_COOKIE)) {
    return NextResponse.next();
  }

  const pathname = request.nextUrl.pathname;
  const target = pathname.startsWith("/admin") ? "/login/admin" : "/login/client";

  const login = new URL(target, request.url);
  login.searchParams.set("next", pathname);
  return NextResponse.redirect(login);
}

export const config = {
  matcher: ["/portal/:path*", "/admin/:path*"],
};
