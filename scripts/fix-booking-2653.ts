import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function main() {
  const bookingCode = 'MVN-2026-2653';
  
  const booking = await p.booking.findFirst({
    where: { bookingCode },
    select: {
      id: true,
      currentTotal: true,
      totalPaid: true,
      totalAdvancePaid: true,
      totalBalancePaid: true,
      totalRefunded: true,
      pendingRefund: true,
      amountToBePaid: true,
    }
  });

  if (!booking) {
    console.log('Booking not found');
    return;
  }

  const currentTotal = Number(booking.currentTotal);
  const totalPaid = Number(booking.totalPaid);
  const totalRefunded = Number(booking.totalRefunded);
  const netPaid = totalPaid - totalRefunded;
  
  // Customer overpaid: netPaid (46767) > currentTotal (20768)
  const overpayment = Math.max(0, netPaid - currentTotal);
  const amountToBePaid = Math.max(0, currentTotal - netPaid);

  console.log(`Current state: currentTotal=${currentTotal}, totalPaid=${totalPaid}, totalRefunded=${totalRefunded}`);
  console.log(`Net paid: ${netPaid}`);
  console.log(`Overpayment (pendingRefund should be): ${overpayment}`);
  console.log(`Amount to be paid: ${amountToBePaid}`);

  // Fix the booking record
  await p.booking.update({
    where: { id: booking.id },
    data: {
      pendingRefund: overpayment,
      amountToBePaid: amountToBePaid,
    }
  });
  console.log(`\n✅ Updated booking.pendingRefund = ${overpayment}, amountToBePaid = ${amountToBePaid}`);

  // Fix the last order transaction (SR #3) which recorded the downward edit
  const lastTx = await p.orderTransaction.findFirst({
    where: { bookingId: booking.id },
    orderBy: { srNo: 'desc' },
  });

  if (lastTx) {
    await p.orderTransaction.update({
      where: { transactionId: lastTx.transactionId },
      data: {
        newPendingRefund: overpayment,
        newAmountToBePaid: amountToBePaid,
        refundDueDelta: overpayment,
        refundStatus: 'DUE',
      }
    });
    console.log(`✅ Updated orderTransaction SR #${lastTx.srNo}: newPendingRefund=${overpayment}, refundDueDelta=${overpayment}, refundStatus=DUE`);
  }

  // Verify
  const fixed = await p.booking.findFirst({
    where: { bookingCode },
    select: {
      currentTotal: true,
      totalPaid: true,
      totalRefunded: true,
      pendingRefund: true,
      amountToBePaid: true,
    }
  });
  console.log('\n=== FIXED STATE ===');
  console.log(JSON.stringify(fixed, null, 2));

  await p.$disconnect();
}

main();
