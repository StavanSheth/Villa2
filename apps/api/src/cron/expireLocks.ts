import { prisma } from '@villa-platform/database';

export async function expireReservationLocks() {
  console.log('Running expire reservation locks cron job...');
  
  try {
    const expiredLocks = await prisma.reservationLock.findMany({
      where: {
        status: 'LOCKED',
        expiresAt: { lt: new Date() },
      },
      select: { id: true }
    });

    if (expiredLocks.length === 0) {
      console.log('No expired reservation locks found.');
      return;
    }

    const lockIds = expiredLocks.map(l => l.id);
    console.log(`Found ${lockIds.length} expired reservation locks. Expiring...`);

    const result = await prisma.reservationLock.updateMany({
      where: { id: { in: lockIds } },
      data: { status: 'EXPIRED' }
    });

    console.log(`Successfully expired ${result.count} reservation locks.`);
  } catch (error) {
    console.error('Error expiring reservation locks:', error);
  }
}
