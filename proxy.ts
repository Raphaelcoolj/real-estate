/* ---------------------------------------------------------------------------
 * Proxy (formerly middleware) — early route protection.
 * Runs before rendering; verifies the session JWT only (no DB access here).
 * Authoritative role/ownership checks happen server-side in layouts, pages,
 * Server Actions and Route Handlers.
 * ------------------------------------------------------------------------ */

import { NextResponse, type NextRequest } from "next/server";
import { SESSION_COOKIE, verifySessionToken } from "@/lib/session-core";

export async function proxy(request: NextRequest): Promise<NextResponse> {
  const { pathname, search } = request.nextUrl;

  const token = request.cookies.get(SESSION_COOKIE)?.value;
  const session = token ? await verifySessionToken(token) : null;

  const isDashboard = pathname === "/dashboard" || pathname.startsWith("/dashboard/");
  const isAuthPage = pathname === "/sign-in" || pathname === "/sign-up";

  if (isDashboard && !session) {
    const url = request.nextUrl.clone();
    url.pathname = "/sign-in";
    url.search = `?next=${encodeURIComponent(pathname + search)}`;
    return NextResponse.redirect(url);
  }

  if (isAuthPage && session) {
    const url = request.nextUrl.clone();
    url.pathname = "/dashboard";
    url.search = "";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dashboard/:path*", "/sign-in", "/sign-up"],
};
