import { redis } from '@villa-platform/cache';

const LOCK_PREFIX = 'booking_lock:';
const LOCK_TTL_SECONDS = 15 * 60; // 15 minutes

/**
 * Attempts to acquire a temporary inventory lock for a villa and date range.
 * Uses Redis SETNX (set if not exists) to prevent concurrent bookings.
 * 
 * @param villaId The ID of the villa to lock
 * @param dateRange A string representing the date range (e.g., '2026-08-10_2026-08-15')
 * @param customerId The ID of the customer acquiring the lock
 * @returns boolean True if lock was acquired, false if already locked
 */
export async function acquireBookingLock(villaId: string, dateRange: string, customerId: string): Promise<boolean> {
  const lockKey = `${LOCK_PREFIX}${villaId}:${dateRange}`;
  
  // Set the lock with a 15 minute TTL only if it doesn't already exist (NX)
  const result = await redis.set(lockKey, customerId, {
    ex: LOCK_TTL_SECONDS,
    nx: true
  });
  
  return result === 'OK';
}

/**
 * Releases a previously acquired booking lock.
 * Called when a booking is confirmed, cancelled, or aborted.
 */
export async function releaseBookingLock(villaId: string, dateRange: string): Promise<void> {
  const lockKey = `${LOCK_PREFIX}${villaId}:${dateRange}`;
  await redis.del(lockKey);
}

/**
 * Checks if a specific date range for a villa is currently locked.
 */
export async function isBookingLocked(villaId: string, dateRange: string): Promise<boolean> {
  const lockKey = `${LOCK_PREFIX}${villaId}:${dateRange}`;
  const exists = await redis.exists(lockKey);
  return exists === 1;
}
