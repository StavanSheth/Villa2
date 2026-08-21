// packages/auth/middleware/auth-middleware.ts
// Route Protection Middleware Helper for Next.js

import { NextRequest, NextResponse } from "next/server";

export const PROTECTED_ROUTE_PREFIXES = [
  "/dashboard",
  "/admin",
  "/staff",
  "/book",
  "/bookings",
  "/invoices",
  "/payments",
  "/profile",
  "/support",
];

/**
 * Checks whether a pathname matches a protected dashboard route prefix.
 */
export function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTE_PREFIXES.some((prefix) =>
    pathname.startsWith(prefix)
  );
}

/**
 * Middleware helper to redirect unauthenticated visitors to /login
 */
export function handleAuthRedirect(
  request: NextRequest,
  isAuthenticated: boolean
): NextResponse | null {
  const { pathname } = request.nextUrl;

  if (isProtectedRoute(pathname) && !isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    loginUrl.searchParams.set("redirect_url", request.url);
    return NextResponse.redirect(loginUrl);
  }

  return null;
}
