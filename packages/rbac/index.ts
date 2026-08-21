import { newEnforcer } from 'casbin';
import { PrismaAdapter } from 'casbin-prisma-adapter';
import { prisma } from '@villa-platform/database';
import path from 'path';

let enforcerInstance: any = null;

export async function getEnforcer() {
  if (enforcerInstance) return enforcerInstance;

  // Initialize Prisma Adapter
  const adapter = await PrismaAdapter.newAdapter();
  
  // Initialize Casbin Enforcer with model and adapter
  const modelPath = path.resolve(__dirname, './rbac_model.conf');
  const enforcer = await newEnforcer(modelPath, adapter);
  
  // Load policies from DB
  await enforcer.loadPolicy();

  enforcerInstance = enforcer;
  return enforcerInstance;
}

export async function enforce(sub: string, dom: string, obj: string, act: string): Promise<boolean> {
  const enforcer = await getEnforcer();
  return enforcer.enforce(sub, dom, obj, act);
}

export type PlatformRole = "SUPER_ADMIN" | "ADMIN" | "STAFF" | "OWNER" | "CUSTOMER" | "GUEST";

export class ForbiddenError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ForbiddenError";
  }
}

/**
 * Evaluates whether a user with a specific role can perform an action on a resource.
 * Integrates with Casbin to check fine-grained permissions.
 * 
 * Examples of granular permissions in Casbin DB/Policy:
 * p, STAFF, Booking, read
 * p, STAFF, Payment, verify
 * p, ADMIN, Villa, edit
 * p, ADMIN, Refund, create
 */
export async function canUserAccessResource(role: PlatformRole, resource: string, action: string): Promise<boolean> {
  try {
    // Check using Casbin enforcer
    return await enforce(role, "tenant_domain", resource, action);
  } catch (error) {
    console.error("RBAC Enforce Error:", error);
    
    // Fallback static implementation if Casbin is not initialized or fails
    if (role === "SUPER_ADMIN" || role === "ADMIN") return true;
    if (role === "STAFF") {
      const allowedStaffActions = ["read", "verify", "checkin", "checkout", "create_invoice"];
      return allowedStaffActions.includes(action) && resource !== "Villa" && resource !== "Analytics";
    }
    return false;
  }
}

