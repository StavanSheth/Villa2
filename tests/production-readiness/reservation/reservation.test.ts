import { describe, it, expect, beforeAll } from 'vitest';
import { prisma } from '@villa-platform/database';
import { BookingEngineService } from '../../../domains/bookings/services/booking-engine.service';
import crypto from 'node:crypto';

describe('RES-001: Simultaneous booking same villa (Thundering Herd)', () => {
  let villa: any;
  let user: any;

  beforeAll(async () => {
    // 1. Create a Villa for the concurrency test
    villa = await prisma.villa.create({
      data: {
        name: 'Concurrency Villa',
        description: 'Test Villa',
        capacity: 4,
        bedrooms: 2,
        bathrooms: 2,
        basePrice: 10000,
        isActive: true,
      }
    });

    // 2. Create a User
    user = await prisma.user.create({
      data: {
        email: `concurrency-${crypto.randomUUID()}@test.com`,
        firebaseUid: crypto.randomUUID(),
        firstName: 'Concurrency',
        lastName: 'Tester',
      }
    });
  });

  it('should allow exactly 1 booking and reject all others', async () => {
    const checkIn = new Date('2028-05-01');
    const checkOut = new Date('2028-05-05');

    // Create 10 identical booking requests
    const attempts = Array.from({ length: 10 }).map(() => {
      return BookingEngineService.createBooking({
        mode: 'CUSTOMER',
        bookingType: 'NORMAL',
        bookingSource: 'WEB',
        villaId: villa.id,
        userId: user.id,
        checkIn,
        checkOut,
        numGuests: 2,
        paymentRequired: true,
        paymentType: 'FULL',
        bookingReason: 'Concurrency Test',
      });
    });

    // Fire them all at the exact same millisecond
    const results = await Promise.allSettled(attempts);

    const successes = results.filter(r => r.status === 'fulfilled');
    const failures = results.filter(r => r.status === 'rejected');

    // Assert that exactly ONE booking succeeded
    expect(successes.length).toBe(1);
    expect(failures.length).toBe(9);

    // Verify the database state has exactly 1 booking for this villa and date range
    const dbBookings = await prisma.booking.findMany({
      where: {
        villaId: villa.id,
        checkIn: { lte: checkOut },
        checkOut: { gte: checkIn }
      }
    });

    expect(dbBookings.length).toBe(1);
  });
});
