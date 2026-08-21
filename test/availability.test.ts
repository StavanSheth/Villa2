import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { prisma } from '@villa-platform/database';
// Import the handlers directly to run them within vitest environment
import { POST as blockRoute } from '../apps/owner/src/app/api/bookings/block/route';
import { POST as reserveRoute } from '../apps/booking/src/app/api/bookings/reserve/route';

describe('Category 7: Owner Edits & Availability Blocks', () => {
  let villaId: string;
  let userId: string;

  beforeAll(async () => {
    // Setup test data
    const user = await prisma.user.findFirst();
    userId = user!.id;

    const villa = await prisma.villa.create({
      data: {
        name: 'Test Block Villa',
        description: 'Testing availability blocks',
        basePrice: 500,
        capacity: 4,
        bedrooms: 2,
        bathrooms: 2,
      }
    });
    villaId = villa.id;
  });

  afterAll(async () => {
    // Delete booking events linked to the bookings we are about to delete
    await prisma.bookingEvent.deleteMany({
      where: { booking: { villaId } }
    });
    await prisma.booking.deleteMany({ where: { villaId } });
    await prisma.reservationLock.deleteMany({ where: { villaId } });
    await prisma.villa.delete({ where: { id: villaId } });
  });

  it('Scenario 7A: Owner successfully blocks out dates', async () => {
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 10);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + 5);

    const req = new Request('http://localhost/api/bookings/block', {
      method: 'POST',
      body: JSON.stringify({
        villaId,
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
        reason: 'Renovation'
      })
    });

    const res = await blockRoute(req);
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.status).toBe('BLOCKED');
    expect(data.specialReqs).toBe('Renovation');
  });

  it('Scenario 7B: Concurrency Race - Owner blocks vs Customer reserves exactly simultaneously', async () => {
    const checkIn = new Date();
    checkIn.setDate(checkIn.getDate() + 20);
    const checkOut = new Date(checkIn);
    checkOut.setDate(checkOut.getDate() + 5);

    // Create the customer reservation request
    const customerReq = new Request('http://localhost/api/bookings/reserve', {
      method: 'POST',
      body: JSON.stringify({
        villaId,
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
      })
    });

    // Create the owner block request for the EXACT same dates
    const ownerReq = new Request('http://localhost/api/bookings/block', {
      method: 'POST',
      body: JSON.stringify({
        villaId,
        checkIn: checkIn.toISOString(),
        checkOut: checkOut.toISOString(),
        reason: 'Maintenance'
      })
    });

    // Fire both requests concurrently
    const [customerRes, ownerRes] = await Promise.allSettled([
      reserveRoute(customerReq),
      blockRoute(ownerReq)
    ]);

    // Read responses
    const cRes = customerRes.status === 'fulfilled' ? customerRes.value : null;
    const oRes = ownerRes.status === 'fulfilled' ? ownerRes.value : null;

    // Both requests must complete
    expect(cRes).not.toBeNull();
    expect(oRes).not.toBeNull();

    // EXCLUSIVE OR: Only ONE should succeed (status 200), the other should fail (status 409 Conflict)
    const cStatus = cRes!.status;
    const oStatus = oRes!.status;

    expect(
      (cStatus === 200 && oStatus === 409) ||
      (oStatus === 200 && cStatus === 409)
    ).toBe(true);

    if (cStatus === 409) {
      const errorData = await cRes!.json();
      expect(errorData.error).toBeDefined();
    }
  });
});
