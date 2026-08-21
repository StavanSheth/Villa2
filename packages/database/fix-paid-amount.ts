import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function fixPaidAmount() {
  const bookings = await prisma.booking.findMany({
    where: { bookingCode: { startsWith: 'MVN-2026-' } },
  });

  for (const booking of bookings) {
    // If it's 0, let's fix it by summing transaction events or just pulling it from metadata of the latest event
    const events = await prisma.bookingEvent.findMany({
      where: { bookingId: booking.id },
      orderBy: { createdAt: 'desc' }
    });
    
    if (events.length > 0) {
      const latestMeta = events[0].metadata as any;
      if (latestMeta && latestMeta.paidAmount !== undefined) {
        await prisma.booking.update({
          where: { id: booking.id },
          data: { paidAmount: latestMeta.paidAmount }
        });
        console.log(`Updated ${booking.bookingCode} paidAmount to ${latestMeta.paidAmount}`);
      }
    }
  }
}

fixPaidAmount()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
