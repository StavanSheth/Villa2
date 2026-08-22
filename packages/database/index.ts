// packages/database/index.ts
// @villa-platform/database entry point
// Ponytail: Singleton PrismaClient to avoid connection exhaust in serverless/dev

import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

// Re-export Prisma Client and all generated types/enums
export { PrismaClient } from "@prisma/client";
export type {
  User,
  Role,
  UserRole,
  Permission,
  RolePermission,
  Session,
  LoginAttempt,
  PasswordHistory,
  AuditLog,
  CasbinRule,
  Villa,
  Booking,
  PaymentTransaction,
  Invoice,
  InvoiceItem,
  Review,
  PricingRule,
  PromoCode,
  ServiceDef,
  BookingService,
  BookingEvent,
} from "@prisma/client";

// Re-export pricing engine (single source of truth)
export { calculateBookingPrice } from "./queries/pricing";
export type { BookingPriceSummary, NightlyPrice, ServiceLineItem, CalculatePriceParams } from "./queries/pricing";

// Re-export booking state machine
export {
  validateTransition,
  validateSideAction,
  getAllowedActions,
  BOOKING_STATES,
  BOOKING_ACTIONS,
  TRANSITIONS,
} from "./queries/booking-state-machine";
export type { BookingStatus, BookingAction, RoleName, TransitionResult } from "./queries/booking-state-machine";
export * from './queries/financial-engine';
export * from './utils/ledger-math';
