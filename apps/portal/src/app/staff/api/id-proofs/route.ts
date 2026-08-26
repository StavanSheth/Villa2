import { NextResponse } from 'next/server';
import { prisma } from '@villa-platform/database';

export async function POST(req: Request) {
  try {
    const { bookingId, fileUrl, fileType, guestName } = await req.json();

    if (!bookingId || !fileUrl) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Rely on database @default("PENDING") to avoid Outdated Prisma Client errors
    const newProof = await prisma.guestIdProof.create({
      data: {
        bookingId,
        fileUrl,
        fileType: fileType || 'image/jpeg',
        guestName: guestName || 'Guest',
      },
    });

    return NextResponse.json({ success: true, proof: newProof });
  } catch (error: any) {
    console.error('Error adding Guest ID Proof:', error);
    return NextResponse.json({ error: error.message || error.toString() || 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const { proofId, status } = await req.json();

    if (!proofId || !status) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Use raw SQL to bypass outdated Prisma Client validation since status was recently added
    await prisma.$executeRawUnsafe(`UPDATE "GuestIdProof" SET "status" = $1 WHERE "id" = $2`, status, proofId);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating Guest ID Proof status:', error);
    return NextResponse.json({ error: error.message || error.toString() || 'Internal Server Error' }, { status: 500 });
  }
}
