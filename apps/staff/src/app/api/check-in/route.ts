import { NextResponse } from 'next/server';
import { prisma } from '@villa-platform/database';

export async function POST(req: Request) {
  try {
    const { bookingId, collectCash } = await req.json();

    if (!bookingId) {
      return NextResponse.json({ error: 'Missing bookingId' }, { status: 400 });
    }

    // Wrap in a transaction to ensure both status updates and events log
    await prisma.$transaction(async (tx: any) => {
      
      // If cash is collected during check-in, record it
      if (collectCash && collectCash > 0) {
        await tx.paymentTransaction.create({
          data: {
            bookingId: bookingId,
            amount: collectCash,
            method: 'CASH',
            status: 'COMPLETED',
            verifiedBy: 'STAFF_CHECKIN'
          }
        });

        await tx.booking.update({
          where: { id: bookingId },
          data: {
            totalBalancePaid: { increment: collectCash },
            totalPaid: { increment: collectCash },
            amountToBePaid: { decrement: collectCash }
          }
        });
      }

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
