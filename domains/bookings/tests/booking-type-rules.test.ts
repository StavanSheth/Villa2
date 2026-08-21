// domains/bookings/tests/booking-type-rules.test.ts
// BOOKING_TYPE_RULES — validates the central rules lookup table

import { describe, it, expect } from 'vitest';
import {
  BOOKING_TYPE_RULES,
  ALL_BOOKING_TYPES,
  OWNER_BOOKING_TYPES,
  type BookingType,
} from '@villa-platform/types';

describe('BOOKING_TYPE_RULES', () => {
  it('defines rules for every booking type', () => {
    for (const type of ALL_BOOKING_TYPES) {
      expect(BOOKING_TYPE_RULES[type]).toBeDefined();
      expect(BOOKING_TYPE_RULES[type].label).toBeTruthy();
    }
  });

  // ── Customer booking (NORMAL) ──
  describe('NORMAL', () => {
    const rules = BOOKING_TYPE_RULES['NORMAL'];

    it('requires payment', () => {
      expect(rules.paymentRequired).toBe(true);
    });

    it('shows payment step', () => {
      expect(rules.paymentStepVisible).toBe(true);
    });

    it('enables promo codes', () => {
      expect(rules.promoEnabled).toBe(true);
    });

    it('does not auto-confirm', () => {
      expect(rules.autoConfirm).toBe(false);
    });

    it('sends customer notifications', () => {
      expect(rules.customerNotification).toBe(true);
    });

    it('includes in revenue', () => {
      expect(rules.includeInRevenue).toBe(true);
    });
  });

  // ── Owner Stay ──
  describe('OWNER', () => {
    const rules = BOOKING_TYPE_RULES['OWNER'];

    it('does NOT require payment', () => {
      expect(rules.paymentRequired).toBe(false);
    });

    it('hides payment step', () => {
      expect(rules.paymentStepVisible).toBe(false);
    });

    it('disables promo codes', () => {
      expect(rules.promoEnabled).toBe(false);
    });

    it('auto-confirms', () => {
      expect(rules.autoConfirm).toBe(true);
    });

    it('does NOT send customer notifications', () => {
      expect(rules.customerNotification).toBe(false);
    });

    it('does NOT include in revenue', () => {
      expect(rules.includeInRevenue).toBe(false);
    });

    it('includes in occupancy', () => {
      expect(rules.includeInOccupancy).toBe(true);
    });
  });

  // ── Maintenance ──
  describe('MAINTENANCE', () => {
    const rules = BOOKING_TYPE_RULES['MAINTENANCE'];

    it('auto-confirms', () => expect(rules.autoConfirm).toBe(true));
    it('no payment', () => expect(rules.paymentRequired).toBe(false));
    it('no notifications', () => expect(rules.customerNotification).toBe(false));
    it('not in revenue', () => expect(rules.includeInRevenue).toBe(false));
    it('in occupancy', () => expect(rules.includeInOccupancy).toBe(true));
    it('calendar color is MAINTENANCE', () => expect(rules.calendarColor).toBe('MAINTENANCE'));
  });

  // ── Blocked ──
  describe('BLOCKED', () => {
    const rules = BOOKING_TYPE_RULES['BLOCKED'];

    it('calendar color is BLOCKED (gray)', () => expect(rules.calendarColor).toBe('BLOCKED'));
    it('no payment', () => expect(rules.paymentRequired).toBe(false));
    it('no revenue', () => expect(rules.includeInRevenue).toBe(false));
  });

  // ── VIP ──
  describe('VIP', () => {
    const rules = BOOKING_TYPE_RULES['VIP'];

    it('payment NOT required by default', () => expect(rules.paymentRequired).toBe(false));
    it('payment step IS visible (optional toggle)', () => expect(rules.paymentStepVisible).toBe(true));
    it('auto-confirms', () => expect(rules.autoConfirm).toBe(true));
    it('includes in revenue', () => expect(rules.includeInRevenue).toBe(true));
  });

  // ── Revenue filter ──
  describe('revenue inclusion', () => {
    const revenueTypes = ALL_BOOKING_TYPES.filter(t => BOOKING_TYPE_RULES[t].includeInRevenue);

    it('includes NORMAL, VIP, OFFLINE, CORPORATE', () => {
      expect(revenueTypes).toContain('NORMAL');
      expect(revenueTypes).toContain('VIP');
      expect(revenueTypes).toContain('OFFLINE');
      expect(revenueTypes).toContain('CORPORATE');
    });

    it('excludes OWNER, MAINTENANCE, BLOCKED, PRIVATE', () => {
      expect(revenueTypes).not.toContain('OWNER');
      expect(revenueTypes).not.toContain('MAINTENANCE');
      expect(revenueTypes).not.toContain('BLOCKED');
      expect(revenueTypes).not.toContain('PRIVATE');
    });
  });

  // ── Owner dropdown options ──
  describe('OWNER_BOOKING_TYPES', () => {
    it('contains all 8 types', () => {
      expect(OWNER_BOOKING_TYPES).toHaveLength(8);
    });

    it('includes NORMAL as first option', () => {
      expect(OWNER_BOOKING_TYPES[0]).toBe('NORMAL');
    });
  });
});
