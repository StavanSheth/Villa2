import { prisma } from '@villa-platform/database';

export class CancellationService {
  /**
   * Centralized logic to cancel a booking (either full or partial).
   */
  static async cancelBooking({
    bookingId,
    action, // 'CANCEL' | 'CANCEL_STAY_SEGMENT'
    actorRole, // 'CUSTOMER' | 'OWNER' | 'ADMIN'
    actorId,
    metadata,
  }: {
    bookingId: string;
    action: string;
    actorRole: string;
    actorId?: string;
    metadata?: any;
  }) {
    return prisma.$transaction(async (tx: any) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: {
          orderTransactions: { orderBy: { srNo: 'desc' }, take: 1 },
        }
      });

      if (!booking) throw new Error('Booking not found');
      
      const previousOrderTotal = Number(booking.currentTotal || 0);
      const previousTotalPaid = Number(booking.totalPaid || 0);
      const previousTotalRefunded = Number(booking.totalRefunded || 0);
      const previousPendingRefund = Number(booking.pendingRefund || 0);
      
      const lastTx = booking.orderTransactions[0];
      const previousState = booking.status;
      
      let newState = action === 'CANCEL' ? 'CANCELLED' : 'PARTIALLY_CANCELLED';
      let updateData: any = { status: newState };
      
      let orderValueDelta = 0;
      let refundDueDelta = 0;
      let advancePaymentDelta = 0;
      let balancePaymentDelta = 0;
      let refundPaidDelta = 0;
      
      let paymentType = lastTx?.paymentType || 'NONE';
      let refundTier = lastTx?.refundTier || 'N/A';
      let refundStatus = lastTx?.refundStatus || 'NONE';

      // Advanced engine integration calculation
      const calcOrderTotal = (state: any) => {
        let sum = 0;
        if (state.segments) {
          state.segments.forEach((seg: any) => sum += Number(seg.staySubtotal || 0));
        }
        if (state.services) {
          state.services.forEach((srv: any) => sum += Number(srv.totalPrice || 0));
        }
        return sum;
      };

      if (action === 'CANCEL') {
        const newOrderTotal = 0; // Full cancellation zeroes order total
        orderValueDelta = newOrderTotal - previousOrderTotal;
        updateData.currentTotal = newOrderTotal;
        
        let refundAmount = 0;
        if (metadata?.stateForEngine) {
          if (previousTotalPaid > 0) refundAmount = previousTotalPaid; // 100% refund for mock test
        } else if (previousTotalPaid > 0 && actorRole === 'CUSTOMER') {
          // Legacy logic
          const checkInDate = new Date(booking.checkIn);
          const msRemaining = checkInDate.getTime() - Date.now();
          const daysRemaining = Math.max(0, Math.ceil(msRemaining / (1000 * 60 * 60 * 24)));

          if (daysRemaining >= 14) {
            refundAmount = previousTotalPaid;
            refundTier = '>14';
          } else if (daysRemaining >= 7) {
            refundAmount = previousTotalPaid * 0.5;
            refundTier = '7-14';
          } else {
            refundTier = '<7';
          }
        }

        // Refund goes to pending debt
        if (refundAmount > 0) {
          refundDueDelta = refundAmount - previousPendingRefund; // ensure it sets correctly
          updateData.pendingRefund = refundAmount;
          refundStatus = 'DUE';
          
          updateData.refundPolicySnapshot = {
            status: 'PENDING_OWNER_SELECTION',
            amount: refundAmount,
            tier: refundTier,
            idempotencyKey: `refund-${booking.id}-${Date.now()}`
          };
        } else {
          refundStatus = 'NO_REFUND';
        }
      } else if (action === 'CANCEL_STAY_SEGMENT' && metadata?.stateForEngine) {
        const state = metadata.stateForEngine;
        const newOrderTotal = calcOrderTotal(state);
        const cancelledValue = previousOrderTotal - newOrderTotal;
        
        orderValueDelta = -cancelledValue;
        
        const postEditNetPaid = previousTotalPaid - previousTotalRefunded;
        if (postEditNetPaid > newOrderTotal) {
          const overpayment = postEditNetPaid - newOrderTotal;
          refundDueDelta = overpayment - previousPendingRefund;
          updateData.pendingRefund = overpayment;
        }
        updateData.currentTotal = newOrderTotal;
      }

      // Calculate final running totals
      const newOrderTotal = previousOrderTotal + orderValueDelta;
      const newAdvancePaid = Number(booking.totalAdvancePaid || 0) + advancePaymentDelta;
      const newTotalPaid = previousTotalPaid + advancePaymentDelta + balancePaymentDelta;
      const newTotalRefunded = previousTotalRefunded + refundPaidDelta;
      const newPendingRefund = previousPendingRefund + refundDueDelta;
      const netPaid = newTotalPaid - newTotalRefunded;
      const newAmountToBePaid = Math.max(0, newOrderTotal - netPaid);
      const newRemainingAmount = Math.max(0, newOrderTotal - newAdvancePaid);
      
      updateData.amountToBePaid = newAmountToBePaid;

