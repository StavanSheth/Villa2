import { PrismaClient } from '@prisma/client';

const p = new PrismaClient();

async function main() {
  const b = await p.booking.findFirst({
    where: { bookingCode: 'MVN-2026-2653' },
    select: {
      id: true,
      currentTotal: true,
      totalPaid: true,
      totalAdvancePaid: true,
      totalBalancePaid: true,
      totalRefunded: true,
      pendingRefund: true,
      amountToBePaid: true,
      status: true,
    }
  });

  console.log('=== BOOKING STATE ===');
  console.log(JSON.stringify(b, null, 2));

  if (!b) {
    console.log('Booking not found');
    return;
  }

  const txs = await p.orderTransaction.findMany({
    where: { bookingId: b.id },
    orderBy: { srNo: 'asc' },
    select: {
      srNo: true,
      actionType: true,
      previousOrderTotal: true,
      orderValueDelta: true,
      newOrderTotal: true,
      advancePaymentDelta: true,
      balancePaymentDelta: true,
      refundDueDelta: true,
      refundPaidDelta: true,
      newTotalPaid: true,
      newAdvancePaid: true,
      newTotalRefunded: true,
      newRemainingAmount: true,
      newPendingRefund: true,
      newAmountToBePaid: true,
    }
  });

  console.log('\n=== ORDER TRANSACTIONS ===');
  for (const tx of txs) {
    console.log(`\nSR #${tx.srNo} - ${tx.actionType}`);
    console.log(`  prevOrderTotal: ${tx.previousOrderTotal}, delta: ${tx.orderValueDelta}, newOrderTotal: ${tx.newOrderTotal}`);
    console.log(`  advanceDelta: ${tx.advancePaymentDelta}, balanceDelta: ${tx.balancePaymentDelta}`);
    console.log(`  refundDueDelta: ${tx.refundDueDelta}, refundPaidDelta: ${tx.refundPaidDelta}`);
    console.log(`  newTotalPaid: ${tx.newTotalPaid}, newAdvancePaid: ${tx.newAdvancePaid}`);
    console.log(`  newTotalRefunded: ${tx.newTotalRefunded}, newPendingRefund: ${tx.newPendingRefund}`);
    console.log(`  newRemainingAmount: ${tx.newRemainingAmount}, newAmountToBePaid: ${tx.newAmountToBePaid}`);
    
    // Calculate what "Balance" column shows: newAmountToBePaid - newPendingRefund
    const displayBalance = Number(tx.newAmountToBePaid) - Number(tx.newPendingRefund);
    console.log(`  DISPLAY Balance (amtToBePaid - pendingRefund): ${displayBalance}`);
  }

  // Calculate totals row
  console.log('\n=== TOTALS ROW CALCULATIONS ===');
  const ct = Number(b.currentTotal);
  const tp = Number(b.totalPaid);
  const tap = Number(b.totalAdvancePaid);
  const tr = Number(b.totalRefunded);
  const pr = Number(b.pendingRefund);
  const atbp = Number(b.amountToBePaid);
  
  console.log(`currentTotal: ${ct}`);
  console.log(`totalPaid: ${tp}`);
  console.log(`totalAdvancePaid: ${tap}`);
  console.log(`totalRefunded: ${tr}`);
  console.log(`pendingRefund: ${pr}`);
  console.log(`amountToBePaid: ${atbp}`);
  
  const totalBalance = ct - tp + tr;
  console.log(`\nTotals Balance formula (currentTotal - totalPaid + totalRefunded): ${totalBalance}`);
  console.log(`Totals Remaining formula (currentTotal - totalAdvancePaid): ${ct - tap}`);

  await p.$disconnect();
}

main();
