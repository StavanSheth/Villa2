import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const events = await prisma.bookingEvent.findMany({
    where: { booking: { bookingCode: 'MVN-2026-6705' } },
    orderBy: { createdAt: 'desc' }
  });
  console.log("EVENTS:", JSON.stringify(events, null, 2));
}
main().catch(console.error).finally(() => prisma.$disconnect());
