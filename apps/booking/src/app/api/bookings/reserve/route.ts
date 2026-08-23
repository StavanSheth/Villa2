import { NextResponse } from 'next/server';
import { prisma } from '@villa-platform/database';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { villaId, checkIn, checkOut } = body;

    if (!villaId || !checkIn || !checkOut) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);

    // Read user from header
    const cookieHeader = req.headers.get('cookie') || '';
    const matchAccess = cookieHeader.match(/access_token=([^;]+)/);
    let userId;
    if (matchAccess) {
      try {
        const token = matchAccess[1];
        const payloadBase64 = token.split('.')[1];
        const payload = JSON.parse(atob(payloadBase64));
        
        // Check expiration
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
          return NextResponse.json({ error: 'Token expired' }, { status: 401 });
        }
        
        userId = payload.id;
      } catch (e) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
    }

    const user = await prisma.user.findFirst({ where: userId ? { id: userId } : undefined });
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 401 });
    }

    // Wrap the entire lock creation in a serializable transaction to prevent race conditions
    const lock = await prisma.$transaction(async (tx) => {
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
        throw new Error('Villa currently reserved by another customer.');
      }

      // 2. Check for overlapping confirmed bookings
      const overlappingBooking = await tx.$queryRaw`
        SELECT id FROM "Booking"
        WHERE "villaId" = ${villaId}
        AND status NOT IN ('CANCELLED', 'ARCHIVED', 'DRAFT')
        AND "checkIn" < ${checkOutDate}
        AND "checkOut" > ${checkInDate}
        FOR UPDATE
      ` as any[];

      if (overlappingBooking.length > 0) {
        throw new Error('Villa already booked for these dates.');
      }

      // 3. Create lock (15 minute expiration)
      const expiresAt = new Date(Date.now() + 15 * 60 * 1000);
      
      const newLock = await tx.reservationLock.create({
        data: {
          villaId,
          customerId: user.id,
          checkIn: checkInDate,
          checkOut: checkOutDate,
          expiresAt,
          status: 'LOCKED',
        },
      });

      return newLock;
    }, {
      isolationLevel: 'Serializable',
      timeout: 10000
    });

    return NextResponse.json({ lockId: lock.id, expiresAt: lock.expiresAt });
  } catch (error: any) {
    console.error('Reservation Lock Failed:', error);
    return NextResponse.json({ error: error.message || 'Failed to reserve villa' }, { status: 409 });
  }
}
