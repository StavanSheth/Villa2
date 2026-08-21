import { prisma } from '@villa-platform/database';
import { releaseBookingLock } from '@villa-platform/booking-logic';

export async function processBookingQueue(batch: any, env: any) {
  for (const msg of batch.messages) {
    const { type, bookingId } = msg.body;
    
    if (type === 'CANCEL_ABANDONED') {
      console.log(`Processing cancellation for abandoned booking: ${bookingId}`);
      
      try {
        // Find the booking
        const booking = await prisma.booking.findUnique({ where: { id: bookingId }});
        if (!booking || (booking.status !== 'PENDING' && booking.status !== 'AWAITING_PAYMENT')) {
          msg.ack();
          continue;
        }

        // Cancel booking in DB
        await prisma.booking.update({
          where: { id: bookingId },
          data: { status: 'CANCELLED' }
        });

        // Release Inventory Lock
        const dateRange = `${booking.startDate.toISOString().split('T')[0]}_${booking.endDate.toISOString().split('T')[0]}`;
        await releaseBookingLock(booking.villaId, dateRange);

        // TODO: Call Razorpay API to cancel payment intent if AWAITING_PAYMENT
        
        // Log Audit
        await prisma.auditLog.create({
          data: {
            action: 'CANCEL_ABANDONED',
            resource: 'Booking',
            userId: booking.customerId,
            role: 'SYSTEM',
          }
        });

        msg.ack();
      } catch (error) {
        console.error(`Failed to cancel booking ${bookingId}:`, error);
        msg.retry();
      }
    }
  }
}
