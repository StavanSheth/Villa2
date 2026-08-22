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

    // Extract user from JWT token
    const cookieHeader = req.headers.get('cookie') || '';
    const matchAccess = cookieHeader.match(/access_token=([^;]+)/);
    
    let userId;
    if (matchAccess) {
      try {
        const token = matchAccess[1];
        const payloadBase64 = token.split('.')[1];
        const payload = JSON.parse(atob(payloadBase64));
        
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
          return NextResponse.json({ error: 'Token expired' }, { status: 401 });
        }
        
        userId = payload.id;
      } catch (e) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized: User not found in token' }, { status: 401 });
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
          userId: userId,
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
          actorId: userId,
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
