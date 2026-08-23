import { NextResponse } from 'next/server';
import { prisma } from '@villa-platform/database';

export async function GET() {
  try {
    const villas = await prisma.villa.findMany({
      where: { isActive: true },
      take: 5
    });

    const formattedVillas = villas.map(v => ({
      id: v.id,
      name: v.name,
      location: 'Lonavala, Maharashtra',
      imageUrl: Array.isArray(v.images) && v.images.length > 0 ? v.images[0] : 'http://localhost:3000/photos/day/Hero%20page.jpeg',
      rating: 5.0,
      reviewsCount: 24,
      guests: v.capacity,
      pricePerNight: Number(v.basePrice),
      tags: ['wifi', 'pool', 'barbeque']
    }));

    return NextResponse.json(formattedVillas);
  } catch (error) {
    console.error('Failed to fetch villas:', error);
    return NextResponse.json({ error: 'Failed to fetch villas' }, { status: 500 });
  }
}