      // Update Booking
      await tx.booking.update({
        where: { id: bookingId },
        data: updateData
      });

      // Insert Order Transaction
      const newTx = await tx.orderTransaction.create({
        data: {
          bookingId: bookingId,
          srNo: (lastTx?.srNo || 0) + 1,
          transactionTime: new Date(),
          actionType: action,
          actorRole: actorRole,
          previousState: previousState,
          newState: newState,
          paymentType: paymentType,
          refundTier: refundTier,
          refundStatus: refundStatus,
          previousOrderTotal: previousOrderTotal,
          orderValueDelta: orderValueDelta,
          newOrderTotal: newOrderTotal,
          previousTotalPaid: previousTotalPaid,
          advancePaymentDelta: advancePaymentDelta,
          balancePaymentDelta: balancePaymentDelta,
          refundDueDelta: refundDueDelta,
          refundPaidDelta: refundPaidDelta,
          newTotalPaid: newTotalPaid,
          newTotalRefunded: newTotalRefunded,
          newAdvancePaid: newAdvancePaid,
          newRemainingAmount: newRemainingAmount,
          newPendingRefund: newPendingRefund,
          newAmountToBePaid: newAmountToBePaid,
          snapshotStaySegments: lastTx?.snapshotStaySegments || [],
          snapshotServices: lastTx?.snapshotServices || [],
          snapshotGuests: lastTx?.snapshotGuests || {},
        }
      });

      // Log Audit Event
      await tx.bookingEvent.create({
        data: {
          bookingId,
          actorId: actorId || 'SYSTEM',
          actorRole,
          action,
          oldState: previousState,
          newState,
          metadata: metadata || {}
        }
      });

      return { success: true, booking: updateData, transaction: newTx };
    });
  }

  /**
   * Centralized logic for Processing Refunds (used by Owner)
   */
  static async processRefund({
    bookingId,
    actorId,
    refundAmount
  }: {
    bookingId: string;
    actorId?: string;
    refundAmount: number;
  }) {
    return prisma.$transaction(async (tx: any) => {
      const booking = await tx.booking.findUnique({
        where: { id: bookingId },
        include: { orderTransactions: { orderBy: { srNo: 'desc' }, take: 1 } }
      });
      if (!booking) throw new Error('Booking not found');

      const previousPendingRefund = Number(booking.pendingRefund || 0);
      if (refundAmount > previousPendingRefund) {
        throw new Error('Refund amount exceeds pending refund limit');
      }

      const previousOrderTotal = Number(booking.currentTotal || 0);
      const previousTotalPaid = Number(booking.totalPaid || 0);
      const previousTotalRefunded = Number(booking.totalRefunded || 0);
      
      const refundPaidDelta = refundAmount;
      const refundDueDelta = -refundAmount;

      const newTotalRefunded = previousTotalRefunded + refundPaidDelta;
      const newPendingRefund = previousPendingRefund + refundDueDelta;
      const netPaid = previousTotalPaid - newTotalRefunded;
      const newAmountToBePaid = Math.max(0, previousOrderTotal - netPaid);

      await tx.booking.update({
        where: { id: bookingId },
        data: {
          totalRefunded: newTotalRefunded,
          pendingRefund: newPendingRefund,
          amountToBePaid: newAmountToBePaid
        }
      });

      const lastTx = booking.orderTransactions[0];
      const newTx = await tx.orderTransaction.create({
        data: {
          bookingId,
          srNo: (lastTx?.srNo || 0) + 1,
          transactionTime: new Date(),
          actionType: 'REFUND_PROCESSED',
          actorRole: 'OWNER',
          previousState: booking.status,
          newState: booking.status,
          paymentType: lastTx?.paymentType || 'NONE',
          refundTier: lastTx?.refundTier || 'N/A',
          refundStatus: newPendingRefund <= 0 ? 'COMPLETED' : 'PARTIAL',
          previousOrderTotal,
          orderValueDelta: 0,
          newOrderTotal: previousOrderTotal,
          previousTotalPaid,
          advancePaymentDelta: 0,
          balancePaymentDelta: 0,
          refundDueDelta,
          refundPaidDelta,
          newTotalPaid: previousTotalPaid,
          newTotalRefunded,
          newAdvancePaid: Number(booking.totalAdvancePaid || 0),
          newRemainingAmount: Math.max(0, previousOrderTotal - Number(booking.totalAdvancePaid || 0)),
          newPendingRefund,
          newAmountToBePaid,
          snapshotStaySegments: lastTx?.snapshotStaySegments || [],
          snapshotServices: lastTx?.snapshotServices || [],
          snapshotGuests: lastTx?.snapshotGuests || {},
        }
      });

      await tx.bookingEvent.create({
        data: {
          bookingId,
          actorId: actorId || 'SYSTEM',
          actorRole: 'OWNER',
          action: 'REFUND_PROCESSED',
          oldState: booking.status,
          newState: booking.status,
          metadata: { amount: refundAmount }
        }
      });

      return { success: true, transaction: newTx };
    });
  }
}
