// packages/types/booking-engine.types.ts
// Booking Engine — Shared Types & Rules
// ponytail: One lookup table drives all behavioral differences across booking modes.
// No class hierarchy, no strategy pattern — just a Record.

// ── Booking Engine Mode ──
export type BookingMode = 'CUSTOMER' | 'OWNER' | 'STAFF';

// ── Booking Types ──
export type BookingType =
  | 'NORMAL'
  | 'OWNER'
  | 'VIP'
  | 'PRIVATE'
  | 'MAINTENANCE'
  | 'BLOCKED'
  | 'OFFLINE'
  | 'CORPORATE';

export const ALL_BOOKING_TYPES: BookingType[] = [
  'NORMAL', 'OWNER', 'VIP', 'PRIVATE',
  'MAINTENANCE', 'BLOCKED', 'OFFLINE', 'CORPORATE',
];

// ── Booking Source ──
export type BookingSource =
  | 'CUSTOMER' | 'OWNER' | 'STAFF'
  | 'WEBSITE' | 'API' | 'WALK_IN'
  | 'PHONE' | 'CORPORATE' | 'OTA';

// ── Booking Status (State Machine states) ──
export type BookingStatus =
  | 'DRAFT' | 'PENDING' | 'AWAITING_PAYMENT'
  | 'ADVANCE_PAID' | 'FULLY_PAID' | 'CONFIRMED'
  | 'UPCOMING' | 'CHECKED_IN' | 'CHECKED_OUT'
  | 'COMPLETED' | 'REVIEWED' | 'ARCHIVED'
  | 'CANCELLED';

// ── Calendar Legend ──
export type CalendarEntryType =
  | 'AVAILABLE'         // Green
  | 'CUSTOMER'          // Red
  | 'OWNER'             // Dark Green
  | 'MAINTENANCE'       // Yellow
  | 'BLOCKED'           // Gray
  | 'HOLIDAY'           // Purple
  | 'TODAY'             // Blue
  | 'PENDING_PAYMENT';  // Orange

// ── Refund Policy Types ──
export type RefundType =
  | 'FULL_REFUND'
  | 'VILLA_AMOUNT_ONLY'
  | 'PERCENTAGE_BASED'
  | 'CUSTOM_RULES';

// ── Calendar Color Map ──
export const CALENDAR_COLORS: Record<CalendarEntryType, string> = {
  AVAILABLE:       'bg-green-500/20 border-green-500/30 text-green-400',
  CUSTOMER:        'bg-red-500/20 border-red-500/30 text-red-400',
  OWNER:           'bg-emerald-700/30 border-emerald-500/40 text-emerald-300',
  MAINTENANCE:     'bg-yellow-500/20 border-yellow-500/30 text-yellow-400',
  BLOCKED:         'bg-neutral-500/20 border-neutral-500/30 text-neutral-400',
  HOLIDAY:         'bg-purple-500/20 border-purple-500/30 text-purple-400',
  TODAY:           'bg-blue-500/20 border-blue-500/30 text-blue-400',
  PENDING_PAYMENT: 'bg-orange-500/20 border-orange-500/30 text-orange-400',
};

// ── Booking Type Rules ──
// The single source of truth for how each booking type behaves.
// Used by: BookingEngineService, BookingWizard, Calendar, Reports, Notifications
export interface BookingTypeRules {
  paymentRequired: boolean;
  paymentStepVisible: boolean;
  promoEnabled: boolean;
  autoConfirm: boolean;
  calendarColor: CalendarEntryType;
  customerNotification: boolean;
  includeInRevenue: boolean;
  includeInOccupancy: boolean;
  label: string;
  description: string;
}

