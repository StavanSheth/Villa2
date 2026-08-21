// packages/auth/session/index.ts
// Session Context and Request Authenticator
// Ponytail: Extracts user session from HTTP requests for pages and APIs

import { verifyAuthToken, AuthenticatedUser } from "../jwt/verifier";

export interface SessionContext {
  user: AuthenticatedUser | null;
  isAuthenticated: boolean;
}

/**
 * Extracts and verifies the user session from an HTTP Request object.
 * Returns null user if unauthenticated rather than throwing.
 */
export async function getSession(request: Request): Promise<SessionContext> {
  const authHeader = request.headers.get("authorization") || undefined;
  if (!authHeader) {
    return { user: null, isAuthenticated: false };
  }

  try {
    const user = await verifyAuthToken(authHeader);
    return { user, isAuthenticated: true };
  } catch {
    return { user: null, isAuthenticated: false };
  }
}

/**
 * Asserts authentication for protected route handlers.
 * Throws Error if user is not authenticated.
 */
export async function requireAuth(request: Request): Promise<AuthenticatedUser> {
  const session = await getSession(request);
  if (!session.isAuthenticated || !session.user) {
    throw new Error("Unauthorized: Authentication required");
  }
  return session.user;
}
