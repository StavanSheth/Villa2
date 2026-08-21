import { NextResponse } from 'next/server';
import { prisma } from '@villa-platform/database';
import { requireAuth } from '../../../lib/auth';
import * as xlsx from 'xlsx';

export async function GET(req: Request) {
  try {
    const auth = await requireAuth();
    if (!auth) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const villas = await prisma.villa.findMany({
      where: auth.role === 'SUPER_ADMIN' ? {} : { 
        OR: [
          { ownerId: auth.userId },
          { ownerId: null }
        ]
      },
    });
    
    const villaIds = villas.map(v => v.id);

    const bookings = await prisma.booking.findMany({
      where: { villaId: { in: villaIds } },
      include: {
        user: true,
        villa: true,
      },
      orderBy: { createdAt: 'desc' }
    });

    const data = bookings.map(b => ({
      'Booking ID': b.id,
      'Booking Code': b.bookingCode,
      'Status': b.status,
      'Guest First Name': b.user?.firstName || '',
      'Guest Last Name': b.user?.lastName || '',
      'Guest Email': b.user?.email || '',
      'Villa Name': b.villa?.name || 'Unknown',
      'Check In': new Date(b.checkIn).toLocaleDateString(),
      'Check Out': new Date(b.checkOut).toLocaleDateString(),
      'Total Guests': b.totalGuests,
      'Cleaning Fee': Number(b.cleaningFee) || 0,
      'Platform Fee': Number(b.platformFee) || 0,
      'GST Amount': Number(b.gstAmount) || 0,
      'Discount Amount': Number(b.discountAmount) || 0,
      'Total Amount': Number(b.currentTotal) || 0,
      'Paid Amount': Number(b.totalPaid) || 0,
      'Balance Owed': (Number(b.currentTotal) || 0) - (Number(b.totalPaid) || 0),
      'Cancellation Refund': Number(b.cancellationRefund) || 0,
      'Created At': new Date(b.createdAt).toLocaleString(),
    }));

    const worksheet = xlsx.utils.json_to_sheet(data);
    const workbook = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(workbook, worksheet, 'Bookings');

    const buf = xlsx.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return new NextResponse(buf, {
      status: 200,
      headers: {
        'Content-Disposition': 'attachment; filename="bookings-export.xlsx"',
        'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      }
    });

  } catch (error: any) {
    console.error('Error generating export:', error);
    return NextResponse.json({ error: 'Failed to generate export' }, { status: 500 });
  }
}
