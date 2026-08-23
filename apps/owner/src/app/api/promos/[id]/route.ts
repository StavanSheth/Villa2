import { NextResponse } from 'next/server';
import { prisma } from '@villa-platform/database';
import { requirePermission } from '@villa-platform/identity/permissions';

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. RBAC Check
    await requirePermission('promos', 'delete');

    const resolvedParams = await params;
    const { id } = resolvedParams;
    
    // Check if promo is used in any bookings
    const bookingsCount = await prisma.booking.count({
      where: { promoCodeId: id }
    });

    if (bookingsCount > 0) {
      return NextResponse.json(
        { error: 'Cannot delete promo code because it is currently used in one or more bookings.' },
        { status: 400 }
      );
    }

    await prisma.promoCode.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting promo:', error);
    if (error.name === 'ForbiddenError' || error.message.includes('not authorized')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to delete promo' }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. RBAC Check
    await requirePermission('promos', 'update');

    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await req.json();

    const promo = await prisma.promoCode.update({
      where: { id },
      data: {
        code: body.code?.toUpperCase().trim(),
        description: body.description,
        type: body.type,
        value: body.value ? Number(body.value) : undefined,
        minBookingAmt: body.minBookingAmt !== undefined ? Number(body.minBookingAmt) : null,
        maxDiscount: body.maxDiscount !== undefined ? Number(body.maxDiscount) : null,
        minNights: body.minNights !== undefined ? Number(body.minNights) : null,
        maxNights: body.maxNights !== undefined ? Number(body.maxNights) : null,
        startDate: body.startDate !== undefined ? (body.startDate ? new Date(body.startDate) : null) : undefined,
        expiryDate: body.expiryDate !== undefined ? (body.expiryDate ? new Date(body.expiryDate) : null) : undefined,
        usageLimit: body.usageLimit !== undefined ? Number(body.usageLimit) : null,
        status: body.status,
      },
    });

    return NextResponse.json(promo);
  } catch (error: any) {
    console.error('Error updating promo:', error);
    if (error.name === 'ForbiddenError' || error.message.includes('not authorized')) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
    return NextResponse.json({ error: 'Failed to update promo' }, { status: 500 });
  }
}
