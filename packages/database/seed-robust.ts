import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

const generateCode = () => 'BK-' + Math.random().toString(36).substring(7).toUpperCase();
const addDays = (date: Date, days: number) => { const r = new Date(date); r.setDate(r.getDate() + days); return r; };

async function main() {
  console.log('Starting Master Permutation Test Data Injection...');

  // 1. Get Owner/Admin
  const owners = await prisma.user.findMany({
    where: { email: { in: ['admin@villaplatform.com', 'owner@villaplatform.com', 'stavan@example.com'] } } 
  });
  const ownerIds = owners.map(o => o.id);

  // 2. Wipe ALL old test data except villas, owners, etc.
  await prisma.staySegment.deleteMany();
  await prisma.bookingEvent.deleteMany();
  await prisma.paymentTransaction.deleteMany();
  await prisma.promoUsage.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.bookingService.deleteMany();
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
  await prisma.user.deleteMany({ where: { id: { notIn: ownerIds } } });
  await prisma.serviceDef.deleteMany();

  // 3. Create Villa Services (Master List)
  const svcs = [
    { name: 'Breakfast', chargeType: 'PER_GUEST', price: 500, category: 'FOOD' },
    { name: 'Lunch', chargeType: 'PER_GUEST', price: 800, category: 'FOOD' },
    { name: 'Dinner', chargeType: 'PER_GUEST', price: 900, category: 'FOOD' },
    { name: 'BBQ', chargeType: 'PER_BOOKING', price: 2500, category: 'FOOD' },
    { name: 'Bonfire', chargeType: 'PER_BOOKING', price: 1500, category: 'ACTIVITY' },
    { name: 'Swimming pool access', chargeType: 'COMPLIMENTARY', price: 0, category: 'ACTIVITY' },
    { name: 'Decoration', chargeType: 'PER_BOOKING', price: 3000, category: 'VILLA' },
    { name: 'Event setup', chargeType: 'PER_BOOKING', price: 5000, category: 'VILLA' },
    { name: 'Private chef', chargeType: 'PER_DAY', price: 4000, category: 'SPECIAL' },
    { name: 'Photography', chargeType: 'PER_BOOKING', price: 6000, category: 'SPECIAL' },
    { name: 'Airport pickup', chargeType: 'PER_BOOKING', price: 2000, category: 'TRANSPORT' },
    { name: 'Housekeeping', chargeType: 'COMPLIMENTARY', price: 0, category: 'VILLA' },
  ];
  const createdSvcs = await Promise.all(svcs.map(s => prisma.serviceDef.create({ data: { ...s, type: s.price === 0 ? 'COMPLIMENTARY' : 'PAID' } })));
  const svcMap = createdSvcs.reduce((acc, s) => ({ ...acc, [s.name]: s }), {} as any);

  // 4. Create Customers
  const customerA = await prisma.user.create({ data: { email: 'customerA@example.com', firstName: 'Customer', lastName: 'A (Heavy Test)', firebaseUid: 'A_UID' } });
  const customerB = await prisma.user.create({ data: { email: 'customerB@example.com', firstName: 'Customer', lastName: 'B (Stress Test)', firebaseUid: 'B_UID' } });

  const villa = await prisma.villa.findFirst();
  if (!villa) throw new Error('No villa found');

  const now = new Date();

  // Helper to create a fully fleshed out booking
  async function createBooking(b: any) {
    const booking = await prisma.booking.create({
      data: {
        bookingCode: generateCode(),
        userId: b.customer.id,
        villaId: villa!.id,
        checkIn: b.checkIn,
        checkOut: b.checkOut,
        status: b.status || 'CONFIRMED',
        totalGuests: b.guests || 2,
        currentTotal: b.total,
        totalPaid: b.paid,
        cancellationRefund: b.refund || 0,
        services: {
          create: b.services?.map((s: string) => ({
            serviceId: svcMap[s].id,
            name: svcMap[s].name,
            totalPrice: svcMap[s].price,
            quantity: 1
          })) || []
        },
        segments: {
          create: b.segments?.map((seg: any) => ({
            checkIn: seg.checkIn,
            checkOut: seg.checkOut,
            status: seg.status || 'ACTIVE'
          })) || [{ checkIn: b.checkIn, checkOut: b.checkOut }]
        },
        events: {
          create: b.events?.map((ev: any) => ({
            actorId: (ev.actor === 'ADMIN' && ownerIds[0]) ? ownerIds[0] : b.customer.id,
            actorRole: ev.actorRole || (ev.actor === 'ADMIN' ? 'SUPER_ADMIN' : 'CUSTOMER'),
            action: ev.action,
            oldState: ev.oldState || 'UNKNOWN',
            newState: ev.newState || 'UNKNOWN',
            metadata: ev.metadata || {},
            createdAt: ev.date || new Date()
          })) || [{
            actorId: b.customer.id, actorRole: 'CUSTOMER', action: 'CREATE', newState: b.status || 'CONFIRMED'
          }]
        }
      }
    });
    return booking;
  }

  // --- CUSTOMER A SCENARIOS ---

  // A01 Basic single-segment booking
  await createBooking({
    customer: customerA, checkIn: addDays(now, 10), checkOut: addDays(now, 12),
    total: 20000, paid: 10000, status: 'CONFIRMED', services: ['Breakfast', 'Dinner']
  });

  // A02 Single stay + multiple services
  await createBooking({
    customer: customerA, checkIn: addDays(now, 15), checkOut: addDays(now, 18),
    total: 35000, paid: 15000, status: 'PENDING',
    services: ['Breakfast', 'Lunch', 'Dinner', 'BBQ', 'Bonfire', 'Housekeeping']
  });

  // A03 Stay date edited (extended) -> Payment Required
  await createBooking({
    customer: customerA, checkIn: addDays(now, 20), checkOut: addDays(now, 24),
    total: 40000, paid: 10000, status: 'AWAITING_PAYMENT', services: ['Breakfast', 'Dinner'],
    events: [{ action: 'EDIT_DATES', oldState: 'CONFIRMED', newState: 'AWAITING_PAYMENT' }]
  });

  // A04 Stay shortened -> Refund required
  await createBooking({
    customer: customerA, checkIn: addDays(now, -10), checkOut: addDays(now, -8),
    total: 20000, paid: 50000, refund: 30000, status: 'COMPLETED', services: ['Breakfast', 'Dinner', 'BBQ'],
    events: [{ action: 'EDIT_DATES', oldState: 'CONFIRMED', newState: 'CONFIRMED' }]
  });

  // A05 Service added after booking -> Payment Required
  await createBooking({
    customer: customerA, checkIn: addDays(now, 25), checkOut: addDays(now, 28),
    total: 38000, paid: 30000, status: 'AWAITING_PAYMENT', services: ['Breakfast', 'BBQ', 'Bonfire', 'Decoration'],
    events: [{ action: 'ADD_SERVICE', oldState: 'CONFIRMED', newState: 'AWAITING_PAYMENT' }]
  });

  // A06 Service removed -> Refund required
  await createBooking({
    customer: customerA, checkIn: addDays(now, 30), checkOut: addDays(now, 33),
    total: 25000, paid: 30000, refund: 5000, status: 'CONFIRMED', services: ['Breakfast', 'Lunch', 'Dinner'],
    events: [{ action: 'REMOVE_SERVICE', oldState: 'CONFIRMED', newState: 'CONFIRMED' }]
  });

  // A07 Two separate stay segments
  await createBooking({
    customer: customerA, checkIn: addDays(now, 40), checkOut: addDays(now, 46),
    total: 40000, paid: 40000, status: 'CONFIRMED', services: ['Breakfast', 'Dinner', 'BBQ'],
    segments: [
      { checkIn: addDays(now, 40), checkOut: addDays(now, 41) },
      { checkIn: addDays(now, 44), checkOut: addDays(now, 46) }
    ]
  });

  // A08 Three stay segments
  await createBooking({
    customer: customerA, checkIn: addDays(now, 50), checkOut: addDays(now, 59),
    total: 60000, paid: 30000, status: 'PENDING', services: ['Breakfast', 'Lunch', 'Bonfire', 'Dinner', 'BBQ', 'Decoration'],
    segments: [
      { checkIn: addDays(now, 50), checkOut: addDays(now, 51) },
      { checkIn: addDays(now, 53), checkOut: addDays(now, 54) },
      { checkIn: addDays(now, 57), checkOut: addDays(now, 59) }
    ]
  });

  // A09 Multi-Edit History (V1 -> V5)
  await createBooking({
    customer: customerA, checkIn: addDays(now, -5), checkOut: addDays(now, -3),
    total: 18000, paid: 25000, refund: 7000, status: 'COMPLETED', services: ['Breakfast', 'Bonfire', 'Decoration'],
    events: [
      { action: 'CREATE', date: addDays(now, -30) },
      { action: 'EDIT_DATES', date: addDays(now, -25) },
      { action: 'EDIT_SERVICES', date: addDays(now, -20) },
      { action: 'EDIT_DATES', date: addDays(now, -15) },
      { action: 'EDIT_SERVICES', date: addDays(now, -10) }
    ]
  });

  // A10 Full Cancellation before stay
  await createBooking({
    customer: customerA, checkIn: addDays(now, 60), checkOut: addDays(now, 65),
    total: 50000, paid: 25000, refund: 25000, status: 'CANCELLED', services: ['Breakfast', 'Dinner', 'BBQ'],
    events: [{ action: 'CANCEL', oldState: 'CONFIRMED', newState: 'CANCELLED' }]
  });

  // A11 Partial Service Cancellation
  await createBooking({
    customer: customerA, checkIn: addDays(now, 70), checkOut: addDays(now, 72),
    total: 20000, paid: 22500, refund: 2500, status: 'CONFIRMED', services: ['Breakfast', 'Lunch', 'Dinner'],
    events: [{ action: 'CANCEL_SERVICE', oldState: 'CONFIRMED', newState: 'CONFIRMED' }] // BBQ cancelled
  });

  // A12 Partial stay-segment cancellation
  await createBooking({
    customer: customerA, checkIn: addDays(now, 80), checkOut: addDays(now, 85),
    total: 20000, paid: 40000, refund: 20000, status: 'CONFIRMED', services: ['Breakfast'],
    segments: [
      { checkIn: addDays(now, 80), checkOut: addDays(now, 81), status: 'ACTIVE' },
      { checkIn: addDays(now, 83), checkOut: addDays(now, 85), status: 'CANCELLED' }
    ],
    events: [{ action: 'CANCEL_SEGMENT', oldState: 'CONFIRMED', newState: 'CONFIRMED' }]
  });

  // A13 Cancellation after multiple edits
  await createBooking({
    customer: customerA, checkIn: addDays(now, 90), checkOut: addDays(now, 92),
    total: 25000, paid: 10000, refund: 10000, status: 'CANCELLED', services: ['Breakfast', 'BBQ'],
    events: [
      { action: 'CREATE' }, { action: 'EDIT_DATES' }, { action: 'EDIT_SERVICES' }, { action: 'CANCEL' }
    ]
  });

  // A14 Refund -> Re-edit -> Payment
  await createBooking({
    customer: customerA, checkIn: addDays(now, 100), checkOut: addDays(now, 103),
    total: 35000, paid: 20000, refund: 5000, status: 'AWAITING_PAYMENT', services: ['Breakfast', 'Dinner', 'Bonfire'],
    events: [
      { action: 'EDIT_DATES' }, // shortened, generated refund
      { action: 'EDIT_SERVICES' } // added bonfire and extended, requires payment again
    ]
  });

  // A15 - Audit Log Scenario: Edit -> Advance Exceeds New Amount -> Refund
  await createBooking({
    customer: customerA, checkIn: addDays(now, 110), checkOut: addDays(now, 112),
    total: 18000, // NEW_AMOUNT_2
    paid: 30000, // ADVANCE_PAID
    refund: 12000, // REFUND_DUE (ADVANCE_PAID - NEW_AMOUNT_2)
    status: 'COMPLETED',
    services: ['Breakfast', 'Dinner'],
    events: [
      {
        action: 'CREATE', newState: 'CONFIRMED',
        metadata: { originalAmount: 40000, advancePaid: 30000 }
      },
      {
        action: 'PAYMENT_RECEIVED', oldState: 'CONFIRMED', newState: 'CONFIRMED',
        metadata: { paymentStatus: 'PARTIALLY_PAID', amount: 30000 }
      },
      {
        action: 'EDIT_DATES',
        metadata: { before: 'Day 1 -> Day 5', after: 'Day 1 -> Day 3', priceBefore: 40000, priceAfter: 25000 }
      },
      {
        action: 'REFUND_TRIGGERED_BY_EDIT',
        metadata: { reason: 'ADVANCE_EXCEEDS_CURRENT_ORDER_AMOUNT', advancePaid: 30000, currentAmount: 25000, refundDue: 5000, refundStatus: 'PENDING' }
      },
      {
        action: 'EDIT_SERVICES',
        metadata: { removed: ['BBQ', 'Bonfire', 'Decoration'], remaining: ['Breakfast', 'Dinner'], priceBefore: 25000, priceAfter: 18000 }
      },
      {
        action: 'REFUND_AMOUNT_RECALCULATED',
        metadata: { reason: 'ORDER_AMOUNT_REDUCED_AFTER_PREVIOUS_EDIT', advancePaid: 30000, currentAmount: 18000, previousRefundDue: 5000, currentRefundDue: 12000, refundStatus: 'PENDING' }
      },
      {
        action: 'REFUND_REQUESTED',
        metadata: { refundAmount: 12000, reason: 'ADVANCE_EXCEEDS_FINAL_ORDER_AMOUNT', status: 'REFUND_PENDING' }
      },
      {
        action: 'REFUND_APPROVED', actor: 'ADMIN', actorRole: 'SUPER_ADMIN',
        metadata: { refundAmount: 12000, approved: true }
      },
      {
        action: 'REFUND_PROCESSED', actorRole: 'SYSTEM',
        metadata: { refundAmount: 12000, refundStatus: 'REFUNDED', paymentLedger: 'UPDATED', bookingLedger: 'UPDATED' }
      }
    ]
  });


  // --- CUSTOMER B SCENARIOS ---

  // B01 No service
  await createBooking({
    customer: customerB, checkIn: addDays(now, 10), checkOut: addDays(now, 12),
    total: 20000, paid: 10000, status: 'CONFIRMED'
  });

  // B02 Many services
  await createBooking({
    customer: customerB, checkIn: addDays(now, 15), checkOut: addDays(now, 18),
    total: 50000, paid: 50000, status: 'CONFIRMED',
    services: ['Breakfast', 'Lunch', 'Dinner', 'BBQ', 'Bonfire', 'Private chef', 'Decoration', 'Photography', 'Airport pickup']
  });

  // B03 Service-only modification
  await createBooking({
    customer: customerB, checkIn: addDays(now, 20), checkOut: addDays(now, 23),
    total: 34000, paid: 20000, status: 'AWAITING_PAYMENT', services: ['Breakfast', 'BBQ', 'Bonfire'],
    events: [{ action: 'EDIT_SERVICES', oldState: 'CONFIRMED', newState: 'AWAITING_PAYMENT' }]
  });

  // B04 Advance < new price -> PAYMENT_REQUIRED
  await createBooking({
    customer: customerB, checkIn: addDays(now, 25), checkOut: addDays(now, 29),
    total: 45000, paid: 10000, status: 'AWAITING_PAYMENT', services: ['Breakfast', 'Dinner', 'BBQ', 'Bonfire']
  });

  // B05 Advance > new price -> REFUND_REQUIRED
  await createBooking({
    customer: customerB, checkIn: addDays(now, 35), checkOut: addDays(now, 37),
    total: 20000, paid: 70000, refund: 50000, status: 'CONFIRMED', services: ['Breakfast']
  });

  // B06 Advance == new price
  await createBooking({
    customer: customerB, checkIn: addDays(now, 40), checkOut: addDays(now, 43),
    total: 30000, paid: 30000, refund: 0, status: 'FULLY_PAID', services: ['Breakfast']
  });

  // B07 Multi-segment + cancellation + edit
  await createBooking({
    customer: customerB, checkIn: addDays(now, 50), checkOut: addDays(now, 60),
    total: 45000, paid: 50000, refund: 5000, status: 'CONFIRMED', services: ['Breakfast', 'Bonfire'],
    segments: [
      { checkIn: addDays(now, 50), checkOut: addDays(now, 51), status: 'ACTIVE' },
      { checkIn: addDays(now, 53), checkOut: addDays(now, 55), status: 'CANCELLED' },
      { checkIn: addDays(now, 57), checkOut: addDays(now, 60), status: 'ACTIVE' }
    ]
  });

  // B08 Full lifecycle stress case (Version 1 -> Version 7 Cancelled)
  await createBooking({
    customer: customerB, checkIn: addDays(now, 70), checkOut: addDays(now, 74),
    total: 48000, paid: 48000, refund: 48000, status: 'CANCELLED', services: ['Breakfast', 'Decoration', 'Private chef', 'Photography'],
    events: [
      { action: 'CREATE' }, { action: 'EDIT_DATES' }, { action: 'PAYMENT_RECEIVED' },
      { action: 'EDIT_SERVICES' }, { action: 'EDIT_DATES' }, { action: 'CANCEL_SERVICE' },
      { action: 'EDIT_SERVICES' }, { action: 'CANCEL' }
    ]
  });

  console.log('Successfully injected all 22 Master Permutation bookings!');
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(async () => await prisma.$disconnect());
