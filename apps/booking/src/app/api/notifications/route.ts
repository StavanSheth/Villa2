import { NextResponse } from 'next/server';
import { prisma } from '@villa-platform/database';

export async function GET() {
  try {
    const events = await prisma.bookingEvent.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        booking: {
          include: { villa: true }
        }
      }
    });

    const notifications = events.map((evt) => {
      let type: 'success' | 'payment' | 'system' = 'system';
      let title = `Booking ${evt.action}`;
      let message = `Action '${evt.action}' executed by ${evt.actorRole}.`;

      if (evt.action === 'CREATE' || evt.action === 'CONFIRM') {
        type = 'success';
        title = 'Booking Confirmed!';
        message = `Your stay at ${evt.booking.villa?.name || 'Villa'} is ${evt.newState || 'confirmed'}.`;
      } else if (evt.action === 'PAYMENT' || evt.action === 'COLLECT_PAYMENT') {
        type = 'payment';
        title = 'Payment Recorded';
        message = `Payment of ₹${Number(evt.booking.totalPaid).toLocaleString()} verified for booking ${evt.booking.bookingCode}.`;
      } else if (evt.action === 'CANCEL') {
        type = 'system';
        title = 'Booking Cancelled';
        message = `Reservation ${evt.booking.bookingCode} was cancelled.`;
      }

      return {
        id: evt.id,
        type,
        title,
        message,
        timestamp: new Date(evt.createdAt).toLocaleString(undefined, {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        }),
        read: false
      };
    });

    return NextResponse.json(notifications);
  } catch (error) {
    console.error('Failed to fetch notifications:', error);
    return NextResponse.json({ error: 'Failed to fetch notifications' }, { status: 500 });
  }
}
