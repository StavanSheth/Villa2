import { PrismaClient, Booking, OrderTransaction } from '@prisma/client';

export type LedgerTransactionInput = {
  actionType: string;
  actorRole: string;
  paymentType?: string;
  refundTier?: string;
  refundStatus?: string;
  orderValueDelta?: number;
  advancePaymentDelta?: number;
  balancePaymentDelta?: number;
  refundDueDelta?: number;
  refundPaidDelta?: number;
  snapshotStaySegments?: any;
  snapshotServices?: any;
  snapshotGuests?: any;
};

export async function processLedgerTransaction(
  prisma: Omit<PrismaClient, '$connect' | '$disconnect' | '$on' | '$transaction' | '$use' | '$extends'>,
  bookingId: string,
  input: LedgerTransactionInput
) {
  const booking = await prisma.booking.findUnique({
    where: { id: bookingId }
  });

  if (!booking) {
    throw new Error(`Booking ${bookingId} not found`);
  }

  // 1 & 2. Load previous financial state
  const prevOrderTotal = Number(booking.currentTotal || 0);
  const prevTotalPaid = Number(booking.totalPaid || 0);
  const prevAdvancePaid = Number(booking.totalAdvancePaid || 0);
  const prevBalancePaid = Number(booking.totalBalancePaid || 0);
  const prevTotalRefunded = Number(booking.totalRefunded || 0);
  const prevPendingRefund = Number(booking.pendingRefund || 0);

  // Deltas
  const orderValueDelta = input.orderValueDelta || 0;
  const advancePaymentDelta = input.advancePaymentDelta || 0;
  const balancePaymentDelta = input.balancePaymentDelta || 0;
  const refundDueDelta = input.refundDueDelta || 0;
  const refundPaidDelta = input.refundPaidDelta || 0;

  // 8. Calculate NEW ORDER TOTAL
  // The financial engine guarantees these values correctly enforce Rule 8:
  // Order Total + Customer Credit = Net Paid + Amount To Be Paid
  const newOrderTotal = prevOrderTotal + orderValueDelta;

  // 11. Calculate TOTAL PAID
  const newAdvancePaid = prevAdvancePaid + advancePaymentDelta;
  const newBalancePaid = prevBalancePaid + balancePaymentDelta;
  const newTotalPaid = newAdvancePaid + newBalancePaid;

  // 12. Calculate TOTAL REFUNDED
  const newTotalRefunded = prevTotalRefunded + refundPaidDelta;

  // Net Paid Position
  const netPaidPosition = newTotalPaid - newTotalRefunded;

  // Amount To Be Paid (Gross remaining due on the order)
  const newAmountToBePaid = Math.max(0, newOrderTotal - netPaidPosition);
  
  // Pending Refund (Calculated by the caller FSM when it detects netPaid > orderTotal or segment cancellations)
  const newPendingRefund = prevPendingRefund + refundDueDelta - refundPaidDelta;

  // Calculate srNo
  const lastTx = await prisma.orderTransaction.findFirst({
    where: { bookingId },
    orderBy: { srNo: 'desc' }
  });
  const srNo = (lastTx?.srNo || 0) + 1;

  // 16. Save immutable transaction
  const transaction = await prisma.orderTransaction.create({
    data: {
      bookingId,
      srNo,
      transactionTime: new Date(),
      actionType: input.actionType,
      actorRole: input.actorRole,
      previousState: booking.status,
      newState: booking.status, // Can be updated externally before/after this call
      paymentType: input.paymentType || 'N/A',
      refundTier: input.refundTier || 'N/A',
      refundStatus: input.refundStatus || 'N/A',
      
      previousOrderTotal: prevOrderTotal,
      orderValueDelta,
      newOrderTotal,
      
      previousTotalPaid: prevTotalPaid,
      advancePaymentDelta,
      balancePaymentDelta,
      refundDueDelta,
      refundPaidDelta,
      
      newTotalPaid,
      newTotalRefunded,
      newAdvancePaid,
      newRemainingAmount: newAmountToBePaid,
      newPendingRefund,
      newAmountToBePaid,

      snapshotStaySegments: input.snapshotStaySegments ? JSON.parse(JSON.stringify(input.snapshotStaySegments)) : null,
      snapshotServices: input.snapshotServices ? JSON.parse(JSON.stringify(input.snapshotServices)) : null,
      snapshotGuests: input.snapshotGuests ? JSON.parse(JSON.stringify(input.snapshotGuests)) : null,
    }
  });

  // Update Booking with latest derived state
  await prisma.booking.update({
    where: { id: bookingId },
    data: {
      currentTotal: newOrderTotal,
      totalAdvancePaid: newAdvancePaid,
      totalBalancePaid: newBalancePaid,
      totalPaid: newTotalPaid,
      totalRefunded: newTotalRefunded,
      pendingRefund: newPendingRefund,
      amountToBePaid: newAmountToBePaid,
    }
  });

  return { transaction, bookingState: { newOrderTotal, newTotalPaid, newAmountToBePaid } };
}
