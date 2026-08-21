import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@villa-platform/database';
import { requireAuth } from '../../../../../lib/auth';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id: bookingCode } = await params;
    const body = await request.json();
    const { amount } = body;

    if (!amount || typeof amount !== 'number') {
      return NextResponse.json({ error: 'Valid amount is required' }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { bookingCode },
      include: { user: true }
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    // Instead of resetting cancellationRefund to 0, we log the REFUND_PROCESSED event
    // and keep the cancellationRefund value intact for historical records.

    // Check if it's already refunded
    const existingRefundEvent = await prisma.bookingEvent.findFirst({
      where: {
        bookingId: booking.id,
        action: 'REFUND_PROCESSED_MANUAL'
      }
    });

    if (existingRefundEvent) {
      return NextResponse.json({ error: 'Refund already processed' }, { status: 400 });
    }

    // Process refund logic (in real world, this would call Razorpay/Stripe API)
    
    // Log the event
    await prisma.bookingEvent.create({
      data: {
        bookingId: booking.id,
        actorId: auth.userId,
        actorRole: auth.role || 'OWNER',
        action: 'REFUND_PROCESSED_MANUAL',
        oldState: booking.status,
        newState: booking.status,
        metadata: {
          refundAmount: amount,
          reason: 'Manual Refund Initiation',
          status: 'REFUNDED'
        }
      }
    });

    return NextResponse.json({ success: true, refundedAmount: amount });
  } catch (error: any) {
    console.error('Error processing refund:', error);
    return NextResponse.json(
      { error: 'Failed to process refund', details: error.message },
      { status: 500 }
    );
  }
}
