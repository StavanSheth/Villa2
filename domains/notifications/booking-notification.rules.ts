// domains/notifications/booking-notification.rules.ts
// Notification Rules — Decision matrix for booking notifications
// ponytail: One lookup, no notification service class needed. Just a pure function.

import type { BookingType, BookingMode } from '@villa-platform/types';
import { BOOKING_TYPE_RULES } from '@villa-platform/types';

export type BookingNotificationEventType =
  | 'BOOKING_CREATED'
  | 'BOOKING_CONFIRMED'
  | 'BOOKING_CANCELLED'
  | 'PAYMENT_RECEIVED'
  | 'REFUND_ISSUED'
  | 'CHECK_IN'
  | 'CHECK_OUT';

export interface NotificationEvent {
  event: BookingNotificationEventType;
  bookingId: string;
  bookingCode: string;
  bookingType: BookingType;
  mode: BookingMode;
}

/**
 * Determines whether a notification should be sent for a given event,
 * booking type, and mode.
 *
 * Rules:
 * - MAINTENANCE / BLOCKED → no notifications ever
 * - OWNER stay → no customer notification (owner gets internal confirmation)
 * - PRIVATE → optional (controlled by customerNotification flag)
 * - NORMAL / CORPORATE / OFFLINE → all notifications
 * - VIP → customer notification enabled
 */
export function shouldNotify(
  event: BookingNotificationEventType,
  bookingType: BookingType,
  mode: BookingMode,
): boolean {
  const rules = BOOKING_TYPE_RULES[bookingType];
  if (!rules) return false;

  // Maintenance and blocked dates never trigger notifications
  if (bookingType === 'MAINTENANCE' || bookingType === 'BLOCKED') {
    return false;
  }

  // Owner stays only notify the owner, not the customer
  if (bookingType === 'OWNER') {
    return false; // ponytail: Owner sees it in dashboard, no email needed
  }

  // For all other types, follow the customerNotification flag
  return rules.customerNotification;
}

/**
 * Get the notification channels for a booking type.
 * Returns which channels should receive the notification.
 */
export function getNotificationChannels(
  bookingType: BookingType,
  mode: BookingMode,
): Array<'EMAIL' | 'SMS' | 'PUSH' | 'DASHBOARD'> {
  if (!shouldNotify('BOOKING_CREATED', bookingType, mode)) {
    // Even silent bookings show in dashboard
    return ['DASHBOARD'];
  }

  // Customer bookings get all channels
  if (mode === 'CUSTOMER') {
    return ['EMAIL', 'SMS', 'PUSH', 'DASHBOARD'];
  }

  // Owner/Staff created bookings — customer gets email + dashboard
  return ['EMAIL', 'DASHBOARD'];
}
