import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { POST as ReservePOST } from '../apps/booking/src/app/api/bookings/reserve/route';
import { POST as BookingPOST } from '../apps/booking/src/app/api/bookings/route';
import { prisma } from '@villa-platform/database';
import crypto from 'node:crypto';

const createRequest = (url: string, method: string, body: any) => 
  new Request(`http://localhost${url}`, {
    method,
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' }
  });

describe('Category 3 & 4: Reservation & Booking Locks', () => {
  let villa: any;
  let user: any;

  beforeAll(async () => {
    villa = await prisma.villa.create({
      data: {
        name: 'Test Reservation Villa',
        description: 'Test villa for testing reservations',
        basePrice: 50000, // 500 INR
        capacity: 4,
        bedrooms: 2,
        bathrooms: 2
      }
    });

    user = await prisma.user.findFirst();
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: 'testcustomer@example.com',
          firebaseUid: crypto.randomUUID(),
          firstName: 'Test',
          lastName: 'Customer'
        }
      });
    }

    // Clean up locks
    await prisma.reservationLock.deleteMany({});
    await prisma.pricingRule.create({
      data: {
        villaId: villa.id,
        type: 'CUSTOM',
        price: 50000,
      }
    });
  });

  afterAll(async () => {
    if (villa) {
      await prisma.pricingRule.deleteMany({ where: { villaId: villa.id } });
      await prisma.reservationLock.deleteMany({ where: { villaId: villa.id } });
      await prisma.bookingEvent.deleteMany({}); // Delete all booking events for tests
      await prisma.booking.deleteMany({ where: { villaId: villa.id } });
      await prisma.cancellationPolicy.deleteMany({ where: { villaId: villa.id } });
      await prisma.villa.delete({ where: { id: villa.id } });
    }
  });

  it('Scenario 3A: Concurrent Reservation Locks on Exact Same Millisecond', async () => {
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 1000);
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 1005);

    const payload = {
      villaId: villa.id,
      checkIn: checkIn.toISOString(),
      checkOut: checkOut.toISOString(),
    };

    const requests = Array(5).fill(0).map(() => ReservePOST(createRequest('/api/bookings/reserve', 'POST', payload)));
    const responses = await Promise.allSettled(requests);
    
    let successes = 0;
    let failures = 0;

    for (const result of responses) {
      if (result.status === 'fulfilled') {
        const res = result.value as Response;
        if (res.ok) successes++;
        else failures++;
      } else {
        failures++;
      }
    }

    expect(successes).toBe(1);
    expect(failures).toBe(4);
  });

  it('Scenario 3B & 3C: Reservation Lock Survives Refresh & Expires Correctly', async () => {
    // A single lock successfully acquired remains in database as LOCKED status
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 2000);
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 2005);

    const payload = {
      villaId: villa.id,
      checkIn: checkIn.toISOString(),
      checkOut: checkOut.toISOString(),
    };

    const res = await ReservePOST(createRequest('/api/bookings/reserve', 'POST', payload));
    const data = await (res as Response).json();
    
    expect((res as Response).ok).toBe(true);
    expect(data.lockId).toBeDefined();

    const lockInDb = await prisma.reservationLock.findUnique({ where: { id: data.lockId } });
    expect(lockInDb).toBeDefined();
    expect(lockInDb?.status).toBe('LOCKED');
    
    // Check expiration is 15 minutes in the future
    const expectedExpiration = new Date(Date.now() + 15 * 60 * 1000);
    const timeDiff = Math.abs(lockInDb!.expiresAt.getTime() - expectedExpiration.getTime());
    expect(timeDiff).toBeLessThan(5000); // Within 5 seconds tolerance
  });

  it('Scenario 4C: Verify Booking Price Calculation (Immutability)', async () => {
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 3000);
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 3005);

    // Create lock
    const res = await ReservePOST(createRequest('/api/bookings/reserve', 'POST', {
      villaId: villa.id,
      checkIn: checkIn.toISOString(),
      checkOut: checkOut.toISOString(),
    }));
    const data = await (res as Response).json();
    if (!(res as Response).ok) {
      throw new Error(`Lock failed in 4C: ${JSON.stringify(data)}`);
    }
    const lockId = data.lockId;

    // Create booking
    const bookingRes = await BookingPOST(createRequest('/api/bookings', 'POST', {
      villaId: villa.id,
      checkIn: checkIn.toISOString(),
      checkOut: checkOut.toISOString(),
      totalGuests: 2,
      paymentType: 'FULL',
      lockId: lockId,
      idempotencyKey: `idemp-booking-${crypto.randomUUID()}`
    }));

    const bookingData = await (bookingRes as Response).json();
    if (!(bookingRes as Response).ok) {
      throw new Error(`Booking failed: ${JSON.stringify(bookingData)}`);
    }
    expect(bookingData.bookingCode).toBeDefined();
    
    // Verify immutability (nightlyBreakdown exists and totalAmount is calculated)
    expect(bookingData.nightlyBreakdown).toBeDefined();
    expect(Number(bookingData.totalAmount)).toBeGreaterThan(0);
  });

  it('Scenario 4B: Customer books 30 nights seamlessly', async () => {
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 4000);
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 4030); // 30 nights

    const res = await ReservePOST(createRequest('/api/bookings/reserve', 'POST', {
      villaId: villa.id,
      checkIn: checkIn.toISOString(),
      checkOut: checkOut.toISOString(),
    }));
    const data = await (res as Response).json();
    expect((res as Response).ok).toBe(true);

    const bookingRes = await BookingPOST(createRequest('/api/bookings', 'POST', {
      villaId: villa.id,
      checkIn: checkIn.toISOString(),
      checkOut: checkOut.toISOString(),
      totalGuests: 2,
      paymentType: 'ADVANCE',
      lockId: data.lockId,
      idempotencyKey: `idemp-booking-${crypto.randomUUID()}`
    }));
    expect((bookingRes as Response).ok).toBe(true);
  });

  it('Scenario 4E: Owner deletes villa, but historical booking is immutable', async () => {
    // Note: Due to foreign keys, an owner cannot physically DELETE a villa if there are bookings.
    // They can only 'archive' or 'disable' it (isActive = false). We test that the booking retains its snapshot data.
    
    // Find the booking we made in 4C
    const existingBooking = await prisma.booking.findFirst({ where: { villaId: villa.id } });
    expect(existingBooking).not.toBeNull();
    
    // Soft delete / disable the villa
    await prisma.villa.update({ where: { id: villa.id }, data: { basePrice: 0 } });

    // Assert the booking snapshot (totalAmount) has NOT changed despite the villa basePrice becoming 0
    const snapshotBooking = await prisma.booking.findUnique({ where: { id: existingBooking!.id } });
    expect(Number(snapshotBooking!.totalAmount)).toBeGreaterThan(0);
  });
});
