// apps/api/src/routes/booking-engine.ts
// Booking Engine API Routes
// Single set of endpoints for Customer, Owner, and Staff booking creation

import { Hono } from 'hono';
import { BookingEngineService } from '../../../../domains/bookings/services/booking-engine.service.js';
import { CreateBookingSchema } from '@villa-platform/validation';
import { prisma } from '@villa-platform/database';
import { BOOKING_TYPE_RULES } from '@villa-platform/types';
import type { BookingType, CalendarBookingEntry, CalendarEntryType } from '@villa-platform/types';

const bookingEngine = new Hono();

/**
 * POST /booking-engine/create
 * Unified booking creation — works for all modes (Customer, Owner, Staff)
 */
bookingEngine.post('/create', async (c) => {
  try {
    const body = await c.req.json();
    const parsed = CreateBookingSchema.safeParse(body);

    if (!parsed.success) {
      return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
    }

    const result = await BookingEngineService.createBooking({
      mode: parsed.data.bookingMode,
      bookingType: parsed.data.bookingType,
      bookingSource: parsed.data.bookingSource,
      villaId: parsed.data.villaId,
      userId: parsed.data.userId,
      checkIn: parsed.data.checkIn,
      checkOut: parsed.data.checkOut,
      numGuests: parsed.data.numGuests,
      paymentRequired: parsed.data.paymentRequired,
      paymentType: parsed.data.paymentType,
      bookingReason: parsed.data.bookingReason,
      internalNotes: parsed.data.internalNotes,
      guestProfileId: parsed.data.guestProfileId,
      promoCode: parsed.data.couponCode,
    });

    return c.json(result, 201);
  } catch (error: any) {
    console.error('Booking engine create error:', error);
    return c.json({ error: error.message || 'Failed to create booking' }, 400);
  }
});

/**
 * GET /booking-engine/calendar/:villaId
 * Returns calendar entries with booking type colors for the ReservationGrid
 */
bookingEngine.get('/calendar/:villaId', async (c) => {
  try {
    const villaId = c.req.param('villaId');

    const bookings = await prisma.booking.findMany({
      where: {
        villaId,
        status: { notIn: ['CANCELLED', 'ARCHIVED'] },
      },
      select: {
        id: true,
        bookingCode: true,
        bookingType: true,
        status: true,
        checkIn: true,
        checkOut: true,
        bookingReason: true,
        user: { select: { firstName: true, lastName: true } },
      },
      orderBy: { checkIn: 'asc' },
    });

    const entries: CalendarBookingEntry[] = bookings.map((b) => {
      const rules = BOOKING_TYPE_RULES[b.bookingType as BookingType];
      return {
        bookingId: b.id,
        bookingCode: b.bookingCode,
        checkIn: b.checkIn.toISOString(),
        checkOut: b.checkOut.toISOString(),
        type: (rules?.calendarColor || 'CUSTOMER') as CalendarEntryType,
        bookingType: b.bookingType as BookingType,
        label: b.bookingReason || `${b.user.firstName} ${b.user.lastName}`,
        status: b.status as any,
      };
    });

    return c.json(entries);
  } catch (error: any) {
    console.error('Calendar fetch error:', error);
    return c.json({ error: error.message }, 500);
  }
});

/**
 * PUT /booking-engine/:id/status
 * Transition booking to a new status (state machine validated)
 */
bookingEngine.put('/:id/status', async (c) => {
  try {
    const bookingId = c.req.param('id');
    const { status, actorId, actorRole, metadata } = await c.req.json();

    const result = await BookingEngineService.transitionStatus(
      bookingId, status, actorId, actorRole, metadata,
    );
    return c.json(result);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

/**
 * POST /booking-engine/:id/cancel
 * Cancel a booking with refund calculation
 */
bookingEngine.post('/:id/cancel', async (c) => {
  try {
    const bookingId = c.req.param('id');
    const { actorId, actorRole, reason } = await c.req.json();

    const result = await BookingEngineService.cancelBooking(
      bookingId, actorId, actorRole, reason,
    );
    return c.json(result);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

/**
 * PUT /booking-engine/:id/convert
 * Convert booking between types (e.g., Owner → Customer)
 */
bookingEngine.put('/:id/convert', async (c) => {
  try {
    const bookingId = c.req.param('id');
    const { newType, actorId, actorRole } = await c.req.json();

    const result = await BookingEngineService.convertBookingType(
      bookingId, newType, actorId, actorRole,
    );
    return c.json(result);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

/**
 * POST /booking-engine/:id/notes
 * Add internal notes (owner/staff only)
 */
bookingEngine.post('/:id/notes', async (c) => {
  try {
    const bookingId = c.req.param('id');
    const { notes, actorId, actorRole } = await c.req.json();

    const result = await BookingEngineService.addInternalNotes(
      bookingId, notes, actorId, actorRole,
    );
    return c.json(result);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

/**
 * PUT /booking-engine/:id/assign
 * Assign staff or caretaker
 */
bookingEngine.put('/:id/assign', async (c) => {
  try {
    const bookingId = c.req.param('id');
    const { staffId, caretakerId, actorId, actorRole } = await c.req.json();

    const result = await BookingEngineService.assignStaff(
      bookingId, staffId, caretakerId, actorId, actorRole,
    );
    return c.json(result);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

export default bookingEngine;
