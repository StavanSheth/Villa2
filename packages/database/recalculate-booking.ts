import { PrismaClient } from '@prisma/client';
import { calculateBookingPrice } from './queries/pricing';

const prisma = new PrismaClient();

async function fixBooking(bookingCode: string) {
  const booking = await prisma.booking.findUnique({
    where: { bookingCode },
    include: {
      orderTransactions: true,
      villa: {
        include: { pricingRules: true }
      },
      promoCode: true
    }
  });

  if (!booking) {
    console.error(`Booking ${bookingCode} not found!`);
    return;
  }

  // Build requested services from the current servicesSnapshot
  const currentServices = booking.servicesSnapshot as any[] || [];
  
  // Need to map them back to reqServices format for calculateBookingPrice
  // The snapshot has { name, total, quantity, unitPrice, chargeType }
  // We need to fetch the service definitions to get the IDs.
  const allServiceDefs = await prisma.serviceDef.findMany();
  
  const reqServices = currentServices.map(s => {
    const def = allServiceDefs.find(d => d.name === s.name);
    return {
      serviceId: def?.id || 'unknown',
      name: s.name,
      price: Number(s.unitPrice || 0),
      chargeType: s.chargeType,
      quantity: s.quantity || 1,
      type: def?.type || 'PAID'
    };
  });

  console.log('Recalculating price with services:', reqServices);

  const pricing = await calculateBookingPrice({
    checkIn: new Date(booking.checkIn),
    checkOut: new Date(booking.checkOut),
    selectedDates: undefined,
    pricingRules: booking.villa.pricingRules,
    services: reqServices,
    guests: booking.totalGuests,
    dailyGuestsCount: undefined,
    promoCode: booking.promoCode
  });

  console.log('New Pricing Calculated:', pricing.total);
  console.log('Old Pricing:', booking.currentTotal);

  if (Number(booking.currentTotal) !== pricing.total) {
    const orderValueDelta = pricing.total - Number(booking.currentTotal);
    
    // Update the booking
    await prisma.booking.update({
      where: { id: booking.id },
      data: {
        currentTotal: String(pricing.total),
        amountToBePaid: String(pricing.total - Number(booking.totalPaid))
      }
    });

    console.log(`Updated booking total to ${pricing.total}. Delta: ${orderValueDelta}`);

    // Update the latest transaction if needed or create a new one
    // For simplicity, we create a correction transaction
    const nextSrNo = booking.orderTransactions.length + 1;
    await prisma.orderTransaction.create({
      data: {
        srNo: nextSrNo,
        transactionTime: new Date(),
        bookingId: booking.id,
        actionType: 'SYSTEM_CORRECTION',
        actorRole: 'SYSTEM',
        previousState: booking.status,
        newState: booking.status,
        paymentType: 'N/A',
        refundTier: 'N/A',
        refundStatus: 'N/A',
        
        previousOrderTotal: booking.currentTotal,
        orderValueDelta: String(orderValueDelta),
        newOrderTotal: String(pricing.total),

        previousTotalPaid: booking.totalPaid,
        advancePaymentDelta: '0',
        balancePaymentDelta: '0',
        refundDueDelta: '0',
        refundPaidDelta: '0',
        
        newTotalPaid: booking.totalPaid,
        newTotalRefunded: booking.totalRefunded,
        newAdvancePaid: booking.totalAdvancePaid,
        newRemainingAmount: String(pricing.total - Number(booking.totalAdvancePaid)),
        newPendingRefund: booking.pendingRefund,
        newAmountToBePaid: String(pricing.total - Number(booking.totalPaid)),
      }
    });

    console.log('Created SYSTEM_CORRECTION order transaction.');
  } else {
    console.log('Price is already correct. No changes made.');
  }
}

fixBooking('MVN-2026-2653')
  .catch(console.error)
  .finally(() => prisma.$disconnect());
