import { beforeAll, afterAll, vi } from 'vitest';
import { prisma } from '@villa-platform/database';

beforeAll(async () => {
  // Set environment variables for testing
  process.env.MOCK_RAZORPAY = 'true';

  // Clean up database so tests can run repeatedly
  await prisma.paymentTransaction.deleteMany();
  await prisma.promoUsage.deleteMany();
  await prisma.bookingEvent.deleteMany();
  await prisma.bookingService.deleteMany();
  await prisma.booking.deleteMany({
    where: { bookingCode: { startsWith: 'TEST-' } }
  });
  await prisma.reservationLock.deleteMany();
  await prisma.promoCode.deleteMany({
    where: { code: { startsWith: 'PRM-' } }
  });

  // No need to mock fetch, we mock upstash
});

vi.mock('@upstash/redis', () => {
  const cache = new Map();
  return {
    Redis: class {
      static fromEnv() { return new this(); }
      async set(key: string, value: string, opts: any) {
        if (opts?.nx && cache.has(key)) return null;
        cache.set(key, value);
        return 'OK';
      }
      async get(key: string) { return cache.get(key); }
    }
  };
});
