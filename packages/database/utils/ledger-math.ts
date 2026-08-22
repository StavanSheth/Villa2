export function calculateLedgerTotals(booking: any) {
  const currentTotal = Number(booking.currentTotal || 0);
  const totalPaid = Number(booking.totalPaid || 0);
  const totalRefunded = Number(booking.totalRefunded || 0);
  const totalAdvancePaid = Number(booking.totalAdvancePaid || 0);
  const storedPendingRefund = Number(booking.pendingRefund || 0);

  const netPaid = totalPaid - totalRefunded;
  
  // Balance: What is owed by the customer (if positive) or owed to the customer (if negative)
  // Actually, UI calls this "Balance" meaning "how much is remaining to pay for the order"
  // If netPaid is greater than currentTotal, balance is 0.
  const balance = Math.max(0, currentTotal - netPaid);

  // Remaining Amount: currentTotal - totalAdvancePaid
  // This is how much is left to be paid in cash/balance after advance
  const remainingAmount = Math.max(0, currentTotal - totalAdvancePaid);

  // Pending Refund: Max of stored pending refund OR (netPaid - currentTotal) if they overpaid
  const computedRefundDue = Math.max(0, netPaid - currentTotal);
  const pendingRefund = Math.max(storedPendingRefund, computedRefundDue);

  return {
    balance,
    remainingAmount,
    pendingRefund,
  };
}

export function formatCurrency(amount: number): string {
  const num = Number(amount);
  return num < 0 ? `-₹${Math.abs(num).toLocaleString()}` : `₹${num.toLocaleString()}`;
}
