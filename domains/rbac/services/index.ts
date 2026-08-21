// domains/rbac/services/index.ts
// RBAC Domain Service
// Provides higher-level authorization checks and audit logging integration for apps

import { policyEngine, PlatformRole, assertPermission, ForbiddenError } from "@villa-platform/rbac";

export interface AuthorizeRequest {
  userRole: PlatformRole;
  resource: string;
  action: string;
}

export class RbacService {
  /**
   * Authorize a request against the platform policy engine.
   * Throws ForbiddenError if unauthorized.
   */
  public static authorize(req: AuthorizeRequest): void {
    assertPermission(req.userRole, req.resource, req.action);
  }

  /**
   * Check permission without throwing
   */
  public static can(userRole: PlatformRole, resource: string, action: string): boolean {
    return policyEngine.evaluate(userRole, resource, action);
  }

  /**
   * List permissions assigned to a role
   */
  public static listPermissions(role: PlatformRole) {
    return policyEngine.getPermissionsForRole(role);
  }
}

export { ForbiddenError };
