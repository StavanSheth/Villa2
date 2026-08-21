import { PATCH as BookingPATCH } from '../apps/booking/src/app/api/bookings/[id]/route';
import { POST as BookingPOST } from '../apps/booking/src/app/api/bookings/route';
import { prisma } from '@villa-platform/database';
import crypto from 'node:crypto';

// Setup Mock Razorpay env var for the test
process.env.MOCK_RAZORPAY = 'true';

const createRequest = (url: string, method: string, body: any) => 
  new Request(`http://localhost${url}`, {
    method,
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' }
  });

async function runScenarioA(villa: any) {
  console.log('\n======================================================');
  console.log('Test A: Concurrent Cancellation & Refund Race Condition');
  console.log('Scenario: CUSTOMER and OWNER both try to CANCEL the same booking at the exact same millisecond.');
  console.log('Expected: 1 Success (Refund issued), 1 Failure (Gracefully rejected by FSM state check).');

  // 1. Setup Data
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + 10);
  const checkOut = new Date();
  checkOut.setDate(checkOut.getDate() + 15);

  const bookingCode = `TEST-BOOK-${crypto.randomUUID().substring(0, 6)}`;
  
  // Need a user for the booking
  let user = await prisma.user.findFirst();
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

  const booking = await prisma.booking.create({
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

  // 2. Fire Concurrent Requests
  const p1 = BookingPATCH(createRequest(`/api/bookings/${bookingCode}`, 'PATCH', {
    action: 'CANCEL',
    actorRole: 'CUSTOMER'
  }), { params: Promise.resolve({ id: bookingCode }) });

  const p2 = BookingPATCH(createRequest(`/api/bookings/${bookingCode}`, 'PATCH', {
    action: 'CANCEL',
    actorRole: 'OWNER'
  }), { params: Promise.resolve({ id: bookingCode }) });

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

  console.log(`Results: ${successes} Success, ${failures} Failures.`);

  // 3. Verify exactly 1 refund transaction was created
  const refunds = await prisma.paymentTransaction.findMany({
    where: { bookingId: booking.id, status: 'REFUNDED' }
  });

  console.log(`Number of refund transactions recorded in DB: ${refunds.length}`);
  
  if (successes !== 1 || refunds.length !== 1) {
    console.error('❌ FAILED: Double refund or race condition vulnerability detected!');
    return false;
  }
  
  console.log('✅ PASSED');
  return true;
}

async function runScenarioB(villa: any) {
  console.log('\n======================================================');
  console.log('Test B: The "Everything Everywhere All At Once" Race Condition');
  console.log('Scenario: 2 customers bypass the reservation lock UI and attempt to forcibly checkout the exact same dates on the same villa using a 1-usage limit promo code concurrently.');
  console.log('Expected: 1 Success, 1 Failure (Gracefully rejected by overlapping booking lock OR promo code lock).');

  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + 20);
  const checkOut = new Date();
  checkOut.setDate(checkOut.getDate() + 25);

  const testPromoCode = `CRASH-${crypto.randomUUID().substring(0, 4).toUpperCase()}`;
  const promo = await prisma.promoCode.create({
    data: {
      code: testPromoCode,
      type: 'FIXED',
      value: 500,
      usageLimit: 1, // EXACTLY 1 USAGE ALLOWED
      usageCount: 0,
      status: 'ACTIVE'
    }
  });

  let user1 = await prisma.user.findFirst();
  if (!user1) throw new Error("Need at least 1 user");
  let user2 = await prisma.user.findFirst({ where: { id: { not: user1.id } } });
  if (!user2) {
      user2 = await prisma.user.create({
          data: {
              email: 'testcustomer2@example.com',
              firebaseUid: crypto.randomUUID(),
              firstName: 'Test2',
              lastName: 'Customer2'
          }
      });
  }

  // Artificially create 2 valid locks to simulate both users making it to the checkout page
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
          customerId: user1.id, // Using user1 for both to bypass the dummy auth check in route.ts and hit the DB constraint
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
      promoCode: testPromoCode,
      lockId: lock.id,
      idempotencyKey: `idemp-scenario-B-${i}-${crypto.randomUUID()}` // Valid independent requests
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

  console.log(`Results: ${successes} Success, ${failures} Failures.`);
  
  if (successes !== 1) {
    console.error('❌ FAILED: Either both succeeded (double booking / promo limit breached) or both failed.');
    return false;
  }
  
  console.log('✅ PASSED');
  return true;
}

async function run() {
  console.log('=== PONYTAIL COMPLEX CONCURRENCY STRESS TEST ===');

  const villa = await prisma.villa.findFirst();
  if (!villa) throw new Error('No villa found in database.');

  let allPassed = true;
  allPassed = await runScenarioA(villa) && allPassed;
  allPassed = await runScenarioB(villa) && allPassed;

  console.log('\n======================================================');
  if (allPassed) {
    console.log('🌟 ALL COMPLEX STRESS TESTS PASSED SUCCESSFULLY! 🌟');
    process.exit(0);
  } else {
    console.error('💀 ONE OR MORE TESTS FAILED.');
    process.exit(1);
  }
}

run().catch(console.error);
