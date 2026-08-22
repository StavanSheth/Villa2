import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function main() {
  const bookingCode = 'MVN-2026-2653';
  const b = await p.booking.findFirst({
    where: { bookingCode },
    include: {
      orderTransactions: true,
      events: true,
    }
  });

  if (!b) return;

  const refundTx = b.orderTransactions.find(tx => tx.actionType === 'REFUND_PROCESSED_MANUAL');
  const refundEvent = b.events.find(e => e.action === 'REFUND_PROCESSED_MANUAL');

  if (refundTx) {
    await p.orderTransaction.delete({
      where: { id: refundTx.id } // Wait, transactionId is unique. Or id?
    }).catch(e => p.orderTransaction.delete({ where: { transactionId: refundTx.transactionId } }));
    console.log('Deleted OrderTransaction:', refundTx.actionType);
  }

  if (refundEvent) {
    await p.bookingEvent.delete({
      where: { id: refundEvent.id }
    });
    console.log('Deleted BookingEvent:', refundEvent.action);
  }

  await p.booking.update({
    where: { id: b.id },
    data: {
      totalRefunded: 0,
      pendingRefund: 25999
    }
  });
  console.log('Reverted Booking Financials (totalRefunded: 0, pendingRefund: 25999)');

  await p.$disconnect();
}

main();
