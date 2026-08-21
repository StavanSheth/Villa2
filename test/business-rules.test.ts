import { describe, it, expect, beforeAll } from 'vitest';
import { calculateBookingPrice } from '../packages/database/queries/pricing';

describe('Category 8: Business Rule Validation Matrix', () => {
  describe('Pricing & Promo Constraints', () => {
    const baseRules = [
      { type: 'WEEKDAY', startDate: null, endDate: null, price: 10000, minNights: 1 } as any,
    ];

    it('Scenario 8A: Max Discount Ceilings (Prevents over-discounting)', () => {
      const result = calculateBookingPrice({
        checkIn: new Date('2027-01-01'),
        checkOut: new Date('2027-01-05'), // 4 nights (Fri, Sat, Sun, Mon) = 10k + 15k + 15k + 10k = 50k base
        pricingRules: baseRules,
        cleaningFee: 1500,
        platformFeePercent: 0,
        gstPercent: 0,
        promoCode: {
          code: 'HUGE50',
          type: 'PERCENTAGE',
          value: 50 as any, // 50%
          maxDiscount: 5000 as any, // Should cap at 5000 instead of 20,750
          minBookingAmt: 0 as any,
          minNights: null,
          maxNights: null
        }
      });
      
      expect(result.baseAccommodation).toBe(50000);
      expect(result.discount).toBe(5000); // Properly capped!
      expect(result.subtotal).toBe(50000 + 1500 - 5000); // 46,500
    });

    it('Scenario 8B: Minimum Booking Amount constraints', () => {
      const result = calculateBookingPrice({
        checkIn: new Date('2027-01-01'),
        checkOut: new Date('2027-01-02'), // 1 night = 10,000 base + 1,500 = 11,500
        pricingRules: baseRules,
        cleaningFee: 1500,
        platformFeePercent: 0,
        gstPercent: 0,
        promoCode: {
          code: 'MINIMUM_REQ',
          type: 'FIXED',
          value: 2000 as any,
          maxDiscount: null,
          minBookingAmt: 20000 as any, // Promo needs 20k, but subtotal is 11,500
          minNights: null,
          maxNights: null
        }
      });
      
      expect(result.discount).toBe(0); // Not applied due to minBookingAmt
      expect(result.subtotal).toBe(11500);
    });

    it('Scenario 8C: Minimum and Maximum Nights constraints', () => {
      const resultTooShort = calculateBookingPrice({
        checkIn: new Date('2027-01-01'),
        checkOut: new Date('2027-01-03'), // 2 nights
        pricingRules: baseRules,
        cleaningFee: 0,
        platformFeePercent: 0,
        gstPercent: 0,
        promoCode: {
          code: 'LONGSTAY',
          type: 'PERCENTAGE',
          value: 20 as any,
          maxDiscount: null,
          minBookingAmt: 0 as any,
          minNights: 5, // Requires 5 nights
          maxNights: null
        }
      });
      
      expect(resultTooShort.discount).toBe(0); // Failed minNights

      const resultTooLong = calculateBookingPrice({
        checkIn: new Date('2027-01-01'),
        checkOut: new Date('2027-01-10'), // 9 nights
        pricingRules: baseRules,
        cleaningFee: 0,
        platformFeePercent: 0,
        gstPercent: 0,
        promoCode: {
          code: 'SHORTSTAY',
          type: 'PERCENTAGE',
          value: 20 as any,
          maxDiscount: null,
          minBookingAmt: 0 as any,
          minNights: null,
          maxNights: 3 // Only applies up to 3 nights
        }
      });

      expect(resultTooLong.discount).toBe(0); // Failed maxNights
    });
  });
});
