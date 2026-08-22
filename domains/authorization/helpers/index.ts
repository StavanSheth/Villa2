// packages/rbac/helpers/index.ts
// Utility Helpers for RBAC validation and UI presentation

import { PlatformRole } from "../roles/index";
import { hasPermission } from "../middleware/index";

/**
 * Convenience wrapper to check permission for an optional or nullable role string.
 * Defaults to "CUSTOMER" if role is undefined or invalid.
 */
export function canUserAccessResource(
  role: string | undefined | null,
  resource: string,
  action: string
): boolean {
  const validRole: PlatformRole = isValidRole(role) ? (role as PlatformRole) : "CUSTOMER";
  return hasPermission(validRole, resource, action);
}

/**
 * Type guard for PlatformRole
 */
export function isValidRole(role: string | undefined | null): role is PlatformRole {
  return role === "SUPER_ADMIN" || role === "ADMIN" || role === "STAFF" || role === "CUSTOMER";
}

/**
 * Returns UI badge color token for each role
 */
export function getRoleBadgeColor(role: PlatformRole): string {
  switch (role) {
    case "SUPER_ADMIN":
      return "bg-purple-500/20 text-purple-300 border-purple-500/30";
    case "ADMIN":
      return "bg-blue-500/20 text-blue-300 border-blue-500/30";
    case "STAFF":
      return "bg-emerald-500/20 text-emerald-300 border-emerald-500/30";
    case "CUSTOMER":
    default:
      return "bg-amber-500/20 text-amber-300 border-amber-500/30";
  }
}
