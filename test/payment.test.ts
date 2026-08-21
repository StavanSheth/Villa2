import { describe, it, expect, beforeAll } from 'vitest';
import { Hono } from 'hono';
import crypto from 'node:crypto';

import paymentsApp from '../apps/api/src/routes/payments';
import { prisma } from '@villa-platform/database';

// The payments router is exported as a Hono sub-app, we mount it
const app = new Hono<{ Bindings: { RAZORPAY_WEBHOOK_SECRET: string } }>();
// Use local secret for testing
app.use('*', async (c, next) => {
  c.env = { RAZORPAY_WEBHOOK_SECRET: 'test_secret' };
  await next();
});
app.route('/payments', paymentsApp);

describe('Category 5: Payment Scenarios', () => {
  let booking: any;

  beforeAll(async () => {
    // We need a test booking in AWAITING_PAYMENT state
    let villa = await prisma.villa.findFirst();
    if (!villa) throw new Error('No villa found');

    let user = await prisma.user.findFirst();
    if (!user) throw new Error('No user found');

    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 60);
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 65);

    booking = await prisma.booking.create({
      data: {
        bookingCode: `TEST-PAY-${crypto.randomUUID().substring(0, 6)}`,
        villaId: villa.id,
        userId: user.id,
        checkIn,
        checkOut,
        totalGuests: 2,
        totalAmount: 10000,
        paidAmount: 0,
        status: 'AWAITING_PAYMENT',
      }
    });
  });

  const generateSignature = (payload: string, secret: string) => {
    return crypto.createHmac('sha256', secret).update(payload).digest('hex');
  };

  it('Scenario 5B: Razorpay webhook arrives twice (Idempotency)', async () => {
    const eventId = `ev_${crypto.randomUUID()}`;
    const payload = JSON.stringify({
      id: eventId,
      event: 'payment.captured',
      payload: {
        payment: {
          entity: {
            id: `pay_${crypto.randomUUID()}`,
            amount: 10000 * 100, // in paise
            notes: {
              bookingId: booking.id
            }
          }
        }
      }
    });

    const signature = generateSignature(payload, 'test_secret');

    const req1 = new Request('http://localhost/payments/webhook', {
      method: 'POST',
      body: payload,
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': signature
      }
    });

    const req2 = new Request('http://localhost/payments/webhook', {
      method: 'POST',
      body: payload,
      headers: {
        'Content-Type': 'application/json',
        'x-razorpay-signature': signature
      }
    });

    // Fire concurrently to simulate race condition
    const [res1, res2] = await Promise.all([
      app.request(req1),
      app.request(req2)
    ]);

    const data1 = await res1.json();
    const data2 = await res2.json();
    
    if (res1.status !== 200 && res2.status !== 200) {
      throw new Error(`Both failed: ${JSON.stringify(data1)} / ${JSON.stringify(data2)}`);
    }

    expect(res1.status === 200 || res2.status === 200).toBe(true);

    // One should process, the other should be ignored by redis or db lock
    // Actually our webhook uses Redis Set NX which guarantees atomicity!
    const statuses = [data1.status, data2.status];
    expect(statuses).toContain('ok');
    // Both might be "ok" if DB catches it and ignores, or one might be "ignored_duplicate" if Redis catches it
    // The key assertion is that only 1 transaction is created in the database

    // Verify only 1 payment transaction in DB
    const txs = await prisma.paymentTransaction.findMany({
      where: { bookingId: booking.id }
    });
    
    expect(txs.length).toBe(1);
    expect(txs[0].amount.toNumber()).toBe(10000);
    expect(txs[0].status).toBe('SUCCESS');

    // Verify booking is confirmed
    const updatedBooking = await prisma.booking.findUnique({
      where: { id: booking.id }
    });
    expect(updatedBooking?.status).toBe('CONFIRMED');
    expect(Number(updatedBooking?.paidAmount)).toBe(10000);
  });

  it('Scenario 5A: Customer presses Pay 10 times concurrently', async () => {
    // Generate a fresh booking awaiting payment
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 90);
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 95);

    const freshBooking = await prisma.booking.create({
      data: {
        bookingCode: `TEST-PAY-${crypto.randomUUID().substring(0, 6)}`,
        villaId: booking.villaId,
        userId: booking.userId,
        checkIn,
        checkOut,
        totalGuests: 2,
        totalAmount: 5000,
        paidAmount: 0,
        status: 'AWAITING_PAYMENT',
      }
    });

    const idempotencyKey = crypto.randomUUID();

    // 10 concurrent clicks
    const requests = Array(10).fill(0).map(() => 
      new Request('http://localhost/payments/intent', {
        method: 'POST',
        body: JSON.stringify({
          bookingId: freshBooking.id,
          idempotencyKey
        }),
        headers: { 'Content-Type': 'application/json' }
      })
    );

    const responses = await Promise.allSettled(requests.map(req => app.request(req)));
    
    let successCount = 0;
    let conflictCount = 0;
    let orderId: string | null = null;

    for (const result of responses) {
      if (result.status === 'fulfilled') {
        const res = result.value;
        if (res.status === 200) {
          successCount++;
          const data = await res.json();
          if (!orderId) orderId = data.orderId;
          else expect(data.orderId).toBe(orderId); // Idempotency: exact same order ID returned
        } else if (res.status === 409) {
          conflictCount++;
        } else {
          console.log(`Failed status: ${res.status}`, await res.text());
        }
      }
    }

    // Since we used Prisma unique idempotency key, the first insert succeeds and subsequent ones
    // will either block and then return the existing one (if we coded it that way),
    // or fail with a 409 constraint violation. Our code returns 409 on unique violation.
    // So 1 success, 9 conflicts is perfectly valid. Or 10 successes returning same orderId.
    expect(successCount).toBeGreaterThanOrEqual(1);
    expect(successCount + conflictCount).toBe(10);

    // Verify exactly 1 PaymentTransaction was created in DB
    const txs = await prisma.paymentTransaction.count({
      where: { bookingId: freshBooking.id }
    });
    expect(txs).toBe(1);
  });
});
