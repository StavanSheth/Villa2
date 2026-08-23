import { NextResponse } from 'next/server';
import { prisma } from '@villa-platform/database';
import { requirePermission } from '@villa-platform/identity/permissions';

export async function POST(req: Request) {
  try {
    // 1. RBAC Check
    await requirePermission('promos', 'create');

    const body = await req.json();
    
    // Validate required fields
    if (!body.code || !body.type || body.value === undefined) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    const promo = await prisma.promoCode.create({
      data: {
        code: body.code.toUpperCase().trim(),
        description: body.description || null,
        type: body.type, // 'PERCENTAGE' | 'FIXED'
        value: Number(body.value),
        minBookingAmt: body.minBookingAmt ? Number(body.minBookingAmt) : null,
        maxDiscount: body.maxDiscount ? Number(body.maxDiscount) : null,
        minNights: body.minNights ? Number(body.minNights) : null,
        maxNights: body.maxNights ? Number(body.maxNights) : null,
        startDate: body.startDate ? new Date(body.startDate) : null,
        expiryDate: body.expiryDate ? new Date(body.expiryDate) : null,
        usageLimit: body.usageLimit ? Number(body.usageLimit) : null,
        status: body.status || 'ACTIVE',
      },
    });

    return NextResponse.json(promo);
  } catch (error: any) {
    console.error('Error creating promo:', error);
    if (error.name === 'ForbiddenError' || error.message?.includes('not authorized')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'Promo code already exists' }, { status: 400 });
    }
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
