// @ts-nocheck
// domains/bookings/services/booking-engine.service.ts
// Booking Engine Service — The single orchestrator for ALL booking modes
// ponytail: Reads BOOKING_TYPE_RULES once, routes everything through the same pipeline.
// No mode-specific classes, no strategy pattern — just one service with rule lookups.

import { prisma } from '@villa-platform/database';
import {
  BOOKING_TYPE_RULES,
  BOOKING_SETTINGS_GUARDS,
  type BookingMode,
  type BookingType,
  type BookingSource,
  type RefundPolicySnapshot,
} from '@villa-platform/types';
import { BookingsRepository } from '../repositories/index';
import { RefundPolicyRepository } from '../repositories/refund-policy.repository';
import { getInitialStatus, validateTransition, isCancellable } from './booking-state-machine';
import { RefundEngineService } from './refund-engine.service';
import { shouldNotify, type NotificationEvent } from '../../notifications/booking-notification.rules';

// ── Input ──
export interface CreateBookingEngineInput {
  mode: BookingMode;
  bookingType: BookingType;
  bookingSource: BookingSource;
  villaId: string;
  userId: string;           // Authenticated user (owner, customer, or staff)
  checkIn: string;          // ISO datetime
  checkOut: string;         // ISO datetime
  numGuests: number;
  paymentRequired?: boolean; // Override from owner toggle
  paymentType?: 'FULL' | 'ADVANCE';
  bookingReason?: string;
  internalNotes?: string;
  guestProfileId?: string;
  selectedServices?: Array<{ serviceDefId: string }>;
  promoCode?: string;
  specialReqs?: string;
  idempotencyKey?: string;
}

// ── Output ──
export interface BookingEngineResult {
  booking: any;
  rules: typeof BOOKING_TYPE_RULES[BookingType];
  requiresPayment: boolean;
  notifications: NotificationEvent[];
}

