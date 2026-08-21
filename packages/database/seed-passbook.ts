import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function wipeData() {
  console.log('Wiping old data...');
  await prisma.staySegment.deleteMany();
  await prisma.orderTransaction.deleteMany();
  await prisma.bookingEvent.deleteMany();
  await prisma.paymentTransaction.deleteMany();
  await prisma.promoUsage.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.bookingService.deleteMany();
  await prisma.review.deleteMany();
  await prisma.booking.deleteMany();
}

async function createBookingWithLedger(
  bookingCode: string,
  userId: string,
  villaId: string,
  checkIn: string,
  checkOut: string,
  finalState: any,
  transactions: any[]
) {
  const booking = await prisma.booking.create({
    data: {
      bookingCode,
      userId,
      villaId,
      checkIn: new Date(`${checkIn}T14:00:00Z`),
      checkOut: new Date(`${checkOut}T11:00:00Z`),
      totalGuests: 12,
      currency: 'INR',
      
      currentTotal: finalState.currentTotal,
      totalPaid: finalState.totalPaid,
      totalAdvancePaid: finalState.totalAdvancePaid,
      totalBalancePaid: finalState.totalBalancePaid,
      totalRefunded: finalState.totalRefunded,
      pendingRefund: finalState.pendingRefund,
      amountToBePaid: finalState.amountToBePaid,
      
      status: finalState.status,
      bookingType: 'NORMAL',
      bookingSource: 'WEBSITE',
      paymentRequired: true,
      
      orderTransactions: {
        create: transactions.map((t, idx) => ({
          srNo: idx + 1,
          transactionTime: new Date(t.editTime),
          actionType: t.action.split(' / ')[0].trim().replace(/ /g, '_'),
          actorRole: t.action.split(' / ')[1]?.trim() || 'SYSTEM',
          previousState: t.stateChange.split('→')[0].trim().replace(/ /g, '_'),
          newState: t.stateChange.split('→')[1].trim().replace(/ /g, '_'),
          
          paymentType: t.paymentType,
          refundTier: t.refundTier,
          refundStatus: t.refundStatus,
          
          previousOrderTotal: t.prevTotal || 0,
          orderValueDelta: t.orderDelta || 0,
          newOrderTotal: t.newTotal || 0,
          
          previousTotalPaid: t.prevPaid || 0,
          advancePaymentDelta: t.advDelta || 0,
          balancePaymentDelta: t.balDelta || 0,
          refundDueDelta: t.refundDueDelta || 0,
          refundPaidDelta: t.refundPaidDelta || 0,
          
          newTotalPaid: t.newTotalPaid || 0,
          newAdvancePaid: t.advancePaid,
          newTotalRefunded: t.totalRefunded || 0,
          newRemainingAmount: t.remainingAmount,
          newPendingRefund: t.refundAmount,
          newAmountToBePaid: t.amountToBePaid,
          
          // Store exact rendered arrays for the UI to display directly
          snapshotStaySegments: t.stays,
          snapshotGuests: t.guests,
          snapshotServices: t.services,
        }))
      },

      events: {
        create: transactions.map((t) => ({
          actorId: userId,
          actorRole: t.action.split(' / ')[1]?.trim() || 'SYSTEM',
          action: t.action.split(' / ')[0].trim().replace(/ /g, '_'),
          oldState: t.stateChange.split('→')[0].trim().replace(/ /g, '_'),
          newState: t.stateChange.split('→')[1].trim().replace(/ /g, '_'),
          createdAt: new Date(t.editTime),
          metadata: {
            actionAmountStr: t.actionAmountStr
          }
        }))
      }
    }
  });
  console.log(`Created ${bookingCode}`);
}

