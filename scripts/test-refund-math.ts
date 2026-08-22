import { PrismaClient } from '@prisma/client';
const p = new PrismaClient();

async function main() {
  const previousPendingRefund = 25999;
  const previousTotalRefunded = 0;
  const previousOrderTotal = 20768;
  const previousAdvancePaid = 46767;
  const previousBalancePaid = 0;
  
  const metadata = { refundAmount: 25999 };
  const action = 'REFUND_PROCESSED_MANUAL';
  
  let orderValueDelta = 0;
  let advancePaymentDelta = 0;
  let balancePaymentDelta = 0;
  let refundDueDelta = 0;
  let refundPaidDelta = 0;
  
  if ((action === 'ISSUE_REFUND' || action === 'REFUND_PROCESSED_MANUAL' || action === 'REFUND_PROCESSED') && metadata) {
    refundPaidDelta = Number(metadata.amount || metadata.refundAmount || 0);
  }

  const newOrderTotal = previousOrderTotal + orderValueDelta;
  const newAdvancePaid = previousAdvancePaid + advancePaymentDelta;
  const newBalancePaid = previousBalancePaid + balancePaymentDelta;
  const newTotalPaid = newAdvancePaid + newBalancePaid;
  const newTotalRefunded = previousTotalRefunded + refundPaidDelta;
  
  let newPendingRefund = previousPendingRefund + refundDueDelta - refundPaidDelta;
  
  const netPaidPosition = newTotalPaid - newTotalRefunded;
  const settlementDifference = newOrderTotal - netPaidPosition;
  
  const newAmountToBePaid = Math.max(0, settlementDifference);
  const refundDue = Math.max(0, -settlementDifference);

  console.log({
    refundDue,
    newPendingRefund
  });

  if (refundDue > newPendingRefund) {
    newPendingRefund = refundDue;
  }

  console.log({
    finalPendingRefund: newPendingRefund,
    refundPaidDelta,
    netPaidPosition,
    settlementDifference,
    refundDue
  });
}
main();
