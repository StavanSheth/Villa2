// packages/validation/index.ts
// Shared Zod Validation Schemas
// Ponytail: Standardized schemas for Bookings, Availability, Payments, Refund Policies across apps

import { z } from "zod";

// ── Booking Type & Source Enums ──
export const BookingTypeEnum = z.enum([
  'NORMAL', 'OWNER', 'VIP', 'PRIVATE',
  'MAINTENANCE', 'BLOCKED', 'OFFLINE', 'CORPORATE',
]);

export const BookingSourceEnum = z.enum([
  'CUSTOMER', 'OWNER', 'STAFF', 'WEBSITE',
  'API', 'WALK_IN', 'PHONE', 'CORPORATE', 'OTA',
]);

export const BookingModeEnum = z.enum(['CUSTOMER', 'OWNER', 'STAFF']);

// ── Availability ──
export const CheckAvailabilitySchema = z.object({
  villaId: z.string().min(1, "Villa ID is required"),
  checkIn: z.string().datetime({ message: "Invalid check-in date string" }),
  checkOut: z.string().datetime({ message: "Invalid check-out date string" }),
  numGuests: z.number().int().positive().min(1),
});

// ── Create Booking (Unified — works for all modes) ──
export const CreateBookingSchema = CheckAvailabilitySchema.extend({
  userId: z.string().min(1, "User ID is required"),
  couponCode: z.string().optional(),
  // Booking Engine fields
  bookingType: BookingTypeEnum.default('NORMAL'),
  bookingSource: BookingSourceEnum.default('WEBSITE'),
  bookingMode: BookingModeEnum.default('CUSTOMER'),
  paymentRequired: z.boolean().default(true),
  bookingReason: z.string().optional(),
  internalNotes: z.string().optional(),
  guestProfileId: z.string().optional(),
  // Payment
  paymentType: z.enum(['FULL', 'ADVANCE']).optional(),
  selectedServices: z.array(z.object({ serviceDefId: z.string() })).optional(),
});

// ── Cancel Booking ──
export const CancelBookingSchema = z.object({
  bookingId: z.string().min(1, "Booking ID is required"),
  reason: z.string().optional(),
});

// ── Refund Policy Builder ──
export const RefundSlabSchema = z.object({
  minHoursBefore: z.number().int().min(0),
  maxHoursBefore: z.number().int().min(0),
  refundPercent: z.number().min(0).max(100),
});

export const CreateRefundPolicySchema = z.object({
  villaId: z.string().min(1),
  name: z.string().min(1).default("Default Policy"),
  refundType: z.enum(['FULL_REFUND', 'VILLA_AMOUNT_ONLY', 'PERCENTAGE_BASED', 'CUSTOM_RULES']),
  refundGatewayFee: z.boolean().default(true),
  refundGst: z.boolean().default(true),
  refundPlatformFee: z.boolean().default(true),
  slabs: z.array(RefundSlabSchema).optional(),
});

// ── Villa Booking Settings ──
export const VillaBookingSettingsSchema = z.object({
  villaId: z.string().min(1),
  allowOfflineBooking: z.boolean().default(true),
  allowMaintenanceBlock: z.boolean().default(true),
  allowPrivateGuest: z.boolean().default(true),
  allowVipBooking: z.boolean().default(true),
  requireInvoice: z.boolean().default(false),
  requireCustomerProfile: z.boolean().default(false),
});

// ── Guest Profile ──
export const GuestProfileSchema = z.object({
  name: z.string().min(1, "Guest name is required"),
  email: z.string().email().optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

// ── Inferred Types ──
export type CheckAvailabilityInput = z.infer<typeof CheckAvailabilitySchema>;
export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;
export type CancelBookingInput = z.infer<typeof CancelBookingSchema>;
export type CreateRefundPolicyInput = z.infer<typeof CreateRefundPolicySchema>;
export type VillaBookingSettingsInput = z.infer<typeof VillaBookingSettingsSchema>;
export type GuestProfileInput = z.infer<typeof GuestProfileSchema>;
