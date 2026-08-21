import { NextResponse } from 'next/server';
import { prisma } from '@villa-platform/database';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { villaId, checkIn, checkOut, reason } = body;

    if (!villaId || !checkIn || !checkOut) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Ponytail: For prototype, just fetch the first owner user. 
    // In production, this would be derived from the auth middleware.
    const user = await prisma.user.findFirst();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    const block = await prisma.$transaction(async (tx) => {
      // 1. Check for overlapping locks
      const overlappingLock = await tx.$queryRaw`
        SELECT id FROM "ReservationLock"
        WHERE "villaId" = ${villaId}
        AND status = 'LOCKED'
        AND "expiresAt" > NOW()
        AND "checkIn" < ${checkOutDate}
        AND "checkOut" > ${checkInDate}
        FOR UPDATE
      ` as any[];

      if (overlappingLock.length > 0) {
        throw new Error('Villa currently reserved by a customer.');
      }

      // 2. Check for overlapping confirmed bookings OR existing blocks
      const overlappingBooking = await tx.$queryRaw`
        SELECT id FROM "Booking"
        WHERE "villaId" = ${villaId}
        AND status NOT IN ('CANCELLED', 'ARCHIVED', 'DRAFT')
        AND "checkIn" < ${checkOutDate}
        AND "checkOut" > ${checkInDate}
        FOR UPDATE
      ` as any[];

      if (overlappingBooking.length > 0) {
        throw new Error('Villa already booked or blocked for these dates.');
      }

      const bookingCode = `BLOCK-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

      // 3. Create the 'BLOCKED' Booking record
      const newBlock = await tx.booking.create({
        data: {
          bookingCode,
          userId: user.id,
          villaId,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          totalGuests: 0,
          currentTotal: 0,
          status: 'BLOCKED',
          specialReqs: reason || 'Owner Maintenance Block',
        },
      });

      // 4. Log the audit event
      await tx.bookingEvent.create({
        data: {
          bookingId: newBlock.id,
          actorId: user.id,
          actorRole: 'OWNER',
          action: 'CREATE_BLOCK',
          newState: 'BLOCKED',
          metadata: { reason },
        },
      });

      return newBlock;
    }, {
      isolationLevel: 'Serializable',
      timeout: 10000
    });

    return NextResponse.json(block);
  } catch (error: any) {
    console.error('Availability Block Failed:', error);
    return NextResponse.json({ error: error.message || 'Failed to block villa' }, { status: 409 });
  }
}
