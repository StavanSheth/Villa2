// packages/rbac/roles/index.ts
// Platform Role Definitions and Default Policy Ledger
// Ponytail: Matches Prisma Role enum exactly. Wildcard (*) matching.

export type PlatformRole = "SUPER_ADMIN" | "ADMIN" | "STAFF" | "CUSTOMER";

export interface PolicyRule {
  role: PlatformRole;
  resource: string;
  action: string;
}

// Default system RBAC policy rules — matches user spec exactly
export const DEFAULT_POLICY_RULES: PolicyRule[] = [
  // ── SUPER_ADMIN: God mode ─────────────────────────────────
  { role: "SUPER_ADMIN", resource: "*", action: "*" },

  // ── ADMIN ─────────────────────────────────────────────────
  { role: "ADMIN", resource: "villas", action: "*" },
  { role: "ADMIN", resource: "pricing", action: "*" },
  { role: "ADMIN", resource: "coupons", action: "*" },
  { role: "ADMIN", resource: "bookings", action: "*" },
  { role: "ADMIN", resource: "payments", action: "*" },
  { role: "ADMIN", resource: "refunds", action: "*" },
  { role: "ADMIN", resource: "invoices", action: "*" },
  { role: "ADMIN", resource: "staff", action: "*" },
  { role: "ADMIN", resource: "customers", action: "*" },
  { role: "ADMIN", resource: "reviews", action: "*" },
  { role: "ADMIN", resource: "reports", action: "read" },
  { role: "ADMIN", resource: "analytics", action: "read" },
  { role: "ADMIN", resource: "settings", action: "*" },
  { role: "ADMIN", resource: "audit_logs", action: "read" },
  { role: "ADMIN", resource: "email_templates", action: "*" },
  { role: "ADMIN", resource: "cms", action: "*" },

  // ── STAFF ─────────────────────────────────────────────────
  { role: "STAFF", resource: "bookings", action: "read" },
  { role: "STAFF", resource: "bookings", action: "checkin" },
  { role: "STAFF", resource: "bookings", action: "checkout" },
  { role: "STAFF", resource: "bookings", action: "mark_completed" },
  { role: "STAFF", resource: "payments", action: "collect_cash" },
  { role: "STAFF", resource: "payments", action: "verify_upi" },
  { role: "STAFF", resource: "payments", action: "upload_proof" },
  { role: "STAFF", resource: "invoices", action: "generate" },
  { role: "STAFF", resource: "invoices", action: "read" },
  { role: "STAFF", resource: "customers", action: "read" },
  { role: "STAFF", resource: "villas", action: "read" },

  // ── CUSTOMER ──────────────────────────────────────────────
  { role: "CUSTOMER", resource: "villas", action: "read" },
  { role: "CUSTOMER", resource: "villas", action: "search" },
  { role: "CUSTOMER", resource: "bookings", action: "create" },
  { role: "CUSTOMER", resource: "bookings", action: "read_own" },
  { role: "CUSTOMER", resource: "bookings", action: "cancel_own" },
  { role: "CUSTOMER", resource: "payments", action: "create" },
  { role: "CUSTOMER", resource: "payments", action: "read_own" },
  { role: "CUSTOMER", resource: "invoices", action: "read_own" },
  { role: "CUSTOMER", resource: "invoices", action: "download" },
  { role: "CUSTOMER", resource: "reviews", action: "create" },
  { role: "CUSTOMER", resource: "reviews", action: "read" },
  { role: "CUSTOMER", resource: "profile", action: "*" },
  { role: "CUSTOMER", resource: "order_history", action: "read" },
  { role: "CUSTOMER", resource: "wishlist", action: "*" },
  { role: "CUSTOMER", resource: "support_tickets", action: "*" },
  { role: "CUSTOMER", resource: "notifications", action: "read" },
];
