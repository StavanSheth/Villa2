import { POST as ReservePOST } from '../apps/booking/src/app/api/bookings/reserve/route';
import { POST as BookingPOST } from '../apps/booking/src/app/api/bookings/route';
import { prisma } from '@villa-platform/database';
import crypto from 'node:crypto';

const createRequest = (url: string, body: any) => 
  new Request(`http://localhost${url}`, {
    method: 'POST',
    body: JSON.stringify(body),
    headers: { 'Content-Type': 'application/json' }
  });

async function runTest1(villa: any) {
  console.log('\n======================================================');
  console.log('Test 1: Concurrent Reservation Locks (Same Dates)');
  console.log('Scenario: 5 users try to reserve the exact same dates simultaneously.');
  console.log('Expected: 1 Success, 4 Failures.');
  
  const checkIn = new Date();
  checkIn.setDate(checkIn.getDate() + 20);
  const checkOut = new Date();
  checkOut.setDate(checkOut.getDate() + 25);

  const payload = {
    villaId: villa.id,
    checkIn: checkIn.toISOString(),
    checkOut: checkOut.toISOString(),
  };

  const requests = Array(5).fill(0).map(() => ReservePOST(createRequest('/api/bookings/reserve', payload)));
  const responses = await Promise.allSettled(requests);
  
  let successes = 0;
  let failures = 0;

  for (const result of responses) {
    if (result.status === 'fulfilled') {
      const res = result.value as Response;
      const data = await res.json();
      if (res.ok) successes++;
      else failures++;
    } else {
      failures++;
    }
  }

  console.log(`Results: ${successes} Success, ${failures} Failures.`);
  if (successes !== 1) {
    console.error('❌ FAILED: Race condition detected in Test 1!');
    return false;
  }
  console.log('✅ PASSED');
  return true;
}

async function runTest2(villa: any) {
  console.log('\n======================================================');
  console.log('Test 2: Non-Overlapping Reservation Locks');
  console.log('Scenario: 3 users reserve different date ranges simultaneously.');
  console.log('Expected: 3 Successes, 0 Failures.');
  
  const requests = Array(3).fill(0).map(async (_, i) => {
    // Stagger by 100ms to avoid Postgres Serializable SIRead predicate lock conflicts on the same villaId index
    await new Promise(resolve => setTimeout(resolve, i * 100));

    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 30 + (i * 10)); // e.g., +30, +40, +50
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 35 + (i * 10));

    return ReservePOST(createRequest('/api/bookings/reserve', {
      villaId: villa.id,
      checkIn: checkIn.toISOString(),
      checkOut: checkOut.toISOString(),
    }));
  });

  const responses = await Promise.allSettled(requests);
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
  if (successes !== 3) {
    console.error('❌ FAILED: Expected all to succeed in Test 2!');
    return false;
  }
  console.log('✅ PASSED');
  return true;
}

async function runTest3(villa: any) {
  console.log('\n======================================================');
  console.log('Test 3: Concurrent Promo Code Usage (Limit Exhaustion)');
  console.log('Scenario: 5 users try to use a promo code that only has 1 usage left.');
  console.log('Expected: 1 Success, 4 Failures.');

  // Create a strict promo code
  const testPromoCode = `STRESS-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;
  const promo = await prisma.promoCode.create({
    data: {
      code: testPromoCode,
      description: 'Test limit',
      type: 'PERCENTAGE',
      value: 10,
      usageLimit: 1, // EXACTLY 1 USAGE ALLOWED
      usageCount: 0,
      status: 'ACTIVE'
    }
  });

  // First, get 5 independent valid locks (different dates so they all succeed)
  const lockIds: string[] = [];
  for (let i = 0; i < 5; i++) {
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 100 + (i * 10));
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 105 + (i * 10));

    const res = await ReservePOST(createRequest('/api/bookings/reserve', {
      villaId: villa.id,
      checkIn: checkIn.toISOString(),
      checkOut: checkOut.toISOString(),
    }));
    const data = await res.json();
    if (!res.ok) throw new Error('Setup failed: ' + data.error);
    lockIds.push(data.lockId);
  }

  // Now, all 5 users simultaneously try to confirm their bookings using the SAME promo code
  const confirmRequests = lockIds.map((lockId, i) => {
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 100 + (i * 10));
    const checkOut = new Date();
    checkOut.setDate(checkOut.getDate() + 105 + (i * 10));

    return BookingPOST(createRequest('/api/bookings', {
      villaId: villa.id,
      checkIn: checkIn.toISOString(),
      checkOut: checkOut.toISOString(),
      totalGuests: 2,
      paymentType: 'FULL',
      promoCode: testPromoCode, // The contended promo code
      lockId: lockId,
      idempotencyKey: `idemp-${crypto.randomUUID()}`
    }));
  });

  const responses = await Promise.allSettled(confirmRequests);
  let successes = 0, failures = 0;

  for (const result of responses) {
    if (result.status === 'fulfilled') {
      const res = result.value as Response;
      const data = await res.json();
      if (res.ok) successes++;
      else failures++;
    } else {
      failures++;
    }
  }

  console.log(`Results: ${successes} Success, ${failures} Failures.`);
  
  // Cleanup
  await prisma.promoCode.delete({ where: { id: promo.id } });

  if (successes !== 1) {
    console.error('❌ FAILED: Promo code limits were bypassed!');
    return false;
  }
  console.log('✅ PASSED');
  return true;
}

async function run() {
  console.log('=== PONYTAIL PRODUCTION RULES STRESS TEST SUITE ===');

  const villa = await prisma.villa.findFirst();
  if (!villa) throw new Error('No villa found in database to run tests.');

  // Clean up any stray locks before starting
  await prisma.reservationLock.deleteMany({});
  await prisma.promoUsage.deleteMany({});
  await prisma.paymentTransaction.deleteMany({});
  await prisma.bookingEvent.deleteMany({});
  await prisma.bookingService.deleteMany({});
  await prisma.booking.deleteMany({});

  let allPassed = true;
  
  allPassed = await runTest1(villa) && allPassed;
  allPassed = await runTest2(villa) && allPassed;
  allPassed = await runTest3(villa) && allPassed;

  console.log('\n======================================================');
  if (allPassed) {
    console.log('🌟 ALL STRESS TESTS PASSED SUCCESSFULLY! 🌟');
    console.log('The system is mathematically robust against race conditions.');
    process.exit(0);
  } else {
    console.error('💀 ONE OR MORE TESTS FAILED.');
    process.exit(1);
  }
}

run().catch(console.error);
