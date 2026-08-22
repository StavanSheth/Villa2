import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up existing bookings...');
  
  await prisma.orderTransaction.deleteMany();
  await prisma.bookingEvent.deleteMany();
  await prisma.staySegment.deleteMany();
  await prisma.bookingService.deleteMany();
  await prisma.paymentTransaction.deleteMany();
  await prisma.invoiceItem.deleteMany();
  await prisma.invoice.deleteMany();
  await prisma.promoUsage.deleteMany();
  await prisma.booking.deleteMany();

  const user = await prisma.user.findFirst();
  const villa = await prisma.villa.findFirst();

  if (!user || !villa) {
    throw new Error('User or Villa not found.');
  }

  const baseBooking = {
    userId: user.id,
    villaId: villa.id,
    checkIn: new Date(),
    checkOut: new Date(),
    totalGuests: 2,
    status: 'CONFIRMED',
    currency: 'INR'
  };

  const getSnapshots = (config: number) => {
    switch (config) {
      // SCENARIO 1
      case 11: return {
        snapshotStaySegments: [{ checkIn: '2026-08-18', checkOut: '2026-08-19' }, { checkIn: '2026-08-24', checkOut: '2026-08-25' }],
        snapshotGuests: { '2026-08-18': { adults: 4, children: 2 }, '2026-08-24': { adults: 6, children: 2 } },
        snapshotServices: { '2026-08-18': ['Breakfast ×1', 'BBQ ×1', 'Decoration ×1'], '2026-08-24': ['Breakfast ×1', 'BBQ ×1'] }
      };
      case 12: return {
        snapshotStaySegments: [{ checkIn: '2026-08-18', checkOut: '2026-08-19' }, { checkIn: '2026-08-24', checkOut: '2026-08-25' }],
        snapshotGuests: { '2026-08-18': { adults: 4, children: 2 }, '2026-08-24': { adults: 8, children: 2 } },
        snapshotServices: { '2026-08-18': ['Breakfast ×1', 'BBQ ×2', 'Decoration ×1'], '2026-08-24': ['Breakfast ×1', 'BBQ ×2', 'Decoration ×1'] }
      };
      // SCENARIO 2
      case 21: return {
        snapshotStaySegments: [{ checkIn: '2026-08-15', checkOut: '2026-08-16' }, { checkIn: '2026-08-22', checkOut: '2026-08-23' }],
        snapshotGuests: { '2026-08-15': { adults: 8, children: 2 }, '2026-08-22': { adults: 6, children: 2 } },
        snapshotServices: { '2026-08-15': ['Breakfast ×1', 'BBQ ×2', 'Decoration ×2'], '2026-08-22': ['Breakfast ×1', 'BBQ ×2'] }
      };
      case 22: return {
        snapshotStaySegments: [{ checkIn: '2026-08-15', checkOut: '2026-08-16' }],
        snapshotGuests: { '2026-08-15': { adults: 8, children: 2 } },
        snapshotServices: { '2026-08-15': ['Breakfast ×1', 'BBQ ×1', 'Decoration ×1'] }
      };
      // SCENARIO 3
      case 31: return {
        snapshotStaySegments: [{ checkIn: '2026-08-20', checkOut: '2026-08-21' }, { checkIn: '2026-08-28', checkOut: '2026-08-29' }],
        snapshotGuests: { '2026-08-20': { adults: 4, children: 2 }, '2026-08-28': { adults: 6, children: 2 } },
        snapshotServices: { '2026-08-20': ['Breakfast ×1', 'BBQ ×2', 'Decoration ×1'], '2026-08-28': ['Breakfast ×1', 'BBQ ×2', 'Decoration ×2'] }
      };
      // SCENARIO 4
      case 41: return {
        snapshotStaySegments: [{ checkIn: '2026-09-01', checkOut: '2026-09-02' }, { checkIn: '2026-09-10', checkOut: '2026-09-11' }],
        snapshotGuests: { '2026-09-01': { adults: 5, children: 1 }, '2026-09-10': { adults: 6, children: 2 } },
        snapshotServices: { '2026-09-01': ['Breakfast ×1', 'BBQ ×1'], '2026-09-10': ['Breakfast ×1', 'BBQ ×2', 'Decoration ×1'] }
      };
      // SCENARIO 5
      case 51: return {
        snapshotStaySegments: [{ checkIn: '2026-08-14', checkOut: '2026-08-15' }, { checkIn: '2026-08-20', checkOut: '2026-08-21' }],
        snapshotGuests: { '2026-08-14': { adults: 4, children: 1 }, '2026-08-20': { adults: 5, children: 2 } },
        snapshotServices: { '2026-08-14': ['Breakfast ×1', 'BBQ ×1'], '2026-08-20': ['Breakfast ×1', 'BBQ ×2', 'Decoration ×1'] }
      };
      // SCENARIO 6
      case 61: return {
        snapshotStaySegments: [{ checkIn: '2026-08-18', checkOut: '2026-08-19' }, { checkIn: '2026-08-25', checkOut: '2026-08-26' }, { checkIn: '2026-08-30', checkOut: '2026-08-31' }],
        snapshotGuests: { '2026-08-18': { adults: 4, children: 2 }, '2026-08-25': { adults: 6, children: 2 }, '2026-08-30': { adults: 8, children: 2 } },
        snapshotServices: { '2026-08-18': ['Breakfast ×1', 'BBQ ×1'], '2026-08-25': ['Breakfast ×1', 'BBQ ×2'], '2026-08-30': ['Breakfast ×1', 'BBQ ×2', 'Decoration ×2'] }
      };
      case 62: return {
        snapshotStaySegments: [{ checkIn: '2026-08-18', checkOut: '2026-08-19' }, { checkIn: '2026-08-25', checkOut: '2026-08-26' }],
        snapshotGuests: { '2026-08-18': { adults: 4, children: 2 }, '2026-08-25': { adults: 6, children: 2 } },
        snapshotServices: { '2026-08-18': ['Breakfast ×1', 'BBQ ×1'], '2026-08-25': ['Breakfast ×1', 'BBQ ×2'] }
      };
      case 63: return {
        snapshotStaySegments: [{ checkIn: '2026-08-18', checkOut: '2026-08-19' }, { checkIn: '2026-08-25', checkOut: '2026-08-26' }, { checkIn: '2026-08-30', checkOut: '2026-08-31' }],
        snapshotGuests: { '2026-08-18': { adults: 4, children: 2 }, '2026-08-25': { adults: 6, children: 2 }, '2026-08-30': { adults: 8, children: 2 } },
        snapshotServices: { '2026-08-18': ['Breakfast ×1', 'BBQ ×1'], '2026-08-25': ['Breakfast ×1', 'BBQ ×2'], '2026-08-30': ['Breakfast ×1', 'BBQ ×2', 'Decoration ×2'] }
      };
      // SCENARIO 7
      case 71: return {
        snapshotStaySegments: [{ checkIn: '2026-08-18', checkOut: '2026-08-19' }, { checkIn: '2026-08-24', checkOut: '2026-08-25' }, { checkIn: '2026-08-30', checkOut: '2026-08-31' }],
        snapshotGuests: { '2026-08-18': { adults: 4, children: 2 }, '2026-08-24': { adults: 8, children: 2 }, '2026-08-30': { adults: 6, children: 2 } },
        snapshotServices: { '2026-08-18': ['Breakfast ×1', 'BBQ ×1'], '2026-08-24': ['Breakfast ×1', 'BBQ ×2', 'Decoration ×1'], '2026-08-30': ['Breakfast ×1', 'BBQ ×2'] }
      };
      case 72: return {
        snapshotStaySegments: [{ checkIn: '2026-08-18', checkOut: '2026-08-19' }, { checkIn: '2026-08-24', checkOut: '2026-08-25' }, { checkIn: '2026-08-30', checkOut: '2026-08-31' }],
        snapshotGuests: { '2026-08-18': { adults: 4, children: 2 }, '2026-08-24': { adults: 10, children: 2 }, '2026-08-30': { adults: 6, children: 2 } },
        snapshotServices: { '2026-08-18': ['Breakfast ×1', 'BBQ ×1'], '2026-08-24': ['Breakfast ×1', 'BBQ ×3', 'Decoration ×2'], '2026-08-30': ['Breakfast ×1', 'BBQ ×2'] }
      };
      case 74: return {
        snapshotStaySegments: [{ checkIn: '2026-08-18', checkOut: '2026-08-19' }, { checkIn: '2026-08-30', checkOut: '2026-08-31' }],
        snapshotGuests: { '2026-08-18': { adults: 4, children: 2 }, '2026-08-30': { adults: 6, children: 2 } },
        snapshotServices: { '2026-08-18': ['Breakfast ×1', 'BBQ ×1'], '2026-08-30': ['Breakfast ×1', 'BBQ ×2'] }
      };
      default: return {};
    }
  };

  console.log('Seeding Scenario 1...');
  await prisma.booking.create({
    data: {
      ...baseBooking, bookingCode: 'SCENARIO-1',
      currentTotal: 87500, totalAdvancePaid: 45000, totalPaid: 45000, amountToBePaid: 42500,
      orderTransactions: {
        create: [
          {
            srNo: 1, transactionTime: new Date('2026-08-11T15:25:00Z'),
            actionType: 'BOOKING_CREATED', actorRole: 'CUSTOMER', previousState: 'NEW', newState: 'CONFIRMED',
            paymentType: 'ADVANCE', refundTier: 'N/A', refundStatus: 'N/A',
            previousOrderTotal: 0, orderValueDelta: 80000, newOrderTotal: 80000,
            previousTotalPaid: 0, advancePaymentDelta: 25000, balancePaymentDelta: 0, refundDueDelta: 0, refundPaidDelta: 0,
            newTotalPaid: 25000, newTotalRefunded: 0, newAdvancePaid: 25000, newRemainingAmount: 55000, newPendingRefund: 0, newAmountToBePaid: 55000,
            ...getSnapshots(11)
          },
          {
            srNo: 2, transactionTime: new Date('2026-08-11T15:45:00Z'),
            actionType: 'EDIT_BOOKING', actorRole: 'CUSTOMER', previousState: 'CONFIRMED', newState: 'CONFIRMED',
            paymentType: 'ADVANCE', refundTier: 'N/A', refundStatus: 'NO_REFUND',
            previousOrderTotal: 80000, orderValueDelta: 7500, newOrderTotal: 87500,
            previousTotalPaid: 25000, advancePaymentDelta: 0, balancePaymentDelta: 0, refundDueDelta: 0, refundPaidDelta: 0,
            newTotalPaid: 25000, newTotalRefunded: 0, newAdvancePaid: 25000, newRemainingAmount: 62500, newPendingRefund: 0, newAmountToBePaid: 62500,
            ...getSnapshots(12)
          },
          {
            srNo: 3, transactionTime: new Date('2026-08-11T16:10:00Z'),
            actionType: 'ADVANCE_PAYMENT', actorRole: 'CUSTOMER', previousState: 'CONFIRMED', newState: 'CONFIRMED',
            paymentType: 'ADVANCE', refundTier: 'N/A', refundStatus: 'RECEIVED',
            previousOrderTotal: 87500, orderValueDelta: 0, newOrderTotal: 87500,
            previousTotalPaid: 25000, advancePaymentDelta: 20000, balancePaymentDelta: 0, refundDueDelta: 0, refundPaidDelta: 0,
            newTotalPaid: 45000, newTotalRefunded: 0, newAdvancePaid: 45000, newRemainingAmount: 42500, newPendingRefund: 0, newAmountToBePaid: 42500,
            ...getSnapshots(12)
          }
        ]
      }
    }
  });

  console.log('Seeding Scenario 2...');
  await prisma.booking.create({
    data: {
      ...baseBooking, bookingCode: 'SCENARIO-2', status: 'ADVANCE_PAID',
      currentTotal: 50000, totalAdvancePaid: 50000, totalPaid: 50000, totalRefunded: 10000, amountToBePaid: 0, pendingRefund: 0,
      orderTransactions: {
        create: [
          {
            srNo: 1, transactionTime: new Date('2026-08-11T14:00:00Z'),
            actionType: 'BOOKING_CREATED', actorRole: 'CUSTOMER', previousState: 'NEW', newState: 'CONFIRMED',
            paymentType: 'ADVANCE', refundTier: 'N/A', refundStatus: 'N/A',
            previousOrderTotal: 0, orderValueDelta: 90000, newOrderTotal: 90000,
            previousTotalPaid: 0, advancePaymentDelta: 60000, balancePaymentDelta: 0, refundDueDelta: 0, refundPaidDelta: 0,
            newTotalPaid: 60000, newTotalRefunded: 0, newAdvancePaid: 60000, newRemainingAmount: 30000, newPendingRefund: 0, newAmountToBePaid: 30000,
            ...getSnapshots(21)
          },
          {
            srNo: 2, transactionTime: new Date('2026-08-11T14:30:00Z'),
            actionType: 'EDIT_BOOKING', actorRole: 'CUSTOMER', previousState: 'ADVANCE_PAID', newState: 'ADVANCE_PAID',
            paymentType: 'ADVANCE', refundTier: '7-14 Days', refundStatus: 'REFUND_DUE',
            previousOrderTotal: 90000, orderValueDelta: -40000, newOrderTotal: 50000,
            previousTotalPaid: 60000, advancePaymentDelta: 0, balancePaymentDelta: 0, refundDueDelta: 10000, refundPaidDelta: 0,
            newTotalPaid: 60000, newTotalRefunded: 0, newAdvancePaid: 60000, newRemainingAmount: 0, newPendingRefund: 10000, newAmountToBePaid: 0,
            ...getSnapshots(22)
          },
          {
            srNo: 3, transactionTime: new Date('2026-08-11T14:45:00Z'),
            actionType: 'REFUND', actorRole: 'OWNER', previousState: 'REFUND_DUE', newState: 'REFUNDED',
            paymentType: 'REFUND', refundTier: '7-14 Days', refundStatus: 'REFUNDED',
            previousOrderTotal: 50000, orderValueDelta: 0, newOrderTotal: 50000,
            previousTotalPaid: 60000, advancePaymentDelta: -10000, balancePaymentDelta: 0, refundDueDelta: 0, refundPaidDelta: 10000,
            newTotalPaid: 50000, newTotalRefunded: 10000, newAdvancePaid: 50000, newRemainingAmount: 0, newPendingRefund: 0, newAmountToBePaid: 0,
            ...getSnapshots(22)
          }
        ]
      }
    }
  });

  console.log('Seeding Scenario 3...');
  await prisma.booking.create({
    data: {
      ...baseBooking, bookingCode: 'SCENARIO-3', status: 'PARTIALLY_CANCELLED',
      currentTotal: 60000, totalAdvancePaid: 30000, totalPaid: 30000, totalRefunded: 20000, amountToBePaid: 10000, pendingRefund: 0,
      orderTransactions: {
        create: [
          {
            srNo: 1, transactionTime: new Date('2026-08-11T15:00:00Z'),
            actionType: 'BOOKING_CREATED', actorRole: 'CUSTOMER', previousState: 'NEW', newState: 'CONFIRMED',
            paymentType: 'ADVANCE', refundTier: 'N/A', refundStatus: 'N/A',
            previousOrderTotal: 0, orderValueDelta: 100000, newOrderTotal: 100000,
            previousTotalPaid: 0, advancePaymentDelta: 50000, balancePaymentDelta: 0, refundDueDelta: 0, refundPaidDelta: 0,
            newTotalPaid: 50000, newTotalRefunded: 0, newAdvancePaid: 50000, newRemainingAmount: 50000, newPendingRefund: 0, newAmountToBePaid: 50000,
            ...getSnapshots(31)
          },
          {
            srNo: 2, transactionTime: new Date('2026-08-11T15:30:00Z'),
            actionType: 'CANCEL_STAY', actorRole: 'CUSTOMER', previousState: 'CONFIRMED', newState: 'PARTIALLY_CANCELLED',
            paymentType: 'ADVANCE', refundTier: '7-14 Days', refundStatus: 'REFUND_DUE',
            previousOrderTotal: 100000, orderValueDelta: -40000, newOrderTotal: 60000,
            previousTotalPaid: 50000, advancePaymentDelta: 0, balancePaymentDelta: 0, refundDueDelta: 20000, refundPaidDelta: 0,
            newTotalPaid: 50000, newTotalRefunded: 0, newAdvancePaid: 50000, newRemainingAmount: 10000, newPendingRefund: 20000, newAmountToBePaid: 10000,
            ...getSnapshots(31)
          },
          {
            srNo: 3, transactionTime: new Date('2026-08-11T15:45:00Z'),
            actionType: 'REFUND', actorRole: 'OWNER', previousState: 'REFUND_DUE', newState: 'REFUNDED',
            paymentType: 'REFUND', refundTier: '7-14 Days', refundStatus: 'REFUNDED',
            previousOrderTotal: 60000, orderValueDelta: 0, newOrderTotal: 60000,
            previousTotalPaid: 50000, advancePaymentDelta: -20000, balancePaymentDelta: 0, refundDueDelta: 0, refundPaidDelta: 20000,
            newTotalPaid: 30000, newTotalRefunded: 20000, newAdvancePaid: 30000, newRemainingAmount: 10000, newPendingRefund: 0, newAmountToBePaid: 10000,
            ...getSnapshots(31)
          }
        ]
      }
    }
  });

  console.log('Seeding Scenario 4...');
  await prisma.booking.create({
    data: {
      ...baseBooking, bookingCode: 'SCENARIO-4', status: 'CANCELLED',
      currentTotal: 0, totalAdvancePaid: 0, totalPaid: 0, totalRefunded: 40000, amountToBePaid: 0, pendingRefund: 0,
      orderTransactions: {
        create: [
          {
            srNo: 1, transactionTime: new Date('2026-08-11T16:00:00Z'),
            actionType: 'BOOKING_CREATED', actorRole: 'CUSTOMER', previousState: 'NEW', newState: 'CONFIRMED',
            paymentType: 'ADVANCE', refundTier: 'N/A', refundStatus: 'N/A',
            previousOrderTotal: 0, orderValueDelta: 75000, newOrderTotal: 75000,
            previousTotalPaid: 0, advancePaymentDelta: 40000, balancePaymentDelta: 0, refundDueDelta: 0, refundPaidDelta: 0,
            newTotalPaid: 40000, newTotalRefunded: 0, newAdvancePaid: 40000, newRemainingAmount: 35000, newPendingRefund: 0, newAmountToBePaid: 35000,
            ...getSnapshots(41)
          },
          {
            srNo: 2, transactionTime: new Date('2026-08-11T16:20:00Z'),
            actionType: 'CANCEL_BOOKING', actorRole: 'CUSTOMER', previousState: 'CONFIRMED', newState: 'CANCELLED',
            paymentType: 'ADVANCE', refundTier: '>14 Days', refundStatus: 'REFUND_DUE',
            previousOrderTotal: 75000, orderValueDelta: -75000, newOrderTotal: 0,
            previousTotalPaid: 40000, advancePaymentDelta: 0, balancePaymentDelta: 0, refundDueDelta: 40000, refundPaidDelta: 0,
            newTotalPaid: 40000, newTotalRefunded: 0, newAdvancePaid: 40000, newRemainingAmount: 0, newPendingRefund: 40000, newAmountToBePaid: 0,
            ...getSnapshots(41)
          },
          {
            srNo: 3, transactionTime: new Date('2026-08-11T16:30:00Z'),
            actionType: 'REFUND', actorRole: 'OWNER', previousState: 'REFUND_DUE', newState: 'REFUNDED',
            paymentType: 'REFUND', refundTier: '>14 Days', refundStatus: 'REFUNDED',
            previousOrderTotal: 0, orderValueDelta: 0, newOrderTotal: 0,
            previousTotalPaid: 40000, advancePaymentDelta: -40000, balancePaymentDelta: 0, refundDueDelta: 0, refundPaidDelta: 40000,
            newTotalPaid: 0, newTotalRefunded: 40000, newAdvancePaid: 0, newRemainingAmount: 0, newPendingRefund: 0, newAmountToBePaid: 0,
            ...getSnapshots(41)
          }
        ]
      }
    }
  });

  console.log('Seeding Scenario 5...');
  await prisma.booking.create({
    data: {
      ...baseBooking, bookingCode: 'SCENARIO-5', status: 'CANCELLED',
      currentTotal: 85000, totalAdvancePaid: 30000, totalPaid: 30000, totalRefunded: 0, amountToBePaid: 55000, pendingRefund: 0,
      orderTransactions: {
        create: [
          {
            srNo: 1, transactionTime: new Date('2026-08-11T17:00:00Z'),
            actionType: 'BOOKING_CREATED', actorRole: 'CUSTOMER', previousState: 'NEW', newState: 'CONFIRMED',
            paymentType: 'ADVANCE', refundTier: 'N/A', refundStatus: 'N/A',
            previousOrderTotal: 0, orderValueDelta: 85000, newOrderTotal: 85000,
            previousTotalPaid: 0, advancePaymentDelta: 30000, balancePaymentDelta: 0, refundDueDelta: 0, refundPaidDelta: 0,
            newTotalPaid: 30000, newTotalRefunded: 0, newAdvancePaid: 30000, newRemainingAmount: 55000, newPendingRefund: 0, newAmountToBePaid: 55000,
            ...getSnapshots(51)
          },
          {
            srNo: 2, transactionTime: new Date('2026-08-11T17:15:00Z'),
            actionType: 'CANCEL_BOOKING', actorRole: 'CUSTOMER', previousState: 'CONFIRMED', newState: 'CANCELLED',
            paymentType: 'ADVANCE', refundTier: '<7 Days', refundStatus: 'NO_REFUND',
            previousOrderTotal: 85000, orderValueDelta: 0, newOrderTotal: 85000,
            previousTotalPaid: 30000, advancePaymentDelta: 0, balancePaymentDelta: 0, refundDueDelta: 0, refundPaidDelta: 0,
            newTotalPaid: 30000, newTotalRefunded: 0, newAdvancePaid: 30000, newRemainingAmount: 55000, newPendingRefund: 0, newAmountToBePaid: 55000,
            ...getSnapshots(51)
          },
          {
            srNo: 3, transactionTime: new Date('2026-08-11T17:20:00Z'),
            actionType: 'CANCELLATION_CONFIRMED', actorRole: 'OWNER', previousState: 'CANCELLED', newState: 'CANCELLED',
            paymentType: 'ADVANCE', refundTier: '<7 Days', refundStatus: 'NO_REFUND',
            previousOrderTotal: 85000, orderValueDelta: 0, newOrderTotal: 85000,
            previousTotalPaid: 30000, advancePaymentDelta: 0, balancePaymentDelta: 0, refundDueDelta: 0, refundPaidDelta: 0,
            newTotalPaid: 30000, newTotalRefunded: 0, newAdvancePaid: 30000, newRemainingAmount: 55000, newPendingRefund: 0, newAmountToBePaid: 55000,
            ...getSnapshots(51)
          }
        ]
      }
    }
  });

  console.log('Seeding Scenario 6...');
  await prisma.booking.create({
    data: {
      ...baseBooking, bookingCode: 'SCENARIO-6', status: 'ADVANCE_PAID',
      currentTotal: 120000, totalAdvancePaid: 60000, totalPaid: 60000, totalRefunded: 10000, amountToBePaid: 30000, pendingRefund: 0,
      orderTransactions: {
        create: [
          {
            srNo: 1, transactionTime: new Date('2026-08-11T18:00:00Z'),
            actionType: 'BOOKING_CREATED', actorRole: 'CUSTOMER', previousState: 'NEW', newState: 'CONFIRMED',
            paymentType: 'ADVANCE', refundTier: 'N/A', refundStatus: 'N/A',
            previousOrderTotal: 0, orderValueDelta: 120000, newOrderTotal: 120000,
            previousTotalPaid: 0, advancePaymentDelta: 70000, balancePaymentDelta: 0, refundDueDelta: 0, refundPaidDelta: 0,
            newTotalPaid: 70000, newTotalRefunded: 0, newAdvancePaid: 70000, newRemainingAmount: 50000, newPendingRefund: 0, newAmountToBePaid: 50000,
            ...getSnapshots(61)
          },
          {
            srNo: 2, transactionTime: new Date('2026-08-11T18:15:00Z'),
            actionType: 'EDIT_BOOKING', actorRole: 'CUSTOMER', previousState: 'ADVANCE_PAID', newState: 'ADVANCE_PAID',
            paymentType: 'ADVANCE', refundTier: '7-14 Days', refundStatus: 'REFUND_DUE',
            previousOrderTotal: 120000, orderValueDelta: -60000, newOrderTotal: 60000,
            previousTotalPaid: 70000, advancePaymentDelta: 0, balancePaymentDelta: 0, refundDueDelta: 10000, refundPaidDelta: 0,
            newTotalPaid: 70000, newTotalRefunded: 0, newAdvancePaid: 70000, newRemainingAmount: 0, newPendingRefund: 10000, newAmountToBePaid: 0,
            ...getSnapshots(62)
          },
          {
            srNo: 3, transactionTime: new Date('2026-08-11T18:30:00Z'),
            actionType: 'REFUND', actorRole: 'OWNER', previousState: 'REFUND_DUE', newState: 'REFUNDED',
            paymentType: 'REFUND', refundTier: '7-14 Days', refundStatus: 'REFUNDED',
            previousOrderTotal: 60000, orderValueDelta: 0, newOrderTotal: 60000,
            previousTotalPaid: 70000, advancePaymentDelta: -10000, balancePaymentDelta: 0, refundDueDelta: 0, refundPaidDelta: 10000,
            newTotalPaid: 60000, newTotalRefunded: 10000, newAdvancePaid: 60000, newRemainingAmount: 0, newPendingRefund: 0, newAmountToBePaid: 0,
            ...getSnapshots(62)
          },
          {
            srNo: 4, transactionTime: new Date('2026-08-11T19:00:00Z'),
            actionType: 'EDIT_BOOKING', actorRole: 'CUSTOMER', previousState: 'REFUNDED', newState: 'ADVANCE_PAID',
            paymentType: 'ADVANCE', refundTier: 'N/A', refundStatus: 'N/A',
            previousOrderTotal: 60000, orderValueDelta: 30000, newOrderTotal: 90000,
            previousTotalPaid: 60000, advancePaymentDelta: 0, balancePaymentDelta: 0, refundDueDelta: 0, refundPaidDelta: 0,
            newTotalPaid: 60000, newTotalRefunded: 10000, newAdvancePaid: 60000, newRemainingAmount: 30000, newPendingRefund: 0, newAmountToBePaid: 30000,
            ...getSnapshots(63)
          }
        ]
      }
    }
  });

  console.log('Seeding Scenario 7...');
  await prisma.booking.create({
    data: {
      ...baseBooking, bookingCode: 'SCENARIO-7', status: 'REFUNDED',
      currentTotal: 92000, totalAdvancePaid: 50000, totalPaid: 50000, totalRefunded: 15000, amountToBePaid: 27000, pendingRefund: 0,
      orderTransactions: {
        create: [
          {
            srNo: 1, transactionTime: new Date('2026-08-11T20:00:00Z'),
            actionType: 'BOOKING_CREATED', actorRole: 'CUSTOMER', previousState: 'NEW', newState: 'CONFIRMED',
            paymentType: 'ADVANCE', refundTier: 'N/A', refundStatus: 'N/A',
            previousOrderTotal: 0, orderValueDelta: 110000, newOrderTotal: 110000,
            previousTotalPaid: 0, advancePaymentDelta: 40000, balancePaymentDelta: 0, refundDueDelta: 0, refundPaidDelta: 0,
            newTotalPaid: 40000, newTotalRefunded: 0, newAdvancePaid: 40000, newRemainingAmount: 70000, newPendingRefund: 0, newAmountToBePaid: 70000,
            ...getSnapshots(71)
          },
          {
            srNo: 2, transactionTime: new Date('2026-08-11T20:20:00Z'),
            actionType: 'EDIT_BOOKING', actorRole: 'CUSTOMER', previousState: 'ADVANCE_PAID', newState: 'ADVANCE_PAID',
            paymentType: 'ADVANCE', refundTier: 'N/A', refundStatus: 'NO_REFUND',
            previousOrderTotal: 110000, orderValueDelta: 12000, newOrderTotal: 122000,
            previousTotalPaid: 40000, advancePaymentDelta: 0, balancePaymentDelta: 0, refundDueDelta: 0, refundPaidDelta: 0,
            newTotalPaid: 40000, newTotalRefunded: 0, newAdvancePaid: 40000, newRemainingAmount: 82000, newPendingRefund: 0, newAmountToBePaid: 82000,
            ...getSnapshots(72)
          },
          {
            srNo: 3, transactionTime: new Date('2026-08-11T20:40:00Z'),
            actionType: 'ADVANCE_PAYMENT', actorRole: 'CUSTOMER', previousState: 'ADVANCE_PAID', newState: 'ADVANCE_PAID',
            paymentType: 'ADVANCE', refundTier: 'N/A', refundStatus: 'RECEIVED',
            previousOrderTotal: 122000, orderValueDelta: 0, newOrderTotal: 122000,
            previousTotalPaid: 40000, advancePaymentDelta: 25000, balancePaymentDelta: 0, refundDueDelta: 0, refundPaidDelta: 0,
            newTotalPaid: 65000, newTotalRefunded: 0, newAdvancePaid: 65000, newRemainingAmount: 57000, newPendingRefund: 0, newAmountToBePaid: 57000,
            ...getSnapshots(72)
          },
          {
            srNo: 4, transactionTime: new Date('2026-08-11T21:00:00Z'),
            actionType: 'CANCEL_STAY', actorRole: 'CUSTOMER', previousState: 'ADVANCE_PAID', newState: 'ADVANCE_PAID',
            paymentType: 'ADVANCE', refundTier: '7-14 Days', refundStatus: 'REFUND_DUE',
            previousOrderTotal: 122000, orderValueDelta: -30000, newOrderTotal: 92000,
            previousTotalPaid: 65000, advancePaymentDelta: 0, balancePaymentDelta: 0, refundDueDelta: 15000, refundPaidDelta: 0,
            newTotalPaid: 65000, newTotalRefunded: 0, newAdvancePaid: 65000, newRemainingAmount: 27000, newPendingRefund: 15000, newAmountToBePaid: 27000,
            ...getSnapshots(74)
          },
          {
            srNo: 5, transactionTime: new Date('2026-08-11T21:15:00Z'),
            actionType: 'REFUND', actorRole: 'OWNER', previousState: 'REFUND_DUE', newState: 'REFUNDED',
            paymentType: 'REFUND', refundTier: '7-14 Days', refundStatus: 'REFUNDED',
            previousOrderTotal: 92000, orderValueDelta: 0, newOrderTotal: 92000,
            previousTotalPaid: 65000, advancePaymentDelta: -15000, balancePaymentDelta: 0, refundDueDelta: 0, refundPaidDelta: 15000,
            newTotalPaid: 50000, newTotalRefunded: 15000, newAdvancePaid: 50000, newRemainingAmount: 27000, newPendingRefund: 0, newAmountToBePaid: 27000,
            ...getSnapshots(74)
          }
        ]
      }
    }
  });

    console.log('Successfully seeded 7 test scenarios.');
}

main().catch(console.error).finally(() => prisma.$disconnect());
