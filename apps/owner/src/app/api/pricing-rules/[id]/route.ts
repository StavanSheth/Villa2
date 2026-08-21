import { NextResponse } from 'next/server';
import { prisma } from '@villa-platform/database';
import { requireAuth } from '../../../../lib/auth';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const resolvedParams = await params;
    const { id } = resolvedParams;

    const rule = await prisma.pricingRule.findUnique({ where: { id }, include: { villa: true } });
    if (!rule) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (auth.role !== 'SUPER_ADMIN' && rule.villa.ownerId !== null && rule.villa.ownerId !== auth.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await prisma.pricingRule.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting pricing rule:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireAuth();
    if (!auth) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await req.json();

    const rule = await prisma.pricingRule.findUnique({ where: { id }, include: { villa: true } });
    if (!rule) {
      return NextResponse.json({ error: 'Not found' }, { status: 404 });
    }

    if (auth.role !== 'SUPER_ADMIN' && rule.villa.ownerId !== null && rule.villa.ownerId !== auth.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updatedRule = await prisma.pricingRule.update({
      where: { id },
      data: {
        villaId: body.villaId,
        type: body.type,
        price: body.price !== undefined ? Number(body.price) : undefined,
        minNights: body.minNights !== undefined ? Number(body.minNights) : undefined,
        startDate: body.startDate ? new Date(body.startDate) : null,
        endDate: body.endDate ? new Date(body.endDate) : null,
      },
    });

    return NextResponse.json(updatedRule);
  } catch (error: any) {
    console.error('Error updating pricing rule:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
