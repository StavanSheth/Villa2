// domains/authentication/services/index.ts
// Authentication Domain Service
// Provides identity verification and session handling for pages and APIs

import { verifyAuthToken, getSession, requireAuth, AuthenticatedUser, SessionContext } from "@villa-platform/auth";

export class AuthService {
  /**
   * Verify an authorization token string
   */
  public static async verifyToken(token?: string): Promise<AuthenticatedUser> {
    return verifyAuthToken(token);
  }

  /**
   * Get optional user session from request
   */
  public static async getRequestSession(req: Request): Promise<SessionContext> {
    return getSession(req);
  }

  /**
   * Assert user is authenticated in request
   */
  public static async authenticate(req: Request): Promise<AuthenticatedUser> {
    return requireAuth(req);
  }
}

export type { AuthenticatedUser, SessionContext };
