import { prisma } from '@villa-platform/database';

export async function handleAbandonedBookings(env: any) {
  console.log('Running abandoned bookings cron job...');
  
  // Find bookings that are 'Pending' or 'Awaiting Payment' and older than 15 minutes
  const fifteenMinsAgo = new Date(Date.now() - 15 * 60 * 1000);
  
  try {
    // In a real app with D1, we might use the raw query or Prisma Client
    const abandonedBookings = await prisma.booking.findMany({
      where: {
        status: { in: ['PENDING', 'AWAITING_PAYMENT'] },
        createdAt: { lt: fifteenMinsAgo },
      },
      select: { id: true }
    });

    if (abandonedBookings.length === 0) {
      console.log('No abandoned bookings found.');
      return;
    }

    const bookingIds = abandonedBookings.map(b => b.id);
    console.log(`Found ${bookingIds.length} abandoned bookings. Enqueueing cancellation...`);

    // Send messages to the queue
    for (const id of bookingIds) {
      await env.BOOKING_QUEUE.send({ type: 'CANCEL_ABANDONED', bookingId: id });
    }
  } catch (error) {
    console.error('Error finding abandoned bookings:', error);
  }
}
