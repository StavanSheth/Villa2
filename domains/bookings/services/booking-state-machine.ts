// domains/bookings/services/booking-state-machine.ts
// Booking State Machine — explicit state transitions
// ponytail: A Record<Status, Status[]> map, not a framework. One function validates transitions.

import type { BookingStatus } from '@villa-platform/types';

/**
 * Valid state transitions for booking lifecycle.
 * Key = current state, Value = array of allowed next states.
 */
const TRANSITIONS: Record<BookingStatus, BookingStatus[]> = {
  DRAFT:            ['PENDING', 'CANCELLED'],
  PENDING:          ['AWAITING_PAYMENT', 'CONFIRMED', 'CANCELLED'],
  AWAITING_PAYMENT: ['ADVANCE_PAID', 'FULLY_PAID', 'CANCELLED'],
  ADVANCE_PAID:     ['FULLY_PAID', 'CANCELLED'],
  FULLY_PAID:       ['CONFIRMED', 'CANCELLED'],
  CONFIRMED:        ['UPCOMING', 'CANCELLED'],
  UPCOMING:         ['CHECKED_IN', 'CANCELLED'],
  CHECKED_IN:       ['CHECKED_OUT'],
  CHECKED_OUT:      ['COMPLETED'],
  COMPLETED:        ['REVIEWED', 'ARCHIVED'],
  REVIEWED:         ['ARCHIVED'],
  ARCHIVED:         [],
  CANCELLED:        [],
};

/**
 * Check if a state transition is valid.
 */
export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return TRANSITIONS[from]?.includes(to) ?? false;
}

/**
 * Validate and return the next state, or throw if the transition is invalid.
 */
export function validateTransition(from: BookingStatus, to: BookingStatus): BookingStatus {
  if (!canTransition(from, to)) {
    throw new Error(`Invalid booking transition: ${from} → ${to}`);
  }
  return to;
}

/**
 * Get all valid next states from a given state.
 */
export function getNextStates(from: BookingStatus): BookingStatus[] {
  return TRANSITIONS[from] ?? [];
}

/**
 * Determine the initial status for a booking based on booking type rules.
 * - Auto-confirm bookings (owner stays, maintenance, etc.) start as CONFIRMED
 * - Payment-required bookings start as PENDING
 */
export function getInitialStatus(autoConfirm: boolean, paymentRequired: boolean): BookingStatus {
  if (autoConfirm) return 'CONFIRMED';
  if (!paymentRequired) return 'CONFIRMED';
  return 'PENDING';
}

/**
 * Check if a booking is in a terminal state (no further transitions).
 */
export function isTerminal(status: BookingStatus): boolean {
  return (TRANSITIONS[status]?.length ?? 0) === 0;
}

/**
 * Check if a booking is cancellable from its current state.
 */
export function isCancellable(status: BookingStatus): boolean {
  return canTransition(status, 'CANCELLED');
}
