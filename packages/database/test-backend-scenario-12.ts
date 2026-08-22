import { POST as createBooking } from '../../apps/booking/src/app/api/booking-engine/create/route';
import { PATCH as updateBooking } from '../../apps/booking/src/app/api/bookings/[id]/route';
import { prisma } from './index';

async function main() {
  console.log('Testing Scenario 12 through REAL BACKEND logic...\n');
  
  const mockReq = (body: any) => new Request('http://localhost:3000/api/mock', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  const mockPatchReq = (body: any) => new Request('http://localhost:3000/api/mock', {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body)
  });

  // Segments for Scenario 12 initial booking
  const segments = [
    {
      checkIn: '2026-09-01', checkOut: '2026-09-02',
      accommodation: 30000,
      guests: [{ date: '2026-09-01', adults: 4, children: 0 }],
      services: [
        { name: 'Breakfast', qty: 4, unitPrice: 500 },
        { name: 'Decoration', qty: 1, unitPrice: 3000 }
      ],
      status: 'ACTIVE'
    },
    {
      checkIn: '2026-09-02', checkOut: '2026-09-04',
      accommodation: 35000,
      guests: [{ date: '2026-09-02', adults: 4, children: 2 }],
      services: [
        { name: 'BBQ', qty: 2, unitPrice: 2500 },
        { name: 'BBQ Setup', qty: 1, unitPrice: 1500 }
      ],
      status: 'ACTIVE'
    },
    {
      checkIn: '2026-09-04', checkOut: '2026-09-05',
      accommodation: 25000,
      guests: [{ date: '2026-09-04', adults: 2, children: 0 }],
      services: [
        { name: 'Photography', qty: 1, unitPrice: 6000 }
      ],
      status: 'ACTIVE'
    }
  ];

  // 1. Create Booking
  console.log('--- ACTION 1: CREATE BOOKING (Advance: 50,000) ---');
  const createRes = await createBooking(mockReq({
    mode: 'CUSTOMER',
    paymentType: 'ADVANCE',
    paymentRequired: true,
    segments // Passing advanced segments!
  }));
  const createData = await createRes.json();
  const bookingCode = createData.booking.bookingCode;
  
  // Need to get the DB record to see what it actually stored
  let dbBooking = await prisma.booking.findUnique({ where: { bookingCode }});
  console.log('Order Total:', dbBooking?.currentTotal);
  console.log('Total Paid:', dbBooking?.totalPaid);
  console.log('Amount To Be Paid:', dbBooking?.amountToBePaid);
  console.log('Pending Refund:', dbBooking?.pendingRefund);
  
  // 2. Edit Booking (Increase BBQ from 2 to 3)
  console.log('\n--- ACTION 2: EDIT BOOKING (BBQ 2 -> 3) ---');
  // Copy segments and change BBQ qty
  const editedSegments = JSON.parse(JSON.stringify(segments));
  editedSegments[1].services[0].qty = 3;
  
  await updateBooking(mockPatchReq({
    action: 'EDIT_BOOKING',
    actorRole: 'CUSTOMER',
    metadata: {
      stateForEngine: {
        segments: editedSegments,
        cleaningFee: 1500, discount: 0,
        totalPaid: 50000, advancePaid: 50000, balancePaid: 0,
        totalRefunded: 0, pendingRefund: 0, status: 'ADVANCE_PAID'
      }
    }
  }), { params: Promise.resolve({ id: bookingCode }) });
  
  dbBooking = await prisma.booking.findUnique({ where: { bookingCode }});
  console.log('Order Total:', dbBooking?.currentTotal);
  console.log('Amount To Be Paid:', dbBooking?.amountToBePaid);

  // 3. Balance Payment
  console.log('\n--- ACTION 3: BALANCE PAYMENT (20,000) ---');
  await updateBooking(mockPatchReq({
    action: 'COLLECT_REMAINING',
    actorRole: 'OWNER',
    metadata: { paymentType: 'BALANCE', amount: 20000 }
  }), { params: Promise.resolve({ id: bookingCode }) });
  
  dbBooking = await prisma.booking.findUnique({ where: { bookingCode }});
  console.log('Total Paid:', dbBooking?.totalPaid);
  console.log('Amount To Be Paid:', dbBooking?.amountToBePaid);

  // 4. Cancel Segment 3
  console.log('\n--- ACTION 4: CANCEL SEGMENT 3 ---');
  const cancelledSegments = JSON.parse(JSON.stringify(editedSegments));
  cancelledSegments[2].status = 'CANCELLED';
  
  await updateBooking(mockPatchReq({
    action: 'CANCEL_STAY_SEGMENT',
    actorRole: 'CUSTOMER',
    metadata: {
      stateForEngine: {
        segments: cancelledSegments,
        cleaningFee: 1500, discount: 0,
        totalPaid: 70000, advancePaid: 50000, balancePaid: 20000,
        totalRefunded: 0, pendingRefund: 0, status: 'ADVANCE_PAID'
      }
    }
  }), { params: Promise.resolve({ id: bookingCode }) });
  
  dbBooking = await prisma.booking.findUnique({ where: { bookingCode }});
  console.log('Order Total:', dbBooking?.currentTotal);
  console.log('Pending Refund:', dbBooking?.pendingRefund);
  console.log('Amount To Be Paid:', dbBooking?.amountToBePaid);

  // 5. Issue Refund
  console.log('\n--- ACTION 5: ISSUE REFUND ---');
  await updateBooking(mockPatchReq({
    action: 'ISSUE_REFUND',
    actorRole: 'OWNER',
    metadata: { amount: Number(dbBooking?.pendingRefund || 0) }
  }), { params: Promise.resolve({ id: bookingCode }) });
  
  dbBooking = await prisma.booking.findUnique({ where: { bookingCode }});
  console.log('Pending Refund:', dbBooking?.pendingRefund);
  console.log('Total Refunded:', dbBooking?.totalRefunded);
  
  const netPaid = Number(dbBooking?.totalPaid) - Number(dbBooking?.totalRefunded);
  
  console.log('\n--- FINAL RECONCILIATION ---');
  console.log(`Order Total: ₹${dbBooking?.currentTotal}`);
  console.log(`Net Paid: ₹${netPaid}`);
  console.log(`Amount To Be Paid: ₹${dbBooking?.amountToBePaid}`);
  
  const reconciles = (Number(dbBooking?.currentTotal) === netPaid + Number(dbBooking?.amountToBePaid));
  console.log(`Reconciliation (Rule 8): ${reconciles ? '✅ PASS' : '❌ FAIL'}`);

}

main().catch(console.error);