async function main() {
  await wipeData();

  const customer = await prisma.user.findFirst({ where: { email: 'customer1@mavon.online' } }) 
    || await prisma.user.findFirst({ where: { email: 'passbook-cust@example.com' } })
    || await prisma.user.create({ data: { email: 'passbook-cust@example.com', firstName: 'Passbook', lastName: 'Customer', firebaseUid: `PB_CUST_${Date.now()}` } });
  
  const villa = await prisma.villa.findFirst();
  if (!villa) throw new Error("No villa found");

  const vId = villa.id;
  const cId = customer.id;

  // SCENARIO 1
  await createBookingWithLedger('PB-SCENARIO-1', cId, vId, '2026-08-18', '2026-08-25', {
    currentTotal: 87500, totalPaid: 45000, totalAdvancePaid: 45000, totalBalancePaid: 0,
    totalRefunded: 0, pendingRefund: 0, amountToBePaid: 42500, status: 'CONFIRMED'
  }, [
    {
      editTime: '2026-08-11T15:25:00',
      action: 'BOOKING CREATED / CUSTOMER', stateChange: 'NEW → CONFIRMED',
      stays: ['Aug 18–Aug 19', 'Aug 24–Aug 25'],
      guests: ['Aug 18: 4A, 2C', 'Aug 24: 6A, 2C'],
      services: ['Aug 18:\nBreakfast ×1\nBBQ ×1\nDecoration ×1', 'Aug 24:\nBreakfast ×1\nBBQ ×1'],
      paymentType: 'ADVANCE', refundTier: 'N/A', refundStatus: 'N/A', actionAmountStr: '₹80,000',
      prevTotal: 0, orderDelta: 80000, newTotal: 80000, prevPaid: 0, advDelta: 25000, newTotalPaid: 25000,
      balance: 0, advancePaid: 25000, remainingAmount: 55000, refundAmount: 0, amountToBePaid: 55000
    },
    {
      editTime: '2026-08-11T15:45:00',
      action: 'EDIT BOOKING / CUSTOMER', stateChange: 'CONFIRMED → CONFIRMED',
      stays: ['Aug 18–Aug 19', 'Aug 24–Aug 25'],
      guests: ['Aug 18: 4A, 2C', 'Aug 24: 8A, 2C'],
      services: ['Aug 18:\nBreakfast ×1\nBBQ ×2\nDecoration ×1', 'Aug 24:\nBreakfast ×1\nBBQ ×2\nDecoration ×1'],
      paymentType: 'ADVANCE', refundTier: 'N/A', refundStatus: 'NO REFUND DUE', actionAmountStr: '+₹7,500',
      prevTotal: 80000, orderDelta: 7500, newTotal: 87500, prevPaid: 25000, advDelta: 0, newTotalPaid: 25000,
      balance: 0, advancePaid: 25000, remainingAmount: 62500, refundAmount: 0, amountToBePaid: 62500
    },
    {
      editTime: '2026-08-11T16:10:00',
      action: 'ADVANCE PAYMENT / CUSTOMER', stateChange: 'CONFIRMED → CONFIRMED',
      stays: ['Aug 18–Aug 19', 'Aug 24–Aug 25'],
      guests: ['Aug 18: 4A, 2C', 'Aug 24: 8A, 2C'],
      services: ['Aug 18:\nBreakfast ×1\nBBQ ×2\nDecoration ×1', 'Aug 24:\nBreakfast ×1\nBBQ ×2\nDecoration ×1'],
      paymentType: 'ADVANCE', refundTier: 'N/A', refundStatus: 'RECEIVED', actionAmountStr: '₹20,000 CR',
      prevTotal: 87500, orderDelta: 0, newTotal: 87500, prevPaid: 25000, advDelta: 20000, newTotalPaid: 45000,
      balance: 0, advancePaid: 45000, remainingAmount: 42500, refundAmount: 0, amountToBePaid: 42500
    }
  ]);

  // SCENARIO 2
  await createBookingWithLedger('PB-SCENARIO-2', cId, vId, '2026-08-15', '2026-08-16', {
    currentTotal: 50000, totalPaid: 50000, totalAdvancePaid: 50000, totalBalancePaid: 0,
    totalRefunded: 10000, pendingRefund: 0, amountToBePaid: 0, status: 'REFUNDED'
  }, [
    {
      editTime: '2026-08-11T14:00:00',
      action: 'BOOKING CREATED / CUSTOMER', stateChange: 'NEW → CONFIRMED',
      stays: ['Aug 15–Aug 16', 'Aug 22–Aug 23'],
      guests: ['Aug 15: 8A, 2C', 'Aug 22: 6A, 2C'],
      services: ['Aug 15:\nBreakfast ×1\nBBQ ×2\nDecoration ×2', 'Aug 22:\nBreakfast ×1\nBBQ ×2'],
      paymentType: 'ADVANCE', refundTier: 'N/A', refundStatus: 'N/A', actionAmountStr: '₹90,000',
      prevTotal: 0, orderDelta: 90000, newTotal: 90000, prevPaid: 0, advDelta: 60000, newTotalPaid: 60000,
      balance: 0, advancePaid: 60000, remainingAmount: 30000, refundAmount: 0, amountToBePaid: 30000
    },
    {
      editTime: '2026-08-11T14:30:00',
      action: 'EDIT BOOKING / CUSTOMER', stateChange: 'ADVANCE_PAID → ADVANCE_PAID',
      stays: ['Aug 15–Aug 16'],
      guests: ['Aug 15: 8A, 2C'],
      services: ['Aug 15:\nBreakfast ×1\nBBQ ×1\nDecoration ×1'],
      paymentType: 'ADVANCE', refundTier: '7–14 Days', refundStatus: 'REFUND DUE', actionAmountStr: '−₹40,000',
      prevTotal: 90000, orderDelta: -40000, newTotal: 50000, prevPaid: 60000, advDelta: 0, newTotalPaid: 60000,
      balance: 0, advancePaid: 60000, remainingAmount: 0, refundAmount: 10000, amountToBePaid: 0
    },
    {
      editTime: '2026-08-11T14:45:00',
      action: 'REFUND / OWNER', stateChange: 'REFUND_DUE → REFUNDED',
      stays: ['Aug 15–Aug 16'],
      guests: ['Aug 15: 8A, 2C'],
      services: ['Aug 15:\nBreakfast ×1\nBBQ ×1\nDecoration ×1'],
      paymentType: 'REFUND', refundTier: '7–14 Days', refundStatus: 'REFUNDED', actionAmountStr: '₹10,000 CR',
      prevTotal: 50000, orderDelta: 0, newTotal: 50000, prevPaid: 60000, advDelta: -10000, newTotalPaid: 50000, totalRefunded: 10000,
      balance: 0, advancePaid: 50000, remainingAmount: 0, refundAmount: 0, amountToBePaid: 0
    }
  ]);

  // SCENARIO 3
  await createBookingWithLedger('PB-SCENARIO-3', cId, vId, '2026-08-20', '2026-08-21', {
    currentTotal: 60000, totalPaid: 30000, totalAdvancePaid: 30000, totalBalancePaid: 0,
    totalRefunded: 20000, pendingRefund: 0, amountToBePaid: 10000, status: 'REFUNDED'
  }, [
    {
      editTime: '2026-08-11T12:00:00',
      action: 'BOOKING CREATED / CUSTOMER', stateChange: 'NEW → CONFIRMED',
      stays: ['Aug 20–Aug 21', 'Aug 28–Aug 29'],
      guests: ['Aug 20: 4A, 2C', 'Aug 28: 6A, 2C'],
      services: ['Aug 20:\nBreakfast ×1\nBBQ ×2\nDecoration ×1', 'Aug 28:\nBreakfast ×1\nBBQ ×2\nDecoration ×2'],
      paymentType: 'ADVANCE', refundTier: 'N/A', refundStatus: 'N/A', actionAmountStr: '₹100,000',
      prevTotal: 0, orderDelta: 100000, newTotal: 100000, prevPaid: 0, advDelta: 50000, newTotalPaid: 50000,
      balance: 0, advancePaid: 50000, remainingAmount: 50000, refundAmount: 0, amountToBePaid: 50000
    },
    {
      editTime: '2026-08-11T12:15:00',
      action: 'CANCEL STAY / CUSTOMER', stateChange: 'CONFIRMED → PARTIALLY_CANCELLED',
      stays: ['Aug 20–Aug 21', 'Aug 28–Aug 29'],
      guests: ['Aug 20: 4A, 2C', 'Aug 28: 6A, 2C'],
      services: ['Aug 20:\nBreakfast ×1\nBBQ ×2\nDecoration ×1', 'Aug 28:\nBreakfast ×1\nBBQ ×2\nDecoration ×2'],
      paymentType: 'ADVANCE', refundTier: '7–14 Days', refundStatus: 'REFUND DUE', actionAmountStr: '−₹40,000',
      prevTotal: 100000, orderDelta: -40000, newTotal: 60000, prevPaid: 50000, advDelta: 0, newTotalPaid: 50000,
      balance: 0, advancePaid: 50000, remainingAmount: 10000, refundAmount: 20000, amountToBePaid: 10000
    },
    {
      editTime: '2026-08-11T12:30:00',
      action: 'REFUND / OWNER', stateChange: 'REFUND_DUE → REFUNDED',
      stays: ['Aug 20–Aug 21', 'Aug 28–Aug 29'],
      guests: ['Aug 20: 4A, 2C', 'Aug 28: 6A, 2C'],
      services: ['Aug 20:\nBreakfast ×1\nBBQ ×2\nDecoration ×1', 'Aug 28:\nBreakfast ×1\nBBQ ×2\nDecoration ×2'],
      paymentType: 'REFUND', refundTier: '7–14 Days', refundStatus: 'REFUNDED', actionAmountStr: '₹20,000 CR',
      prevTotal: 60000, orderDelta: 0, newTotal: 60000, prevPaid: 50000, advDelta: -20000, newTotalPaid: 30000, totalRefunded: 20000,
      balance: 0, advancePaid: 30000, remainingAmount: 10000, refundAmount: 0, amountToBePaid: 10000
    }
  ]);

  // SCENARIO 4
  await createBookingWithLedger('PB-SCENARIO-4', cId, vId, '2026-09-01', '2026-09-02', {
    currentTotal: 0, totalPaid: 0, totalAdvancePaid: 0, totalBalancePaid: 0,
    totalRefunded: 40000, pendingRefund: 0, amountToBePaid: 0, status: 'REFUNDED'
  }, [
    {
      editTime: '2026-08-11T11:00:00',
      action: 'BOOKING CREATED / CUSTOMER', stateChange: 'NEW → CONFIRMED',
      stays: ['Sep 01–Sep 02', 'Sep 10–Sep 11'],
      guests: ['Sep 01: 5A, 1C', 'Sep 10: 6A, 2C'],
      services: ['Sep 01:\nBreakfast ×1\nBBQ ×1', 'Sep 10:\nBreakfast ×1\nBBQ ×2\nDecoration ×1'],
      paymentType: 'ADVANCE', refundTier: 'N/A', refundStatus: 'N/A', actionAmountStr: '₹75,000',
      prevTotal: 0, orderDelta: 75000, newTotal: 75000, prevPaid: 0, advDelta: 40000, newTotalPaid: 40000,
      balance: 0, advancePaid: 40000, remainingAmount: 35000, refundAmount: 0, amountToBePaid: 35000
    },
    {
      editTime: '2026-08-11T11:30:00',
      action: 'CANCEL BOOKING / CUSTOMER', stateChange: 'CONFIRMED → CANCELLED',
      stays: ['Sep 01–Sep 02', 'Sep 10–Sep 11'],
      guests: ['Sep 01: 5A, 1C', 'Sep 10: 6A, 2C'],
      services: ['Sep 01:\nBreakfast ×1\nBBQ ×1', 'Sep 10:\nBreakfast ×1\nBBQ ×2\nDecoration ×1'],
      paymentType: 'ADVANCE', refundTier: '>14 Days', refundStatus: 'REFUND DUE', actionAmountStr: '−₹75,000',
      prevTotal: 75000, orderDelta: -75000, newTotal: 0, prevPaid: 40000, advDelta: 0, newTotalPaid: 40000,
      balance: 0, advancePaid: 40000, remainingAmount: 0, refundAmount: 40000, amountToBePaid: 0
    },
    {
      editTime: '2026-08-11T11:45:00',
      action: 'REFUND / OWNER', stateChange: 'REFUND_DUE → REFUNDED',
      stays: ['Sep 01–Sep 02', 'Sep 10–Sep 11'],
      guests: ['Sep 01: 5A, 1C', 'Sep 10: 6A, 2C'],
      services: ['Sep 01:\nBreakfast ×1\nBBQ ×1', 'Sep 10:\nBreakfast ×1\nBBQ ×2\nDecoration ×1'],
      paymentType: 'REFUND', refundTier: '>14 Days', refundStatus: 'REFUNDED', actionAmountStr: '₹40,000 CR',
      prevTotal: 0, orderDelta: 0, newTotal: 0, prevPaid: 40000, advDelta: -40000, newTotalPaid: 0, totalRefunded: 40000,
      balance: 0, advancePaid: 0, remainingAmount: 0, refundAmount: 0, amountToBePaid: 0
    }
  ]);

  // SCENARIO 5
  await createBookingWithLedger('PB-SCENARIO-5', cId, vId, '2026-08-14', '2026-08-15', {
    currentTotal: 85000, totalPaid: 30000, totalAdvancePaid: 30000, totalBalancePaid: 0,
    totalRefunded: 0, pendingRefund: 0, amountToBePaid: 55000, status: 'CANCELLED'
  }, [
    {
      editTime: '2026-08-11T10:00:00',
      action: 'BOOKING CREATED / CUSTOMER', stateChange: 'NEW → CONFIRMED',
      stays: ['Aug 14–Aug 15', 'Aug 20–Aug 21'],
      guests: ['Aug 14: 4A, 1C', 'Aug 20: 5A, 2C'],
      services: ['Aug 14:\nBreakfast ×1\nBBQ ×1', 'Aug 20:\nBreakfast ×1\nBBQ ×2\nDecoration ×1'],
      paymentType: 'ADVANCE', refundTier: 'N/A', refundStatus: 'N/A', actionAmountStr: '₹85,000',
      prevTotal: 0, orderDelta: 85000, newTotal: 85000, prevPaid: 0, advDelta: 30000, newTotalPaid: 30000,
      balance: 0, advancePaid: 30000, remainingAmount: 55000, refundAmount: 0, amountToBePaid: 55000
    },
    {
      editTime: '2026-08-11T10:30:00',
      action: 'CANCEL BOOKING / CUSTOMER', stateChange: 'CONFIRMED → CANCELLED',
      stays: ['Aug 14–Aug 15', 'Aug 20–Aug 21'],
      guests: ['Aug 14: 4A, 1C', 'Aug 20: 5A, 2C'],
      services: ['Aug 14:\nBreakfast ×1\nBBQ ×1', 'Aug 20:\nBreakfast ×1\nBBQ ×2\nDecoration ×1'],
      paymentType: 'ADVANCE', refundTier: '<7 Days', refundStatus: 'NO REFUND DUE', actionAmountStr: '₹0',
      prevTotal: 85000, orderDelta: 0, newTotal: 85000, prevPaid: 30000, advDelta: 0, newTotalPaid: 30000,
      balance: 0, advancePaid: 30000, remainingAmount: 55000, refundAmount: 0, amountToBePaid: 55000
    },
    {
      editTime: '2026-08-11T10:45:00',
      action: 'CANCELLATION CONFIRMED / OWNER', stateChange: 'CANCELLED → CANCELLED',
      stays: ['Aug 14–Aug 15', 'Aug 20–Aug 21'],
      guests: ['Aug 14: 4A, 1C', 'Aug 20: 5A, 2C'],
      services: ['Aug 14:\nBreakfast ×1\nBBQ ×1', 'Aug 20:\nBreakfast ×1\nBBQ ×2\nDecoration ×1'],
      paymentType: 'ADVANCE', refundTier: '<7 Days', refundStatus: 'NO REFUND DUE', actionAmountStr: '₹0',
      prevTotal: 85000, orderDelta: 0, newTotal: 85000, prevPaid: 30000, advDelta: 0, newTotalPaid: 30000,
      balance: 0, advancePaid: 30000, remainingAmount: 55000, refundAmount: 0, amountToBePaid: 55000
    }
  ]);

  // SCENARIO 6
  await createBookingWithLedger('PB-SCENARIO-6', cId, vId, '2026-08-18', '2026-08-19', {
    currentTotal: 90000, totalPaid: 60000, totalAdvancePaid: 60000, totalBalancePaid: 0,
    totalRefunded: 10000, pendingRefund: 0, amountToBePaid: 30000, status: 'ADVANCE_PAID'
  }, [
    {
      editTime: '2026-08-11T09:00:00',
      action: 'BOOKING CREATED / CUSTOMER', stateChange: 'NEW → CONFIRMED',
      stays: ['Aug 18–Aug 19', 'Aug 25–Aug 26', 'Aug 30–Aug 31'],
      guests: ['Aug 18: 4A, 2C', 'Aug 25: 6A, 2C', 'Aug 30: 8A, 2C'],
      services: ['Aug 18:\nBreakfast ×1\nBBQ ×1', 'Aug 25:\nBreakfast ×1\nBBQ ×2', 'Aug 30:\nBreakfast ×1\nBBQ ×2\nDecoration ×2'],
      paymentType: 'ADVANCE', refundTier: 'N/A', refundStatus: 'N/A', actionAmountStr: '₹120,000',
      prevTotal: 0, orderDelta: 120000, newTotal: 120000, prevPaid: 0, advDelta: 70000, newTotalPaid: 70000,
      balance: 0, advancePaid: 70000, remainingAmount: 50000, refundAmount: 0, amountToBePaid: 50000
    },
    {
      editTime: '2026-08-11T09:30:00',
      action: 'EDIT BOOKING / CUSTOMER', stateChange: 'ADVANCE_PAID → ADVANCE_PAID',
      stays: ['Aug 18–Aug 19', 'Aug 25–Aug 26'],
      guests: ['Aug 18: 4A, 2C', 'Aug 25: 6A, 2C'],
      services: ['Aug 18:\nBreakfast ×1\nBBQ ×1', 'Aug 25:\nBreakfast ×1\nBBQ ×2'],
      paymentType: 'ADVANCE', refundTier: '7–14 Days', refundStatus: 'REFUND DUE', actionAmountStr: '−₹60,000',
      prevTotal: 120000, orderDelta: -60000, newTotal: 60000, prevPaid: 70000, advDelta: 0, newTotalPaid: 70000,
      balance: 0, advancePaid: 70000, remainingAmount: 0, refundAmount: 10000, amountToBePaid: 0
    },
    {
      editTime: '2026-08-11T09:45:00',
      action: 'REFUND / OWNER', stateChange: 'REFUND_DUE → REFUNDED',
      stays: ['Aug 18–Aug 19', 'Aug 25–Aug 26'],
      guests: ['Aug 18: 4A, 2C', 'Aug 25: 6A, 2C'],
      services: ['Aug 18:\nBreakfast ×1\nBBQ ×1', 'Aug 25:\nBreakfast ×1\nBBQ ×2'],
      paymentType: 'REFUND', refundTier: '7–14 Days', refundStatus: 'REFUNDED', actionAmountStr: '₹10,000 CR',
      prevTotal: 60000, orderDelta: 0, newTotal: 60000, prevPaid: 70000, advDelta: -10000, newTotalPaid: 60000, totalRefunded: 10000,
      balance: 0, advancePaid: 60000, remainingAmount: 0, refundAmount: 0, amountToBePaid: 0
    },
    {
      editTime: '2026-08-11T10:15:00',
      action: 'EDIT BOOKING / CUSTOMER', stateChange: 'REFUNDED → ADVANCE_PAID',
      stays: ['Aug 18–Aug 19', 'Aug 25–Aug 26', 'Aug 30–Aug 31'],
      guests: ['Aug 18: 4A, 2C', 'Aug 25: 6A, 2C', 'Aug 30: 8A, 2C'],
      services: ['Aug 18:\nBreakfast ×1\nBBQ ×1', 'Aug 25:\nBreakfast ×1\nBBQ ×2', 'Aug 30:\nBreakfast ×1\nBBQ ×2\nDecoration ×2'],
      paymentType: 'ADVANCE', refundTier: 'N/A', refundStatus: 'N/A', actionAmountStr: '+₹30,000',
      prevTotal: 60000, orderDelta: 30000, newTotal: 90000, prevPaid: 60000, advDelta: 0, newTotalPaid: 60000,
      balance: 0, advancePaid: 60000, remainingAmount: 30000, refundAmount: 0, amountToBePaid: 30000
    }
  ]);

  // SCENARIO 7
  await createBookingWithLedger('PB-SCENARIO-7', cId, vId, '2026-08-18', '2026-08-19', {
    currentTotal: 92000, totalPaid: 50000, totalAdvancePaid: 50000, totalBalancePaid: 0,
    totalRefunded: 15000, pendingRefund: 0, amountToBePaid: 27000, status: 'ADVANCE_PAID'
  }, [
    {
      editTime: '2026-08-11T08:00:00',
      action: 'BOOKING CREATED / CUSTOMER', stateChange: 'NEW → CONFIRMED',
      stays: ['Aug 18–Aug 19', 'Aug 24–Aug 25', 'Aug 30–Aug 31'],
      guests: ['Aug 18: 4A, 2C', 'Aug 24: 8A, 2C', 'Aug 30: 6A, 2C'],
      services: ['Aug 18:\nBreakfast ×1\nBBQ ×1', 'Aug 24:\nBreakfast ×1\nBBQ ×2\nDecoration ×1', 'Aug 30:\nBreakfast ×1\nBBQ ×2'],
      paymentType: 'ADVANCE', refundTier: 'N/A', refundStatus: 'N/A', actionAmountStr: '₹110,000',
      prevTotal: 0, orderDelta: 110000, newTotal: 110000, prevPaid: 0, advDelta: 40000, newTotalPaid: 40000,
      balance: 0, advancePaid: 40000, remainingAmount: 70000, refundAmount: 0, amountToBePaid: 70000
    },
    {
      editTime: '2026-08-11T08:30:00',
      action: 'EDIT BOOKING / CUSTOMER', stateChange: 'ADVANCE_PAID → ADVANCE_PAID',
      stays: ['Aug 18–Aug 19', 'Aug 24–Aug 25', 'Aug 30–Aug 31'],
      guests: ['Aug 18: 4A, 2C', 'Aug 24: 10A, 2C', 'Aug 30: 6A, 2C'],
      services: ['Aug 18:\nBreakfast ×1\nBBQ ×1', 'Aug 24:\nBreakfast ×1\nBBQ ×3\nDecoration ×2', 'Aug 30:\nBreakfast ×1\nBBQ ×2'],
      paymentType: 'ADVANCE', refundTier: 'N/A', refundStatus: 'NO REFUND DUE', actionAmountStr: '+₹12,000',
      prevTotal: 110000, orderDelta: 12000, newTotal: 122000, prevPaid: 40000, advDelta: 0, newTotalPaid: 40000,
      balance: 0, advancePaid: 40000, remainingAmount: 82000, refundAmount: 0, amountToBePaid: 82000
    },
    {
      editTime: '2026-08-11T08:45:00',
      action: 'ADVANCE PAYMENT / CUSTOMER', stateChange: 'ADVANCE_PAID → ADVANCE_PAID',
      stays: ['Aug 18–Aug 19', 'Aug 24–Aug 25', 'Aug 30–Aug 31'],
      guests: ['Aug 18: 4A, 2C', 'Aug 24: 10A, 2C', 'Aug 30: 6A, 2C'],
      services: ['Aug 18:\nBreakfast ×1\nBBQ ×1', 'Aug 24:\nBreakfast ×1\nBBQ ×3\nDecoration ×2', 'Aug 30:\nBreakfast ×1\nBBQ ×2'],
      paymentType: 'ADVANCE', refundTier: 'N/A', refundStatus: 'RECEIVED', actionAmountStr: '₹25,000 CR',
      prevTotal: 122000, orderDelta: 0, newTotal: 122000, prevPaid: 40000, advDelta: 25000, newTotalPaid: 65000,
      balance: 0, advancePaid: 65000, remainingAmount: 57000, refundAmount: 0, amountToBePaid: 57000
    },
    {
      editTime: '2026-08-11T09:15:00',
      action: 'CANCEL STAY / CUSTOMER', stateChange: 'ADVANCE_PAID → ADVANCE_PAID',
      stays: ['Aug 18–Aug 19', 'Aug 24–Aug 25', 'Aug 30–Aug 31'],
      guests: ['Aug 18: 4A, 2C', 'Aug 24: 10A, 2C', 'Aug 30: 6A, 2C'],
      services: ['Aug 18:\nBreakfast ×1\nBBQ ×1', 'Aug 24:\nBreakfast ×1\nBBQ ×3\nDecoration ×2', 'Aug 30:\nBreakfast ×1\nBBQ ×2'],
      paymentType: 'ADVANCE', refundTier: '7–14 Days', refundStatus: 'REFUND DUE', actionAmountStr: '−₹30,000',
      prevTotal: 122000, orderDelta: -30000, newTotal: 92000, prevPaid: 65000, advDelta: 0, newTotalPaid: 65000,
      balance: 0, advancePaid: 65000, remainingAmount: 27000, refundAmount: 15000, amountToBePaid: 27000
    },
    {
      editTime: '2026-08-11T09:30:00',
      action: 'REFUND / OWNER', stateChange: 'REFUND_DUE → REFUNDED',
      stays: ['Aug 18–Aug 19', 'Aug 24–Aug 25', 'Aug 30–Aug 31'],
      guests: ['Aug 18: 4A, 2C', 'Aug 24: 10A, 2C', 'Aug 30: 6A, 2C'],
      services: ['Aug 18:\nBreakfast ×1\nBBQ ×1', 'Aug 24:\nBreakfast ×1\nBBQ ×3\nDecoration ×2', 'Aug 30:\nBreakfast ×1\nBBQ ×2'],
      paymentType: 'REFUND', refundTier: '7–14 Days', refundStatus: 'REFUNDED', actionAmountStr: '₹15,000 CR',
      prevTotal: 92000, orderDelta: 0, newTotal: 92000, prevPaid: 65000, advDelta: -15000, newTotalPaid: 50000, totalRefunded: 15000,
      balance: 0, advancePaid: 50000, remainingAmount: 27000, refundAmount: 0, amountToBePaid: 27000
    }
  ]);
}

main().catch(console.error).finally(() => prisma.$disconnect());
