import { NextResponse } from 'next/server';
import { prisma } from '@villa-platform/database';

export async function GET() {
  try {
    const user = await prisma.user.findFirst({
      select: { walletBalance: true },
    });

    return NextResponse.json({
      walletBalance: Number(user?.walletBalance || 0)
    });
  } catch (error: any) {
    console.error('Failed to fetch wallet:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
