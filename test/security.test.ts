import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import * as jose from 'jose';
import { prisma } from '@villa-platform/database';
import crypto from 'node:crypto';
import app from '../apps/api/src/index';

describe('Category 19: Security Scenarios', () => {
  let customer1: any;
  let customer2: any;
  let secret: Uint8Array;
  let customer1Token: string;
  let bookingId: string;

  beforeAll(async () => {
    secret = new TextEncoder().encode(process.env.JWT_SECRET || 'mavon_super_secret_jwt_key_for_edge_verification');

    customer1 = await prisma.user.create({
      data: {
        email: `customer1-${crypto.randomUUID()}@sec.com`,
        firebaseUid: crypto.randomUUID(),
        firstName: 'Sec',
        lastName: 'One',
        roles: { create: { role: { connect: { name: 'CUSTOMER' } } } }
      }
    });

    customer2 = await prisma.user.create({
      data: {
        email: `customer2-${crypto.randomUUID()}@sec.com`,
        firebaseUid: crypto.randomUUID(),
        firstName: 'Sec',
        lastName: 'Two',
        roles: { create: { role: { connect: { name: 'CUSTOMER' } } } }
      }
    });

    customer1Token = await new jose.SignJWT({ id: customer1.id, role: 'CUSTOMER' })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime('1h')
      .sign(secret);

    const villa = await prisma.villa.create({
      data: { name: 'Sec Villa', description: 'Sec', basePrice: 100, capacity: 2, bedrooms: 1, bathrooms: 1 }
    });

    const booking = await prisma.booking.create({
      data: {
        bookingCode: 'SEC-1111',
        userId: customer2.id, // Booking belongs to Customer 2
        villaId: villa.id,
        checkIn: new Date(),
        checkOut: new Date(Date.now() + 86400000),
        totalGuests: 1,
        totalAmount: 100,
        status: 'CONFIRMED'
      }
    });
    bookingId = booking.id;
  });

  afterAll(async () => {
    await prisma.paymentTransaction.deleteMany({});
    await prisma.bookingEvent.deleteMany({});
    await prisma.booking.deleteMany({});
    await prisma.villa.deleteMany({ where: { name: 'Sec Villa' } });
    await prisma.userRole.deleteMany({ where: { userId: { in: [customer1.id, customer2.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [customer1.id, customer2.id] } } });
  });

  it('Scenario 19A: IDOR - Customer cannot view or modify another customer\'s booking', async () => {
    // Customer 1 tries to fetch/cancel Customer 2's booking
    const req = new Request(`http://localhost/booking-engine/${bookingId}/cancel`, {
      method: 'POST',
      headers: { 
        'Cookie': `access_token=${customer1Token}`,
        'Content-Type': 'application/json' 
      },
      body: JSON.stringify({ actorId: customer1.id, actorRole: 'CUSTOMER', reason: 'Malicious' })
    });
    
    const env = { 
      RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || 'secret',
      JWT_SECRET: process.env.JWT_SECRET || 'mavon_super_secret_jwt_key_for_edge_verification'
    };
    const res = await app.fetch(req, env);
    // Should be unauthorized or forbidden
    expect(res.status).toBe(400); // Because it throws an error in service: 'Unauthorized to cancel this booking'
    const json = await res.json() as any;
    expect(json.error).toMatch(/unauthorized|permission/i);
  });

  it('Scenario 19B: Webhook Replay Attacks are handled idempotently', async () => {
    const payload = JSON.stringify({
      id: 'evt_sec_replay_1',
      event: 'payment.captured',
      payload: { payment: { entity: { id: 'pay_sec_replay_1', amount: 10000, notes: { bookingId } } } }
    });
    
    const signature = crypto.createHmac('sha256', process.env.RAZORPAY_WEBHOOK_SECRET || 'secret').update(payload).digest('hex');

    const req1 = new Request('http://localhost/payments/webhook', {
      method: 'POST',
      body: payload,
      headers: { 'Content-Type': 'application/json', 'x-razorpay-signature': signature }
    });

    const req2 = new Request('http://localhost/payments/webhook', {
      method: 'POST',
      body: payload,
      headers: { 'Content-Type': 'application/json', 'x-razorpay-signature': signature }
    });

    const env = { 
      RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || 'secret',
      JWT_SECRET: process.env.JWT_SECRET || 'mavon_super_secret_jwt_key_for_edge_verification'
    };
    // Execute first time
    const res1 = await app.fetch(req1, env);
    expect(res1.status).toBe(200);

    // Replay attack with same payload and signature
    const res2 = await app.fetch(req2, env);
    expect(res2.status).toBe(200); // Should return 200 to acknowledge, but DB should not double-process
    
    const transactions = await prisma.paymentTransaction.count({ where: { referenceId: 'pay_sec_replay_1' } });
    expect(transactions).toBe(1); // Only 1 transaction recorded despite replay
  });

  it('Scenario 19C: Expired JWT tokens strictly return 401', async () => {
    const expiredToken = await new jose.SignJWT({ id: customer1.id, role: 'CUSTOMER' })
      .setProtectedHeader({ alg: 'HS256' })
      .setExpirationTime(Math.floor(Date.now() / 1000) - 60) // Expired 1 min ago
      .sign(secret);

    // We can hit auth/refresh since that requires a valid token
    const req = new Request(`http://localhost/auth/refresh`, {
      method: 'POST',
      headers: { 'Cookie': `refresh_token=${expiredToken}; session_id=fake_session` }
    });
    
    const env = { 
      RAZORPAY_WEBHOOK_SECRET: process.env.RAZORPAY_WEBHOOK_SECRET || 'secret',
      JWT_SECRET: process.env.JWT_SECRET || 'mavon_super_secret_jwt_key_for_edge_verification'
    };
    const res = await app.fetch(req, env);
    expect(res.status).toBe(401);
  });

  it('Scenario 19D: IDOR - Customer cannot perform administrative actions on bookings', async () => {
    const { BookingEngineService } = await import('../domains/bookings/services/booking-engine.service');
    
    // Attempt to transition status
    await expect(BookingEngineService.transitionStatus(bookingId, 'CANCELLED', customer1.id, 'CUSTOMER'))
      .rejects.toThrow(/Unauthorized/);

    // Attempt to add internal notes
    await expect(BookingEngineService.addInternalNotes(bookingId, 'Note', customer1.id, 'CUSTOMER'))
      .rejects.toThrow(/Unauthorized/);

    // Attempt to assign staff
    await expect(BookingEngineService.assignStaff(bookingId, 'staff1', null, customer1.id, 'CUSTOMER'))
      .rejects.toThrow(/Unauthorized/);

    // Attempt to convert booking type
    await expect(BookingEngineService.convertBookingType(bookingId, 'VIP', customer1.id, 'CUSTOMER'))
      .rejects.toThrow(/Unauthorized/);
  });

  it('Scenario 19E: IDOR - Multi-Tenant Owner Isolation', async () => {
    const { BookingEngineService } = await import('../domains/bookings/services/booking-engine.service');

    const owner1 = await prisma.user.create({
      data: {
        email: `owner1-${crypto.randomUUID()}@sec.com`,
        firebaseUid: crypto.randomUUID(),
        firstName: 'Owner',
        lastName: 'One',
        roles: { create: { role: { connectOrCreate: { where: { name: 'OWNER' }, create: { name: 'OWNER' } } } } }
      }
    });

    const owner2 = await prisma.user.create({
      data: {
        email: `owner2-${crypto.randomUUID()}@sec.com`,
        firebaseUid: crypto.randomUUID(),
        firstName: 'Owner',
        lastName: 'Two',
        roles: { create: { role: { connectOrCreate: { where: { name: 'OWNER' }, create: { name: 'OWNER' } } } } }
      }
    });

    // Owner1 owns Villa1
    const villa1 = await prisma.villa.create({
      data: { name: 'Owner1 Villa', description: 'Desc', basePrice: 200, capacity: 4, bedrooms: 2, bathrooms: 2, ownerId: owner1.id }
    });

    // A customer books Owner1's Villa
    const booking1 = await prisma.booking.create({
      data: {
        bookingCode: 'OWNER-ISO-1',
        userId: customer1.id,
        villaId: villa1.id,
        checkIn: new Date(),
        checkOut: new Date(Date.now() + 86400000),
        totalGuests: 2,
        totalAmount: 200,
        status: 'CONFIRMED'
      }
    });

    // Owner2 attempts to transition status of Owner1's booking
    await expect(BookingEngineService.transitionStatus(booking1.id, 'CANCELLED', owner2.id, 'OWNER'))
      .rejects.toThrow(/Unauthorized: Owners can only manage bookings for their own villas/);

    // Owner2 attempts to assign staff to Owner1's booking
    await expect(BookingEngineService.assignStaff(booking1.id, 'staff1', null, owner2.id, 'OWNER'))
      .rejects.toThrow(/Unauthorized: Owners can only assign staff for their own villas/);

    // Owner2 attempts to add internal notes to Owner1's booking
    await expect(BookingEngineService.addInternalNotes(booking1.id, 'Note', owner2.id, 'OWNER'))
      .rejects.toThrow(/Unauthorized: Owners can only add notes to bookings for their own villas/);

    // Owner2 attempts to cancel Owner1's booking
    await expect(BookingEngineService.cancelBooking(booking1.id, owner2.id, 'OWNER'))
      .rejects.toThrow(/Unauthorized: Owners can only cancel bookings for their own villas/);

    // Cleanup
    await prisma.booking.delete({ where: { id: booking1.id } });
    await prisma.villa.delete({ where: { id: villa1.id } });
    await prisma.userRole.deleteMany({ where: { userId: { in: [owner1.id, owner2.id] } } });
    await prisma.user.deleteMany({ where: { id: { in: [owner1.id, owner2.id] } } });
  });
});
