import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function main() {
  const b = await p.booking.findFirst({
    where: { bookingCode: 'MVN-2026-2653' },
    include: {
      orderTransactions: {
        orderBy: { srNo: 'asc' }
      },
      events: {
        orderBy: { createdAt: 'asc' }
      }
    }
  });

  if (!b) return;

  console.log('Booking State:', {
    totalPaid: b.totalPaid,
    totalRefunded: b.totalRefunded,
    pendingRefund: b.pendingRefund,
    amountToBePaid: b.amountToBePaid,
  });

  console.log('\nTransactions:');
  b.orderTransactions.forEach(tx => {
    console.log(`[${tx.transactionTime}] ${tx.actionType}: ${tx.refundPaidDelta}`);
  });

  console.log('\nEvents:');
  b.events.forEach(e => {
    console.log(`[${e.createdAt}] ${e.action}:`, e.metadata);
  });
  
  await p.$disconnect();
}
main();
