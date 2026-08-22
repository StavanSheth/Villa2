import { policyEngine } from "./policies/engine";
import { PlatformRole } from "./roles";

export type { PlatformRole };

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Evaluates whether a user with a specific role can perform an action on a resource.
 * Ponytail: Uses native PolicyEngine instead of heavy Casbin Prisma Adapter.
 */
export async function canUserAccessResource(role: PlatformRole, resource: string, action: string): Promise<boolean> {
  return policyEngine.evaluate(role, resource, action);
}

