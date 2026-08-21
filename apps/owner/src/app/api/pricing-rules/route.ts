import { NextResponse } from 'next/server';
import { prisma } from '@villa-platform/database';
import { requireAuth } from '../../../lib/auth';

export async function POST(req: Request) {
  try {
    const auth = await requireAuth();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const { villaId, type, price, minNights, startDate, endDate } = body;

    if (!villaId || !type || price === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    if (auth.role !== 'SUPER_ADMIN') {
      const villa = await prisma.villa.findUnique({ where: { id: villaId } });
      if (!villa || (villa.ownerId !== null && villa.ownerId !== auth.userId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    const rule = await prisma.pricingRule.create({
      data: {
        villaId,
        type,
        price: Number(price),
        minNights: minNights ? Number(minNights) : 1,
        startDate: startDate ? new Date(startDate) : null,
        endDate: endDate ? new Date(endDate) : null,
      },
    });

    return NextResponse.json(rule);
  } catch (error: any) {
    console.error('Error creating pricing rule:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
