import { NextResponse } from 'next/server';
import { prisma } from '@villa-platform/database';
import { requireAuth } from '../../../lib/auth';

export async function GET() {
  try {
    const services = await prisma.serviceDef.findMany({
      orderBy: { name: 'asc' },
    });
    return NextResponse.json(services);
  } catch (error: any) {
    console.error('Error fetching services:', error);
    return NextResponse.json({ error: 'Failed to fetch services' }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const auth = await requireAuth();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const data = await req.json();

    const service = await prisma.serviceDef.create({
      data: {
        name: data.name,
        description: data.description || null,
        category: data.category || 'OTHER',
        type: data.type || 'PAID',
        chargeType: data.chargeType || 'PER_BOOKING',
        price: Number(data.price) || 0,
        taxable: typeof data.taxable === 'boolean' ? data.taxable : true,
      },
    });

    return NextResponse.json(service);
  } catch (error: any) {
    console.error('Error creating service:', error);
    return NextResponse.json({ error: 'Failed to create service' }, { status: 500 });
  }
}
