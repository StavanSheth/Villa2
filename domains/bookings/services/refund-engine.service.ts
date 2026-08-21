// domains/bookings/services/refund-engine.service.ts
// Refund Engine — calculates refund amounts from the FROZEN policy snapshot
// ponytail: Always reads refundPolicySnapshot from booking JSON, never live DB policy.
// This guarantees policy changes don't retroactively affect existing bookings.

import type { RefundPolicySnapshot, RefundCalculation } from '@villa-platform/types';

interface BookingFinancials {
  totalAmount: number;
  paidAmount: number;
  gstAmount: number;
  platformFee: number;
  gatewayFee: number;
  cleaningFee: number;
  discountAmount: number;
  checkIn: Date;
}

export class RefundEngineService {
  /**
   * Calculate refund based on the frozen policy snapshot stored on the booking.
   * Never reads live RefundPolicy from DB — the snapshot is the contract.
   */
  public static calculateRefund(
    snapshot: RefundPolicySnapshot,
    financials: BookingFinancials,
  ): RefundCalculation {
    const now = new Date();
    const hoursBeforeCheckIn = Math.max(
      0,
      (financials.checkIn.getTime() - now.getTime()) / (1000 * 60 * 60),
    );

    // Find matching cancellation slab
    const matchedSlab = this.findMatchingSlab(snapshot.slabs, hoursBeforeCheckIn);

    if (!matchedSlab) {
      // No slab matches — no refund (past check-in or no slabs configured)
      return {
        hoursBeforeCheckIn,
        matchedSlab: null,
        villaAmountRefund: 0,
        gatewayFeeRefund: 0,
        gstRefund: 0,
        platformFeeRefund: 0,
        totalRefund: 0,
        deductions: financials.paidAmount,
      };
    }

    const refundPercent = Number(matchedSlab.refundPercent) / 100;

    // Calculate villa amount (base accommodation + cleaning - discount)
    const villaAmount = financials.totalAmount
      - financials.gstAmount
      - financials.platformFee
      - financials.gatewayFee;

    let villaAmountRefund = 0;
    let gatewayFeeRefund = 0;
    let gstRefund = 0;
    let platformFeeRefund = 0;

    switch (snapshot.refundType) {
      case 'FULL_REFUND':
        villaAmountRefund = round(villaAmount * refundPercent);
        gatewayFeeRefund = snapshot.refundGatewayFee ? round(financials.gatewayFee * refundPercent) : 0;
        gstRefund = snapshot.refundGst ? round(financials.gstAmount * refundPercent) : 0;
        platformFeeRefund = snapshot.refundPlatformFee ? round(financials.platformFee * refundPercent) : 0;
        break;

      case 'VILLA_AMOUNT_ONLY':
        villaAmountRefund = round(villaAmount * refundPercent);
        // Gateway, GST, platform fees NOT refunded
        break;

      case 'PERCENTAGE_BASED':
      case 'CUSTOM_RULES':
        villaAmountRefund = round(villaAmount * refundPercent);
        gatewayFeeRefund = snapshot.refundGatewayFee ? round(financials.gatewayFee * refundPercent) : 0;
        gstRefund = snapshot.refundGst ? round(financials.gstAmount * refundPercent) : 0;
        platformFeeRefund = snapshot.refundPlatformFee ? round(financials.platformFee * refundPercent) : 0;
        break;
    }

    const totalRefund = round(villaAmountRefund + gatewayFeeRefund + gstRefund + platformFeeRefund);
    // Cannot refund more than what was paid
    const cappedRefund = Math.min(totalRefund, financials.paidAmount);

    return {
      hoursBeforeCheckIn,
      matchedSlab,
      villaAmountRefund: round(villaAmountRefund),
      gatewayFeeRefund: round(gatewayFeeRefund),
      gstRefund: round(gstRefund),
      platformFeeRefund: round(platformFeeRefund),
      totalRefund: round(cappedRefund),
      deductions: round(financials.paidAmount - cappedRefund),
    };
  }

  /**
   * Find the slab whose [minHoursBefore, maxHoursBefore) range contains the given hours.
   * Slabs are expected to be: [0, 24), [24, 72), [72, 168), [168, 99999)
   */
  private static findMatchingSlab(
    slabs: RefundPolicySnapshot['slabs'],
    hours: number,
  ) {
    if (!slabs || slabs.length === 0) return null;

    // Sort slabs by minHoursBefore ascending for predictable matching
    const sorted = [...slabs].sort((a, b) => a.minHoursBefore - b.minHoursBefore);

    for (const slab of sorted) {
      if (hours >= slab.minHoursBefore && hours < slab.maxHoursBefore) {
        return slab;
      }
    }

    // Check if hours exceed the highest slab — use the highest one
    const highest = sorted[sorted.length - 1];
    if (hours >= highest.maxHoursBefore) {
      return highest;
    }

    return null;
  }
}

function round(n: number): number {
  return Math.round(n * 100) / 100;
}
