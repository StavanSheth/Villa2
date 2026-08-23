// apps/booking/src/app/api/bookings/[id]/events/route.ts
// BookingEvent audit trail API

import { NextResponse } from 'next/server';
import { prisma } from '@villa-platform/database';

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    // Find booking by code
    const booking = await prisma.booking.findUnique({
      where: { bookingCode: id },
      select: { id: true },
    });

    if (!booking) {
      return NextResponse.json({ error: 'Booking not found' }, { status: 404 });
    }

    const events = await prisma.bookingEvent.findMany({
      where: { bookingId: booking.id },
      orderBy: { createdAt: 'asc' },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error('GET events error:', error);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
