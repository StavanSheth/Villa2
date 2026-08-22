import { prisma } from '@villa-platform/database';
import { releaseBookingLock } from '@villa-platform/bookings';

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
        const updatedBooking = await prisma.booking.update({
          where: { id: bookingId },
          data: { status: 'CANCELLED' }
        });

        // Release Inventory Lock
        const dateRange = `${updatedBooking.checkIn.toISOString().split('T')[0]}_${updatedBooking.checkOut.toISOString().split('T')[0]}`;
        await releaseBookingLock(updatedBooking.villaId, dateRange);

        // TODO: Call Razorpay API to cancel payment intent if AWAITING_PAYMENT
        
        // Log Audit to BookingEvent instead of AuditLog for correct history
        await prisma.bookingEvent.create({
          data: {
            bookingId: bookingId,
            actorId: updatedBooking.userId,
            actorRole: 'SYSTEM',
            action: 'CANCEL_ABANDONED',
            oldState: booking.status,
            newState: 'CANCELLED',
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
