// apps/booking/src/app/api/services/route.ts
// Fetch all active ServiceDef records for the BookingWizard

import { NextResponse } from 'next/server';
import { prisma } from '@villa-platform/database';

export async function GET() {
  try {
    const services = await prisma.serviceDef.findMany({
      where: { isActive: true },
      orderBy: [{ type: 'asc' }, { name: 'asc' }],
    });
    return NextResponse.json(services);
  } catch (error) {
    console.error('Failed to fetch services:', error);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}
