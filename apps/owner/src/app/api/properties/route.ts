import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@villa-platform/database';
import { requireAuth } from '../../../lib/auth';

export async function POST(req: NextRequest) {
  try {
    const auth = await requireAuth();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json();
    const { name, description, basePrice, capacity, bedrooms, bathrooms, amenities, images, isActive } = body;

    const villa = await prisma.villa.create({
      data: {
        ownerId: auth.userId,
        name,
        description,
        basePrice,
        capacity: Number(capacity),
        bedrooms: Number(bedrooms),
        bathrooms: Number(bathrooms),
        amenities: amenities || [],
        images: images || [],
        isActive: isActive ?? true,
      }
    });

    return NextResponse.json(villa);
  } catch (error) {
    console.error('Failed to create property:', error);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
