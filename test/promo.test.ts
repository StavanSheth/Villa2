import { describe, it, expect, beforeAll } from 'vitest';
import { POST as BookingPOST } from '../apps/booking/src/app/api/bookings/route';
import { prisma } from '@villa-platform/database';
import crypto from 'node:crypto';

const createRequest = (url: string, method: string, body: any) => 
  new Request(`http://localhost${url}`, {
    method,
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' }
  });

describe('Category 8: Promo Code Race Conditions', () => {
  let villa: any;
  let user1: any;
  let promo: any;

  beforeAll(async () => {
    villa = await prisma.villa.findFirst();
    if (!villa) throw new Error('No villa found');

    user1 = await prisma.user.findFirst();
    if (!user1) throw new Error('No user found');

    const testPromoCode = `PRM-${crypto.randomUUID().substring(0, 4).toUpperCase()}`;
    promo = await prisma.promoCode.create({
      data: {
        code: testPromoCode,
        type: 'FIXED',
        value: 500,
        usageLimit: 1, // EXACTLY 1 USAGE ALLOWED
        usageCount: 0,
        status: 'ACTIVE'
      }
    });
  });

  it('Scenario 8A: Promo Remaining 1, Two Customers Concurrently', async () => {
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 20);
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 25);

    // Create 2 valid locks to bypass UI reservation logic, hitting checkout directly
    const lock1 = await prisma.reservationLock.create({
        data: {
            villaId: villa.id,
            customerId: user1.id,
            checkIn,
            checkOut,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        }
    });

    const lock2 = await prisma.reservationLock.create({
        data: {
            villaId: villa.id,
            customerId: user1.id,
            checkIn,
            checkOut,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000)
        }
    });

    const confirmRequests = [lock1, lock2].map((lock, i) => {
      return BookingPOST(createRequest('/api/bookings', 'POST', {
        villaId: villa.id,
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
        totalGuests: 2,
        paymentType: 'FULL',
        promoCode: promo.code,
        lockId: lock.id,
        idempotencyKey: `idemp-promo-${i}-${crypto.randomUUID()}`
      }));
    });
  
    const responses = await Promise.allSettled(confirmRequests);
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
  
    // Postgres 40001 serialization lock should mathematically reject one!
    expect(successes).toBe(1);
    expect(failures).toBe(1);

    // Verify promo usage count is exactly 1 in DB
    const updatedPromo = await prisma.promoCode.findUnique({
      where: { id: promo.id }
    });
    
    expect(updatedPromo?.usageCount).toBe(1);
  });

  it('Scenario 8C: Promo 1 usage limit, 10 Customers Concurrently', async () => {
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 30);
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 35);

    const testPromoCode = `PRM-STRESS-${crypto.randomUUID().substring(0, 4).toUpperCase()}`;
    const stressPromo = await prisma.promoCode.create({
      data: {
        code: testPromoCode,
        type: 'FIXED',
        value: 100,
        usageLimit: 1, // EXACTLY 1 USAGE ALLOWED
        usageCount: 0,
        status: 'ACTIVE'
      }
    });

    const locks = await Promise.all(
      Array(10).fill(0).map(() => 
        prisma.reservationLock.create({
          data: {
            villaId: villa.id,
            customerId: user1.id,
            checkIn,
            checkOut,
            expiresAt: new Date(Date.now() + 15 * 60 * 1000)
          }
        })
      )
    );

    const confirmRequests = locks.map((lock, i) => {
      return BookingPOST(createRequest('/api/bookings', 'POST', {
        villaId: villa.id,
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
        totalGuests: 2,
        paymentType: 'FULL',
        promoCode: stressPromo.code,
        lockId: lock.id,
        idempotencyKey: `idemp-promo-stress-${i}-${crypto.randomUUID()}`
      }));
    });
  
    const responses = await Promise.allSettled(confirmRequests);
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
  
    // Exactly 1 success
    expect(successes).toBe(1);
    expect(failures).toBe(9);

    // Verify promo usage count is exactly 1 in DB
    const updatedPromo = await prisma.promoCode.findUnique({
      where: { id: stressPromo.id }
    });
    
    expect(updatedPromo?.usageCount).toBe(1);
  });
});
