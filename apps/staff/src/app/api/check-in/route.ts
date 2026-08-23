import { NextResponse } from 'next/server';
import { prisma } from '@villa-platform/database';

export async function POST(req: Request) {
  try {
    const { bookingId } = await req.json();

    if (!bookingId) {
      return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
    }

    // Wrap in a transaction to ensure both status updates and events log
    await prisma.$transaction(async (tx) => {
      // Update the booking status to CHECKED_IN
      await tx.booking.update({
        where: { id: bookingId },
        data: {
          status: 'CHECKED_IN'
        }
      });

      // Log the damage deposit check-in event
      await tx.bookingEvent.create({
        data: {
          bookingId: bookingId,
          action: 'CHECK_IN',
          actorId: 'staff-user-id', 
          actorRole: 'STAFF',
          newState: 'CHECKED_IN',
          metadata: {
            notes: 'Guest checked in and damage deposit collected (cash/UPI)'
          }
        }
      });
    });

    return NextResponse.json({ success: true });
    
  } catch (error: any) {
    console.error('Check-in error:', error);
    return NextResponse.json({ error: 'Failed to initiate check-in', details: error.message }, { status: 500 });
  }
}
