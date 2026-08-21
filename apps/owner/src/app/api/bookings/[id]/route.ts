import { NextResponse } from 'next/server';
import { prisma, validateTransition } from '@villa-platform/database';
import { processLedgerTransaction } from '../../../../../../../packages/database/queries/ledger';

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleBookingUpdate(req, params);
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  return handleBookingUpdate(req, params);
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

      const updatedBooking = await prisma.$transaction(async (tx) => {
        const updated = await tx.booking.update({
          where: { id: booking.id },
          data: { status: fsmResult.newState }
        });

        await tx.bookingEvent.create({
          data: {
            bookingId: booking.id,
            actorId: 'owner-session',
            actorRole: 'OWNER',
            action: 'CANCEL',
            oldState: booking.status,
            newState: fsmResult.newState,
            metadata: metadata || { notes: notes || 'Cancelled by Owner' }
          }
        });

        // Use the new ledger system
        await processLedgerTransaction(tx as any, booking.id, {
          actionType: 'CANCEL',
          actorRole: 'OWNER',
          orderValueDelta: 0,
          advancePaymentDelta: 0,
          balancePaymentDelta: 0,
        });

        return updated;
      });

      return NextResponse.json(updatedBooking);
    }

    return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
  } catch (error: any) {
    console.error('Error updating booking:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