export class BookingEngineService {
  /**
   * Create a booking through the unified engine.
   * Same entry point for Customer, Owner, and Staff modes.
   */
  public static async createBooking(input: CreateBookingEngineInput): Promise<BookingEngineResult> {
    const rules = BOOKING_TYPE_RULES[input.bookingType];
    if (!rules) {
      throw new Error(`Unknown booking type: ${input.bookingType}`);
    }

    const { default: crypto } = await import('node:crypto');
    const requestFingerprint = crypto.createHash('sha256').update(JSON.stringify(input)).digest('hex');

    if (input.idempotencyKey) {
      const existing = await prisma.booking.findUnique({
        where: { idempotencyKey: input.idempotencyKey }
      });
      if (existing) {
        if (existing.requestFingerprint !== requestFingerprint) {
          throw new Error('Idempotency key reused with different payload');
        }
        // Return existing booking
        const requiresPayment = input.paymentRequired !== undefined ? input.paymentRequired : rules.paymentRequired;
        return {
          booking: existing,
          rules,
          requiresPayment,
          notifications: [], // Notifications already sent for existing booking
        };
      }
    }

    // ── Step 1: Validate villa booking settings (owner-gated types) ──
    if (input.mode === 'OWNER' || input.mode === 'STAFF') {
      await this.validateVillaSettings(input.villaId, input.bookingType);
    }

    // ── Step 2: Check date availability ──
    const checkIn = new Date(input.checkIn);
    const checkOut = new Date(input.checkOut);
    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime()) || checkIn >= checkOut) {
      throw new Error('Invalid check-in or check-out dates');
    }

    // ── Execute wrapped in a Serializable Transaction with Retry ──
    let retries = 0;
    const MAX_RETRIES = 3;
    let transactionResult: { booking: any; refundPolicySnapshot: any };

    while (true) {
      try {
        transactionResult = await prisma.$transaction(async (tx) => {
      const hasOverlap = await BookingsRepository.hasOverlappingBookings(
        input.villaId,
        checkIn,
        checkOut,
        undefined,
        tx,
        input.userId
      );
      if (hasOverlap) {
        throw new Error('Villa is already booked for these dates');
      }

      // ── Step 3: Determine payment requirement ──
      // Owner can override payment toggle for types that show the payment step
      const requiresPayment = input.paymentRequired !== undefined
        ? input.paymentRequired
        : rules.paymentRequired;

      // ── Step 4: Snapshot refund policy (frozen at booking time) ──
      let policySnapshot: RefundPolicySnapshot | null = null;
      if (requiresPayment) {
        policySnapshot = await RefundPolicyRepository.snapshotForBooking(input.villaId, tx);
      }

      // ── Step 5: Determine initial status ──
      const initialStatus = getInitialStatus(rules.autoConfirm, requiresPayment);

      // ── Step 6: Calculate num nights ──
      const numNights = Math.round(
        (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24),
      );

      // ── Step 7: Generate booking code ──
      const bookingCode = `MVN-${Math.floor(100000 + Math.random() * 900000)}`;

      // ── Step 8: Resolve createdByRole ──
      const createdByRole = input.mode === 'CUSTOMER' ? 'CUSTOMER'
        : input.mode === 'OWNER' ? 'OWNER'
        : 'STAFF';

      // ── Step 9: Validate promo code eligibility ──
      if (input.promoCode && !rules.promoEnabled) {
        // ponytail: silently ignore promo for owner bookings rather than throwing
        input.promoCode = undefined;
      }

      // ── Step 10: Create booking record ──
      const newBooking = await tx.booking.create({
        data: {
          bookingCode,
          villaId: input.villaId,
          userId: input.userId,
          checkIn,
          checkOut,
          totalGuests: input.numGuests,
          totalAmount: 0,   // Will be updated by pricing calculation
          paidAmount: 0,
          status: initialStatus,
          paymentType: requiresPayment ? (input.paymentType || 'FULL') : null,
          specialReqs: input.specialReqs || null,

          // Booking engine fields
          bookingType: input.bookingType,
          bookingSource: input.bookingSource,
          createdByUserId: input.userId,
          createdByRole,
          paymentRequired: requiresPayment,
          requestFingerprint,
          idempotencyKey: input.idempotencyKey || null,
          bookingReason: input.bookingReason || null,
          internalNotes: input.internalNotes || null,
          refundPolicySnapshot: policySnapshot as any,
          guestProfileId: input.guestProfileId || null,
        },
      });

      // ── Step 11: Create audit event ──
      await tx.bookingEvent.create({
        data: {
          bookingId: newBooking.id,
          actorId: input.userId,
          actorRole: createdByRole,
          action: 'CREATE',
          oldState: null,
          newState: initialStatus,
          metadata: {
            bookingType: input.bookingType,
            bookingSource: input.bookingSource,
            mode: input.mode,
            reason: input.bookingReason || null,
            refundPolicyId: policySnapshot?.policyId || null,
          },
        },
      });

      // ── Step 11b: Transactional Outbox for Notifications ──
      if (shouldNotify('BOOKING_CREATED', input.bookingType, input.mode)) {
        await tx.outboxEvent.create({
          data: {
            type: 'BOOKING_CREATED',
            payload: {
              bookingId: newBooking.id,
              bookingCode: newBooking.bookingCode,
              bookingType: input.bookingType,
              mode: input.mode,
            },
          }
        });
      }

      return { booking: newBooking, refundPolicySnapshot: policySnapshot };
    }, {
      isolationLevel: 'Serializable'
    });
        break; // Success
      } catch (error: any) {
        if (error.code === 'P2034' && retries < MAX_RETRIES) {
          retries++;
          const delay = Math.pow(2, retries) * 50 + Math.random() * 50;
          await new Promise(res => setTimeout(res, delay));
          continue;
        }
        throw error;
      }
    }

    const { booking, refundPolicySnapshot } = transactionResult;

    const requiresPayment = input.paymentRequired !== undefined
      ? input.paymentRequired
      : rules.paymentRequired;

    return {
      booking,
      rules,
      requiresPayment,
      notifications: [], // Return empty, now handled by Outbox
    };
  }

  /**
   * Transition a booking to a new status with validation.
   */
  public static async transitionStatus(
    bookingId: string,
    newStatus: string,
    actorId: string,
    actorRole: string,
    metadata?: Record<string, any>,
  ) {
    const booking = await prisma.booking.findUniqueOrThrow({
      where: { id: bookingId },
      include: { villa: true },
    });

    if (actorRole === 'CUSTOMER') {
      throw new Error('Unauthorized: Customers cannot manually transition booking status');
    }

    if (actorRole === 'OWNER' && booking.villa.ownerId !== actorId) {
      throw new Error('Unauthorized: Owners can only manage bookings for their own villas');
    }

    const validatedStatus = validateTransition(
      booking.status as any,
      newStatus as any,
    );

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: { status: validatedStatus },
    });

    await prisma.bookingEvent.create({
      data: {
        bookingId,
        actorId,
        actorRole,
        action: `STATUS_CHANGE`,
        oldState: booking.status,
        newState: validatedStatus,
        metadata: metadata || null,
      },
    });

    return updated;
  }

  /**
   * Cancel a booking with refund calculation.
   */
  public static async cancelBooking(
    bookingId: string,
    actorId: string,
    actorRole: string,
    reason?: string,
  ) {
    const booking = await prisma.booking.findUniqueOrThrow({
      where: { id: bookingId },
      include: { villa: true },
    });

    if (actorRole === 'CUSTOMER' && booking.userId !== actorId) {
      throw new Error('Unauthorized to cancel this booking');
    }

    if (actorRole === 'OWNER' && booking.villa.ownerId !== actorId) {
      throw new Error('Unauthorized: Owners can only cancel bookings for their own villas');
    }

    if (!isCancellable(booking.status as any)) {
      throw new Error(`Booking ${bookingId} cannot be cancelled from status ${booking.status}`);
    }

    // Calculate refund if payment was made
    let refundCalc = null;
    if (Number(booking.paidAmount) > 0 && booking.refundPolicySnapshot) {
      refundCalc = RefundEngineService.calculateRefund(
        booking.refundPolicySnapshot as unknown as RefundPolicySnapshot,
        {
          totalAmount: Number(booking.totalAmount),
          paidAmount: Number(booking.paidAmount),
          gstAmount: Number(booking.gstAmount),
          platformFee: Number(booking.platformFee),
          gatewayFee: 0, // ponytail: gatewayFee not stored on booking yet, use 0
          cleaningFee: Number(booking.cleaningFee),
          discountAmount: Number(booking.discountAmount),
          checkIn: booking.checkIn,
        },
      );
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        status: 'CANCELLED',
        cancellationRefund: refundCalc?.totalRefund || 0,
      },
    });

    await prisma.bookingEvent.create({
      data: {
        bookingId,
        actorId,
        actorRole,
        action: 'CANCEL',
        oldState: booking.status,
        newState: 'CANCELLED',
        metadata: {
          reason,
          refund: refundCalc,
        },
      },
    });

    return { booking: updated, refund: refundCalc };
  }

  /**
   * Convert a booking from one type to another (e.g., Owner → Customer).
   */
  public static async convertBookingType(
    bookingId: string,
    newType: BookingType,
    actorId: string,
    actorRole: string,
  ) {
    const booking = await prisma.booking.findUniqueOrThrow({
      where: { id: bookingId },
      include: { villa: true },
    });

    if (actorRole === 'CUSTOMER') {
      throw new Error('Unauthorized: Customers cannot convert booking types');
    }

    if (actorRole === 'OWNER' && booking.villa.ownerId !== actorId) {
      throw new Error('Unauthorized: Owners can only convert bookings for their own villas');
    }

    const oldType = booking.bookingType;
    const newRules = BOOKING_TYPE_RULES[newType];

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        bookingType: newType,
        paymentRequired: newRules.paymentRequired,
      },
    });

    await prisma.bookingEvent.create({
      data: {
        bookingId,
        actorId,
        actorRole,
        action: 'CONVERT_TYPE',
        metadata: {
          oldType,
          newType,
          oldPaymentRequired: booking.paymentRequired,
          newPaymentRequired: newRules.paymentRequired,
        },
      },
    });

    return updated;
  }

  /**
   * Add internal notes to a booking (owner/staff only).
   */
  public static async addInternalNotes(
    bookingId: string,
    notes: string,
    actorId: string,
    actorRole: string,
  ) {
    const booking = await prisma.booking.findUniqueOrThrow({
      where: { id: bookingId },
      include: { villa: true },
    });

    if (actorRole === 'CUSTOMER') {
      throw new Error('Unauthorized: Customers cannot add internal notes');
    }

    if (actorRole === 'OWNER' && booking.villa.ownerId !== actorId) {
      throw new Error('Unauthorized: Owners can only add notes to bookings for their own villas');
    }

    // Append to existing notes
    const existingNotes = booking.internalNotes || '';
    const timestamp = new Date().toISOString();
    const newNotes = existingNotes
      ? `${existingNotes}\n\n[${timestamp}] ${actorRole}: ${notes}`
      : `[${timestamp}] ${actorRole}: ${notes}`;

    return prisma.booking.update({
      where: { id: bookingId },
      data: { internalNotes: newNotes },
    });
  }

  /**
   * Assign staff or caretaker to a booking.
   */
  public static async assignStaff(
    bookingId: string,
    staffId: string | null,
    caretakerId: string | null,
    actorId: string,
    actorRole: string,
  ) {
    const booking = await prisma.booking.findUniqueOrThrow({
      where: { id: bookingId },
      include: { villa: true },
    });

    if (actorRole === 'CUSTOMER') {
      throw new Error('Unauthorized: Customers cannot assign staff');
    }

    if (actorRole === 'OWNER' && booking.villa.ownerId !== actorId) {
      throw new Error('Unauthorized: Owners can only assign staff for their own villas');
    }

    const updated = await prisma.booking.update({
      where: { id: bookingId },
      data: {
        ...(staffId !== undefined ? { assignedStaffId: staffId } : {}),
        ...(caretakerId !== undefined ? { assignedCaretakerId: caretakerId } : {}),
      },
    });

    await prisma.bookingEvent.create({
      data: {
        bookingId,
        actorId,
        actorRole,
        action: 'ASSIGN_STAFF',
        metadata: { staffId, caretakerId },
      },
    });

    return updated;
  }

  // ── Private Helpers ──

  /**
   * Validate that the villa's booking settings allow this booking type.
   */
  private static async validateVillaSettings(villaId: string, bookingType: BookingType) {
    const settings = await prisma.villaBookingSettings.findUnique({
      where: { villaId },
    });

    // No settings = all types allowed (permissive default)
    if (!settings) return;

    for (const [settingKey, guardedTypes] of Object.entries(BOOKING_SETTINGS_GUARDS)) {
      if (guardedTypes.includes(bookingType)) {
        const allowed = (settings as any)[settingKey];
        if (allowed === false) {
          throw new Error(
            `Booking type "${bookingType}" is not allowed for this villa. ` +
            `Setting "${settingKey}" is disabled.`,
          );
        }
      }
    }
  }
}
