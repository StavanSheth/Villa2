import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const bookingCode = 'MVN-2026-6705';
  
  // Find the latest edit event that had a refund
  const latestRefundEvent = await prisma.bookingEvent.findFirst({
    where: { 
      booking: { bookingCode },
      metadata: { path: ['refundAmount'], gt: 0 }
    },
    orderBy: { createdAt: 'desc' }
  });

  if (latestRefundEvent) {
    const metadata = latestRefundEvent.metadata as any;
    console.log("Found refund event, amount:", metadata.refundAmount);
    
    // Patch the booking
    await prisma.booking.updateMany({
      where: { bookingCode },
      data: {
        refundPolicySnapshot: {
          status: 'PENDING_OWNER_SELECTION',
          amount: metadata.refundAmount,
          tier: metadata.refundTier || 'ADJUSTMENT_REFUND',
          idempotencyKey: metadata.refundIdempotencyKey || `refund-${Date.now()}`
        }
      }
    });
    console.log("Successfully patched the booking.");
  } else {
    console.log("No refund event found.");
  }
}

main().catch(console.error).finally(() => prisma.$disconnect());
