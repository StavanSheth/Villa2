import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@villa-platform/database';
import { requireAuth } from '../../../../lib/auth';

export async function PUT(req: NextRequest, props: { params: Promise<{ id: string }> }) {
  try {
    const auth = await requireAuth();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = await props.params;

    // Verify ownership
    let finalOwnerId = undefined;
    if (auth.role !== 'SUPER_ADMIN') {
      const existing = await prisma.villa.findUnique({ where: { id } });
      if (!existing || (existing.ownerId !== null && existing.ownerId !== auth.userId)) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
      if (existing.ownerId === null) {
        finalOwnerId = auth.userId;
      }
    }

    const body = await req.json();
    const { name, description, basePrice, capacity, bedrooms, bathrooms, amenities, images, isActive } = body;

    const villa = await prisma.villa.update({
      where: { id },
      data: {
        ...(finalOwnerId ? { ownerId: finalOwnerId } : {}),
        name,
        description,
        basePrice,
        capacity: Number(capacity),
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        amenities: amenities || undefined,
        images: images || undefined,
        isActive,
      }
    });

    return NextResponse.json(villa);
  } catch (error) {
    console.error('Failed to update property:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
