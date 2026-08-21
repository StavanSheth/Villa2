// domains/bookings/tests/booking-state-machine.test.ts
// State Machine — validates transitions, initial status, and terminal states

import { describe, it, expect } from 'vitest';
import {
  canTransition,
  validateTransition,
  getNextStates,
  getInitialStatus,
  isTerminal,
  isCancellable,
} from '../services/booking-state-machine';

describe('BookingStateMachine', () => {
  // ── Valid Transitions ──
  describe('canTransition', () => {
    it('allows DRAFT → PENDING', () => {
      expect(canTransition('DRAFT', 'PENDING')).toBe(true);
    });

    it('allows PENDING → CONFIRMED (auto-confirm path)', () => {
      expect(canTransition('PENDING', 'CONFIRMED')).toBe(true);
    });

    it('allows PENDING → AWAITING_PAYMENT', () => {
      expect(canTransition('PENDING', 'AWAITING_PAYMENT')).toBe(true);
    });

    it('allows CONFIRMED → UPCOMING', () => {
      expect(canTransition('CONFIRMED', 'UPCOMING')).toBe(true);
    });

    it('allows UPCOMING → CHECKED_IN', () => {
      expect(canTransition('UPCOMING', 'CHECKED_IN')).toBe(true);
    });

    it('allows CHECKED_IN → CHECKED_OUT', () => {
      expect(canTransition('CHECKED_IN', 'CHECKED_OUT')).toBe(true);
    });

    it('allows CHECKED_OUT → COMPLETED', () => {
      expect(canTransition('CHECKED_OUT', 'COMPLETED')).toBe(true);
    });

    it('allows COMPLETED → ARCHIVED', () => {
      expect(canTransition('COMPLETED', 'ARCHIVED')).toBe(true);
    });
  });

  // ── Invalid Transitions ──
  describe('invalid transitions', () => {
    it('rejects CANCELLED → anything', () => {
      expect(canTransition('CANCELLED', 'PENDING')).toBe(false);
      expect(canTransition('CANCELLED', 'CONFIRMED')).toBe(false);
    });

    it('rejects ARCHIVED → anything', () => {
      expect(canTransition('ARCHIVED', 'COMPLETED')).toBe(false);
    });

    it('rejects CHECKED_OUT → CHECKED_IN (no going back)', () => {
      expect(canTransition('CHECKED_OUT', 'CHECKED_IN')).toBe(false);
    });

    it('rejects DRAFT → CONFIRMED (must go through PENDING)', () => {
      expect(canTransition('DRAFT', 'CONFIRMED')).toBe(false);
    });
  });

  // ── validateTransition throws ──
  describe('validateTransition', () => {
    it('returns the new status on valid transition', () => {
      expect(validateTransition('DRAFT', 'PENDING')).toBe('PENDING');
    });

    it('throws on invalid transition', () => {
      expect(() => validateTransition('CANCELLED', 'PENDING')).toThrow(
        'Invalid booking transition: CANCELLED → PENDING',
      );
    });
  });

  // ── getInitialStatus ──
  describe('getInitialStatus', () => {
    it('returns CONFIRMED for auto-confirm bookings', () => {
      expect(getInitialStatus(true, false)).toBe('CONFIRMED');
    });

    it('returns CONFIRMED for no-payment bookings', () => {
      expect(getInitialStatus(false, false)).toBe('CONFIRMED');
    });

    it('returns PENDING for payment-required bookings', () => {
      expect(getInitialStatus(false, true)).toBe('PENDING');
    });
  });

  // ── Terminal & Cancellable ──
  describe('isTerminal', () => {
    it('CANCELLED is terminal', () => {
      expect(isTerminal('CANCELLED')).toBe(true);
    });

    it('ARCHIVED is terminal', () => {
      expect(isTerminal('ARCHIVED')).toBe(true);
    });

    it('CONFIRMED is not terminal', () => {
      expect(isTerminal('CONFIRMED')).toBe(false);
    });
  });

  describe('isCancellable', () => {
    it('PENDING is cancellable', () => {
      expect(isCancellable('PENDING')).toBe(true);
    });

    it('CONFIRMED is cancellable', () => {
      expect(isCancellable('CONFIRMED')).toBe(true);
    });

    it('CHECKED_IN is not cancellable (guest already arrived)', () => {
      expect(isCancellable('CHECKED_IN')).toBe(false);
    });

    it('CANCELLED is not cancellable (already cancelled)', () => {
      expect(isCancellable('CANCELLED')).toBe(false);
    });
  });

  // ── getNextStates ──
  describe('getNextStates', () => {
    it('PENDING can go to AWAITING_PAYMENT, CONFIRMED, or CANCELLED', () => {
      const next = getNextStates('PENDING');
      expect(next).toContain('AWAITING_PAYMENT');
      expect(next).toContain('CONFIRMED');
      expect(next).toContain('CANCELLED');
    });

    it('CANCELLED has no next states', () => {
      expect(getNextStates('CANCELLED')).toEqual([]);
    });
  });
});