export const BOOKING_TYPE_RULES: Record<BookingType, BookingTypeRules> = {
  NORMAL: {
    paymentRequired: true,
    paymentStepVisible: true,
    promoEnabled: true,
    autoConfirm: false,
    calendarColor: 'CUSTOMER',
    customerNotification: true,
    includeInRevenue: true,
    includeInOccupancy: true,
    label: 'Normal Customer Booking',
    description: 'Standard booking with payment via Razorpay.',
  },
  OWNER: {
    paymentRequired: false,
    paymentStepVisible: false,
    promoEnabled: false,
    autoConfirm: true,
    calendarColor: 'OWNER',
    customerNotification: false,
    includeInRevenue: false,
    includeInOccupancy: true,
    label: 'Owner Stay',
    description: 'Personal owner stay. No payment, auto-confirmed.',
  },
  VIP: {
    paymentRequired: false,
    paymentStepVisible: true,
    promoEnabled: false,
    autoConfirm: true,
    calendarColor: 'CUSTOMER',
    customerNotification: true,
    includeInRevenue: true,
    includeInOccupancy: true,
    label: 'VIP Guest',
    description: 'VIP booking. Payment and invoice optional.',
  },
  PRIVATE: {
    paymentRequired: false,
    paymentStepVisible: false,
    promoEnabled: false,
    autoConfirm: true,
    calendarColor: 'OWNER',
    customerNotification: false,
    includeInRevenue: false,
    includeInOccupancy: true,
    label: 'Private Guest',
    description: 'Friends/family stay. No payment required.',
  },
  MAINTENANCE: {
    paymentRequired: false,
    paymentStepVisible: false,
    promoEnabled: false,
    autoConfirm: true,
    calendarColor: 'MAINTENANCE',
    customerNotification: false,
    includeInRevenue: false,
    includeInOccupancy: true,
    label: 'Maintenance',
    description: 'Block dates for cleaning, repair, or maintenance work.',
  },
  BLOCKED: {
    paymentRequired: false,
    paymentStepVisible: false,
    promoEnabled: false,
    autoConfirm: true,
    calendarColor: 'BLOCKED',
    customerNotification: false,
    includeInRevenue: false,
    includeInOccupancy: true,
    label: 'Blocked Dates',
    description: 'Block dates from customer booking. Cannot be reserved.',
  },
  OFFLINE: {
    paymentRequired: false,
    paymentStepVisible: true,
    promoEnabled: false,
    autoConfirm: true,
    calendarColor: 'CUSTOMER',
    customerNotification: true,
    includeInRevenue: true,
    includeInOccupancy: true,
    label: 'Offline / Walk-in Booking',
    description: 'Manual booking. Payment collected offline.',
  },
  CORPORATE: {
    paymentRequired: true,
    paymentStepVisible: true,
    promoEnabled: true,
    autoConfirm: false,
    calendarColor: 'CUSTOMER',
    customerNotification: true,
    includeInRevenue: true,
    includeInOccupancy: true,
    label: 'Corporate Booking',
    description: 'Corporate/business booking with invoice.',
  },
};

// ── Owner Booking Type Dropdown Options ──
// Subset of booking types available to owners in the wizard
export const OWNER_BOOKING_TYPES: BookingType[] = [
  'NORMAL', 'OWNER', 'PRIVATE', 'MAINTENANCE',
  'BLOCKED', 'VIP', 'OFFLINE', 'CORPORATE',
];

// ── Settings key → BookingType guard map ──
// Maps VillaBookingSettings toggles to the booking types they gate
export const BOOKING_SETTINGS_GUARDS: Record<string, BookingType[]> = {
  allowOfflineBooking:    ['OFFLINE'],
  allowMaintenanceBlock:  ['MAINTENANCE'],
  allowPrivateGuest:      ['PRIVATE'],
  allowVipBooking:        ['VIP'],
};

// ── Refund Policy Snapshot shape (stored as JSON on Booking) ──
export interface RefundPolicySnapshot {
  policyId: string;
  name: string;
  refundType: RefundType;
  refundGatewayFee: boolean;
  refundGst: boolean;
  refundPlatformFee: boolean;
  slabs: Array<{
    minHoursBefore: number;
    maxHoursBefore: number;
    refundPercent: number;
  }>;
  snapshotAt: string; // ISO timestamp
}

// ── Refund Calculation Result ──
export interface RefundCalculation {
  hoursBeforeCheckIn: number;
  matchedSlab: { minHoursBefore: number; maxHoursBefore: number; refundPercent: number } | null;
  villaAmountRefund: number;
  gatewayFeeRefund: number;
  gstRefund: number;
  platformFeeRefund: number;
  totalRefund: number;
  deductions: number;
}

// ── Calendar Entry (for ReservationGrid) ──
export interface CalendarBookingEntry {
  bookingId: string;
  bookingCode: string;
  checkIn: string;    // ISO date
  checkOut: string;   // ISO date
  type: CalendarEntryType;
  bookingType: BookingType;
  label?: string;     // Guest name or booking reason
  status: BookingStatus;
  selectedDates?: string[];
}
