// domains/bookings/tests/refund-engine.test.ts
// Refund Engine — validates slab matching, refund calculations, and policy type behavior

import { describe, it, expect } from 'vitest';
import { RefundEngineService } from '../services/refund-engine.service';
import type { RefundPolicySnapshot } from '@villa-platform/types';

// ── Test Fixtures ──

const baseFinancials = {
  totalAmount: 50000,
  paidAmount: 50000,
  gstAmount: 7627.12,
  platformFee: 0,
  gatewayFee: 932.20,
  cleaningFee: 1500,
  discountAmount: 0,
  checkIn: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 days from now
};

const fullRefundPolicy: RefundPolicySnapshot = {
  policyId: 'policy-1',
  name: 'Customer Friendly',
  refundType: 'FULL_REFUND',
  refundGatewayFee: true,
  refundGst: true,
  refundPlatformFee: true,
  slabs: [
    { minHoursBefore: 0, maxHoursBefore: 24, refundPercent: 0 },
    { minHoursBefore: 24, maxHoursBefore: 72, refundPercent: 50 },
    { minHoursBefore: 72, maxHoursBefore: 168, refundPercent: 75 },
    { minHoursBefore: 168, maxHoursBefore: 99999, refundPercent: 100 },
  ],
  snapshotAt: new Date().toISOString(),
};

const villaOnlyPolicy: RefundPolicySnapshot = {
  ...fullRefundPolicy,
  policyId: 'policy-2',
  name: 'Gateway Non-Refundable',
  refundType: 'VILLA_AMOUNT_ONLY',
  refundGatewayFee: false,
  refundGst: false,
};

describe('RefundEngineService', () => {
  describe('FULL_REFUND policy', () => {
    it('refunds 100% when > 168 hours (7 days) before check-in', () => {
      const result = RefundEngineService.calculateRefund(fullRefundPolicy, baseFinancials);

      expect(result.hoursBeforeCheckIn).toBeGreaterThan(168);
      expect(result.matchedSlab?.refundPercent).toBe(100);
      expect(result.totalRefund).toBe(result.villaAmountRefund + result.gatewayFeeRefund + result.gstRefund + result.platformFeeRefund);
      expect(result.totalRefund).toBeGreaterThan(0);
      expect(result.totalRefund).toBeLessThanOrEqual(baseFinancials.paidAmount);
    });

    it('refunds 0% when < 24 hours before check-in', () => {
      const soonCheckIn = {
        ...baseFinancials,
        checkIn: new Date(Date.now() + 12 * 60 * 60 * 1000), // 12 hours from now
      };

      const result = RefundEngineService.calculateRefund(fullRefundPolicy, soonCheckIn);

      expect(result.matchedSlab?.refundPercent).toBe(0);
      expect(result.totalRefund).toBe(0);
      expect(result.deductions).toBe(baseFinancials.paidAmount);
    });

    it('refunds 50% when 24-72 hours before check-in', () => {
      const midCheckIn = {
        ...baseFinancials,
        checkIn: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 hours from now
      };

      const result = RefundEngineService.calculateRefund(fullRefundPolicy, midCheckIn);

      expect(result.matchedSlab?.refundPercent).toBe(50);
      expect(result.totalRefund).toBeGreaterThan(0);
      expect(result.totalRefund).toBeLessThan(baseFinancials.paidAmount);
    });
  });

  describe('VILLA_AMOUNT_ONLY policy', () => {
    it('does not refund gateway fee or GST', () => {
      const result = RefundEngineService.calculateRefund(villaOnlyPolicy, baseFinancials);

      expect(result.gatewayFeeRefund).toBe(0);
      expect(result.gstRefund).toBe(0);
      expect(result.villaAmountRefund).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('handles no slabs gracefully', () => {
      const noSlabPolicy: RefundPolicySnapshot = {
        ...fullRefundPolicy,
        slabs: [],
      };

      const result = RefundEngineService.calculateRefund(noSlabPolicy, baseFinancials);

      expect(result.matchedSlab).toBeNull();
      expect(result.totalRefund).toBe(0);
    });

    it('caps refund at paidAmount', () => {
      const partialPaid = {
        ...baseFinancials,
        paidAmount: 5000, // Only paid 5000 of 50000
      };

      const result = RefundEngineService.calculateRefund(fullRefundPolicy, partialPaid);

      expect(result.totalRefund).toBeLessThanOrEqual(5000);
    });

    it('handles past check-in (0 hours)', () => {
      const pastCheckIn = {
        ...baseFinancials,
        checkIn: new Date(Date.now() - 1000), // Already past
      };

      const result = RefundEngineService.calculateRefund(fullRefundPolicy, pastCheckIn);

      expect(result.hoursBeforeCheckIn).toBe(0);
      expect(result.matchedSlab?.refundPercent).toBe(0);
      expect(result.totalRefund).toBe(0);
    });
  });
});
