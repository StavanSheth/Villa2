import { NextResponse } from 'next/server';
import { prisma, validateTransition } from '@villa-platform/database';
import { processLedgerTransaction } from '../../../../../../../packages/database/queries/ledger';
import { CancellationService } from '@villa-platform/bookings';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleBookingUpdate(req, { params });
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleBookingUpdate(req, { params });
}

async function handleBookingUpdate(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params; // id is the bookingCode or UUID
    const body = await req.json();
    const { action, notes, metadata } = body;

    const booking = await prisma.booking.findFirst({
      where: {
        OR: [
          { bookingCode: id },
          { id: id }
        ]
      }
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    if (action === 'CANCEL') {
      const fsmResult = validateTransition(booking.status, 'CANCEL', 'OWNER');
      if (!fsmResult.valid || !fsmResult.newState) {
        return NextResponse.json({ error: fsmResult.error || 'Invalid state transition' }, { status: 400 });
      }

      const result = await CancellationService.cancelBooking({
        bookingId: booking.id,
        action: 'CANCEL',
        actorRole: 'OWNER',
        actorId: 'owner-session',
        metadata: metadata || { notes: notes || 'Cancelled by Owner' }
      });

      return NextResponse.json(result.booking);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating booking:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
