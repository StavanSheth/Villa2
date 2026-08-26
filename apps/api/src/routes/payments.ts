import { Hono } from 'hono';
import { prisma } from '@villa-platform/database';
import { redis } from '@villa-platform/cache';
import crypto from 'node:crypto';

const payments = new Hono<{ Bindings: { RAZORPAY_WEBHOOK_SECRET: string } }>();

payments.post('/intent', async (c) => {
  try {
    const { bookingId, idempotencyKey } = await c.req.json();
    if (!bookingId || !idempotencyKey) {
      return c.json({ error: 'Missing bookingId or idempotencyKey' }, 400);
    }

    const intent = await prisma.$transaction(async (tx) => {
      // Check idempotency for order generation
      const existingTx = await tx.paymentTransaction.findUnique({
        where: { idempotencyKey }
      });
      if (existingTx && existingTx.referenceId) {
        return existingTx.referenceId; // return existing order id
      }

      const booking = await tx.booking.findUnique({
        where: { id: bookingId }
      });

      if (!booking) throw new Error('Booking not found');
      if (booking.status !== 'AWAITING_PAYMENT') throw new Error('Booking not awaiting payment');

      // Mock creating a Razorpay order
      const orderId = `order_${crypto.randomUUID().substring(0, 10)}`;

      await tx.paymentTransaction.create({
        data: {
          idempotencyKey,
          bookingId,
          amount: booking.currentTotal,
          status: 'PENDING',
          referenceId: orderId,
          method: 'RAZORPAY', // Required field
        }
      });

      return orderId;
    }, { isolationLevel: 'Serializable', timeout: 10000 });

    return c.json({ orderId: intent });
  } catch (error: any) {
    if (error.code === 'P2034' || error.code === 'P2002') {
      // Postgres serialization conflict or Prisma unique constraint violation from race condition
      return c.json({ error: 'Concurrent request conflict, please retry' }, 409);
    }
    return c.json({ error: error.message }, 500);
  }
});

payments.post('/webhook', async (c) => {
  try {
    const signature = c.req.header('x-razorpay-signature');
    if (!signature) {
      return c.json({ error: 'Missing signature' }, 400);
    }

    const payload = await c.req.text();
    
    // Verify Webhook Signature
    const expectedSignature = crypto
      .createHmac('sha256', c.env.RAZORPAY_WEBHOOK_SECRET || 'secret')
      .update(payload)
      .digest('hex');
      
    if (signature !== expectedSignature) {
      return c.json({ error: 'Invalid signature' }, 401);
    }

    const event = JSON.parse(payload);
    
    // Webhook Idempotency Check using Upstash Redis
    // Webhook IDs (like event.id) are unique per event sent by Razorpay
    // In testing environments, bypass Redis so we can test the database idempotency locks natively
    let cached = 'OK';
    if (process.env.NODE_ENV !== 'test' && !process.env.UPSTASH_REDIS_REST_URL?.includes('placeholder')) {
      try {
        cached = await redis.set(`webhook_processed:${event.id}`, 'true', { nx: true, ex: 86400 });
      } catch (redisErr) {
        console.warn('Redis unavailable for webhook deduplication, falling back to DB transaction lock:', redisErr);
      }
    }
    
    if (cached !== 'OK') {
      console.log(`Webhook ${event.id} already processed. Skipping.`);
      return c.json({ status: 'ignored_duplicate' }, 200);
    }

    // Process event
    if (event.event === 'payment.captured' || event.event === 'order.paid') {
      const paymentEntity = event.payload.payment.entity;
      const receiptId = paymentEntity.notes?.bookingId || paymentEntity.receipt; 
      if (!receiptId) return c.json({ status: 'ignored_missing_receipt' }, 200);

      const booking = await prisma.booking.findFirst({
        where: { id: receiptId } // receipt mapped to our booking id
      });

      if (booking) {
        const isFullPayment = paymentEntity.amount >= Number(booking.currentTotal) * 100;
        
        // Wrap update in transaction with PaymentTransaction for idempotency
        await prisma.$transaction(async (tx) => {
          // Idempotency check at DB level
          const existingTx = await tx.paymentTransaction.findUnique({
            where: { idempotencyKey: event.id }
          });
          if (existingTx) return; // Already processed

          await tx.paymentTransaction.create({
            data: {
              bookingId: booking.id,
              amount: paymentEntity.amount / 100, // stored as decimal
              method: 'RAZORPAY',
              status: 'SUCCESS',
              referenceId: paymentEntity.id,
              idempotencyKey: event.id,
            }
          });

          await tx.booking.update({
            where: { id: booking.id },
            data: {
              status: 'CONFIRMED',
              totalPaid: { increment: paymentEntity.amount / 100 },
            }
          });
        }, {
          isolationLevel: 'Serializable',
          timeout: 10000 // Category 3: Database Resilience - Transaction Timeout
        });

        // TODO: Dispatch to Queue to Generate Invoice and Send Email
        console.log(`Booking ${booking.id} confirmed via payment capture.`);
      }
    }

    return c.json({ status: 'ok' }, 200);
  } catch (err) {
    console.error('Webhook processing failed:', err);
    return c.json({ error: 'Internal Server Error' }, 500);
  }
});

export default payments;
