import { describe, it, expect, beforeAll } from 'vitest';
import { PATCH as BookingPATCH } from '../apps/booking/src/app/api/bookings/[id]/route';
import { prisma } from '@villa-platform/database';
import crypto from 'node:crypto';

const createRequest = (url: string, method: string, body: any) => 
  new Request(`http://localhost${url}`, {
    method,
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' }
  });

describe('Category 6 & 10: Cancellations & Refunds', () => {
  let villa: any;
  let user: any;
  let booking: any;

  beforeAll(async () => {
    villa = await prisma.villa.findFirst();
    if (!villa) throw new Error('No villa found');

    user = await prisma.user.findFirst();
    if (!user) throw new Error('No user found');

    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 10);
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 15);

    const bookingCode = `TEST-CANCEL-${crypto.randomUUID().substring(0, 6)}`;
    
    booking = await prisma.booking.create({
      data: {
        bookingCode,
        villaId: villa.id,
        userId: user.id,
        checkIn,
        checkOut,
        totalGuests: 2,
        totalAmount: 10000,
        paidAmount: 10000,
        status: 'CONFIRMED',
        idempotencyKey: crypto.randomUUID()
      }
    });

    await prisma.paymentTransaction.create({
      data: {
        bookingId: booking.id,
        amount: 10000,
        method: 'RAZORPAY',
        status: 'SUCCESS',
        referenceId: `pay_${crypto.randomUUID()}`
      }
    });

    await prisma.cancellationPolicy.upsert({
      where: { villaId_hoursBefore: { villaId: villa.id, hoursBefore: 48 } },
      update: {},
      create: {
        villaId: villa.id,
        hoursBefore: 48,
        refundPercent: 50,
        description: '50% refund before 48 hours'
      }
    });
  });

  it('Scenario 6A: Customer and Owner cancel at same millisecond', async () => {
    const p1 = BookingPATCH(createRequest(`/api/bookings/${booking.bookingCode}`, 'PATCH', {
      action: 'CANCEL',
      actorRole: 'CUSTOMER'
    }), { params: Promise.resolve({ id: booking.bookingCode }) });
  
    const p2 = BookingPATCH(createRequest(`/api/bookings/${booking.bookingCode}`, 'PATCH', {
      action: 'CANCEL',
      actorRole: 'OWNER'
    }), { params: Promise.resolve({ id: booking.bookingCode }) });
  
    const responses = await Promise.allSettled([p1, p2]);
  
    let successes = 0, failures = 0;
    for (const result of responses) {
      if (result.status === 'fulfilled') {
        const res = result.value as Response;
        if (res.ok) successes++;
        else failures++;
      } else {
        failures++;
      }
    }
  
    // One succeeds (Owner), one fails (Customer not allowed to cancel CONFIRMED)
    expect(successes).toBe(1);
    expect(failures).toBe(1);
  
    // Verify exactly 1 refund transaction was created
    const refunds = await prisma.paymentTransaction.findMany({
      where: { bookingId: booking.id, status: 'REFUNDED' }
    });
    
    expect(refunds.length).toBe(1);
    expect(refunds[0].amount.toNumber()).toBe(5000); // 50% of 10000
  });

  it('Scenario 6B: Admin cancels while Refund processing (Duplicate prevention)', async () => {
    const bookingCode = `TEST-CANCEL-${crypto.randomUUID().substring(0, 6)}`;
    const newBooking = await prisma.booking.create({
      data: {
        bookingCode,
        villaId: villa.id,
        userId: user.id,
        checkIn: booking.checkIn,
        checkOut: booking.checkOut,
        totalGuests: 2,
        totalAmount: 10000,
        paidAmount: 10000,
        status: 'CONFIRMED',
        idempotencyKey: crypto.randomUUID()
      }
    });

    await prisma.paymentTransaction.create({
      data: {
        bookingId: newBooking.id,
        amount: 10000,
        method: 'RAZORPAY',
        status: 'SUCCESS',
        referenceId: `pay_${crypto.randomUUID()}`
      }
    });

    const req1 = BookingPATCH(createRequest(`/api/bookings/${bookingCode}`, 'PATCH', {
      action: 'CANCEL',
      actorRole: 'OWNER'
    }), { params: Promise.resolve({ id: bookingCode }) });
  
    const req2 = BookingPATCH(createRequest(`/api/bookings/${bookingCode}`, 'PATCH', {
      action: 'CANCEL',
      actorRole: 'OWNER'
    }), { params: Promise.resolve({ id: bookingCode }) });
  
    const responses = await Promise.allSettled([req1, req2]);
  
    let successes = 0, failures = 0;
    for (const result of responses) {
      if (result.status === 'fulfilled') {
        const res = result.value as Response;
        if (res.ok) successes++;
        else failures++;
      } else {
        failures++;
      }
    }
  
    // Exactly one should succeed, the other should fail due to serializable conflict or already cancelled state
    expect(successes).toBe(1);
    expect(failures).toBe(1);
  
    // Verify exactly 1 refund transaction
    const refunds = await prisma.paymentTransaction.findMany({
      where: { bookingId: newBooking.id, status: 'REFUNDED' }
    });
    
    expect(refunds.length).toBe(1);
  });
});
