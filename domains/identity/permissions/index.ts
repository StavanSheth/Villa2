// packages/auth/permissions/index.ts
// Server-Side Role and Permission Checkers for Next.js Server Actions and Pages

import { prisma, User, Role } from "@villa-platform/database";
import { PlatformRole, canUserAccessResource, ForbiddenError } from "@villa-platform/authorization";

export interface AuthUserProfile {
  id: string;
  clerkId?: string;
  email: string;
  name: string;
  role: PlatformRole;
  avatarUrl?: string | null;
  isGuest: boolean;
}

export async function getAuthUser(): Promise<AuthUserProfile> {
  let role: PlatformRole = "CUSTOMER";
  let name = "Demo Customer";

  try {
    const { cookies } = await import("next/headers");
    const cookieStore = await cookies();
    const token = cookieStore.get("access_token")?.value;

    if (token) {
      if (token.includes("demo-admin-jwt")) {
        role = "ADMIN";
        name = "Administrator";
      } else if (token.includes("demo-staff-jwt")) {
        role = "STAFF";
        name = "Staff Member";
      } else if (token.includes("demo-owner-jwt")) {
        role = "OWNER" as PlatformRole; // Note: ensure OWNER is a valid PlatformRole if used
        name = "Villa Owner";
      }
    }
  } catch (e) {
    // Ignore next/headers import errors in non-Next environments
  }

  return {
    id: `demo_${role.toLowerCase()}_id`,
    email: `${role.toLowerCase()}@mavon.online`,
    name,
    role,
    isGuest: role === "CUSTOMER",
  };
}

/**
 * Ensures the user has one of the allowed roles.
 * Throws ForbiddenError if authorization fails.
 */
export async function requireRole(allowedRoles: PlatformRole[]): Promise<AuthUserProfile> {
  const user = await getAuthUser();
  if (!allowedRoles.includes(user.role)) {
    throw new ForbiddenError(
      `Role '${user.role}' is not in allowed roles: [${allowedRoles.join(", ")}]`
    );
  }
  return user;
}

/**
 * Ensures the user has Casbin permission for (resource, action).
 * Throws ForbiddenError if authorization fails.
 */
export async function requirePermission(resource: string, action: string): Promise<AuthUserProfile> {
  const user = await getAuthUser();
  const allowed = canUserAccessResource(user.role, resource, action);
  if (!allowed) {
    throw new ForbiddenError(
      `User with role '${user.role}' is not authorized to perform '${action}' on '${resource}'`
    );
  }
  return user;
}
