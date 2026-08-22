// packages/rbac/middleware/index.ts
// RBAC Middleware Helper for Route Handlers and Server Actions
// Ponytail: Simple assertion helper that throws or returns 403 when authorization fails

import { policyEngine } from "../policies/engine";
import { PlatformRole } from "../roles/index";

export class ForbiddenError extends Error {
  constructor(message = "Forbidden: Insufficient permissions for this operation") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Asserts that the given role has permission for the required resource and action.
 * Throws ForbiddenError if evaluation fails.
 */
export function assertPermission(
  role: PlatformRole,
  resource: string,
  action: string
): void {
  const allowed = policyEngine.evaluate(role, resource, action);
  if (!allowed) {
    throw new ForbiddenError(
      `Role '${role}' is not authorized to perform '${action}' on '${resource}'`
    );
  }
}

/**
 * Checks if a role is permitted to perform an action on a resource without throwing.
 */
export function hasPermission(
  role: PlatformRole,
  resource: string,
  action: string
): boolean {
  return policyEngine.evaluate(role, resource, action);
}
