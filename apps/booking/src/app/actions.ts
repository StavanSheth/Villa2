'use server';

import { prisma } from '@villa-platform/database';
import { BookingEngineService } from '@villa-platform/bookings';

export async function getBookings() {
  const bookings = await prisma.booking.findMany({
    include: {
      user: true,
      villa: true,
      services: true,
      events: { orderBy: { createdAt: 'desc' }, take: 5 },
      orderTransactions: { orderBy: { srNo: 'desc' }, take: 1 },
    },
    orderBy: { createdAt: 'desc' },
  });
  return JSON.parse(JSON.stringify(bookings));
}

export async function getBookingByCode(bookingCode: string) {
  const booking = await prisma.booking.findUnique({
    where: { bookingCode },
    include: {
      user: true,
      villa: true,
      services: true,
      events: { orderBy: { createdAt: 'desc' } },
    }
  });
  return JSON.parse(JSON.stringify(booking));
}

export async function cancelBooking(bookingId: string) {
  // In a real app we'd get actorId and actorRole from the session
  const actorId = 'mock-user-id'; 
  const actorRole = 'CUSTOMER';
  return BookingEngineService.cancelBooking(bookingId, actorId, actorRole, 'Cancelled by user from GUI');
}

export async function getWallet(userId?: string) {
  const user = await prisma.user.findFirst({
    select: { walletBalance: true },
  });
  return { balance: Number(user?.walletBalance || 0), currency: 'INR' };
}

export async function getServices() {
  const services = await prisma.serviceDef.findMany({ where: { isActive: true } });
  return JSON.parse(JSON.stringify(services));
}

export async function getNotifications(userId?: string) {
  const events = await prisma.bookingEvent.findMany({
    take: 10,
    orderBy: { createdAt: 'desc' },
    include: {
      booking: {
        include: { villa: true }
      }
    }
  });

  return events.map((evt) => {
    let type: 'success' | 'payment' | 'system' = 'system';
    let title = `Booking ${evt.action}`;
    let message = `Action '${evt.action}' executed by ${evt.actorRole}.`;

    if (evt.action === 'CREATE' || evt.action === 'CONFIRM') {
      type = 'success';
      title = 'Booking Confirmed!';
      message = `Your stay at ${evt.booking.villa?.name || 'Villa'} is ${evt.newState || 'confirmed'}.`;
    } else if (evt.action === 'PAYMENT' || evt.action === 'COLLECT_PAYMENT') {
      type = 'payment';
      title = 'Payment Recorded';
      message = `Payment of ₹${Number(evt.booking.totalPaid).toLocaleString()} verified for booking ${evt.booking.bookingCode}.`;
    } else if (evt.action === 'CANCEL') {
      type = 'system';
      title = 'Booking Cancelled';
      message = `Reservation ${evt.booking.bookingCode} was cancelled.`;
    }

    return {
      id: evt.id,
      type,
      title,
      message,
      timestamp: new Date(evt.createdAt).toLocaleString(undefined, {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      }),
      read: false
    };
  });
}

export async function getVillas() {
  const villas = await prisma.villa.findMany({
    where: { isActive: true },
    take: 5
  });

  return villas.map(v => ({
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
}
