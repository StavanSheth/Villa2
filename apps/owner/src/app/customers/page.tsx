import React from 'react';
import { prisma } from '@villa-platform/database';
import { CustomerList } from './CustomerList';

import { redirect } from 'next/navigation';
import { requireAuth } from '../../lib/auth';

export default async function CustomersPage() {
  const auth = await requireAuth();
  if (!auth) redirect('/login');

  const users = await prisma.user.findMany({
    where: {
      bookings: { 
        some: auth.role === 'SUPER_ADMIN' 
          ? {} 
          : { 
              villa: { 
                OR: [
                  { ownerId: auth.userId },
                  { ownerId: null }
                ]
              } 
            } 
      }
    },
    include: {
      bookings: {
        where: auth.role === 'SUPER_ADMIN' 
          ? {} 
          : { 
              villa: { 
                OR: [
                  { ownerId: auth.userId },
                  { ownerId: null }
                ]
              } 
            },
        include: { villa: true, reviews: true },
        orderBy: { createdAt: 'desc' }
      }
    },
    orderBy: { createdAt: 'desc' }
  });

  const formattedUsers = users.map(user => ({
    ...user,
    walletBalance: Number(user.walletBalance),
    bookings: user.bookings.map(booking => ({
      ...booking,
      currentTotal: Number(booking.currentTotal),
      totalPaid: Number(booking.totalPaid),
      cleaningFee: Number(booking.cleaningFee),
      platformFee: Number(booking.platformFee),
      gstAmount: Number(booking.gstAmount),
      discountAmount: Number(booking.discountAmount),
      cancellationRefund: booking.cancellationRefund ? Number(booking.cancellationRefund) : null,
      amountToBePaid: booking.amountToBePaid ? Number(booking.amountToBePaid) : 0,
      pendingRefund: booking.pendingRefund ? Number(booking.pendingRefund) : 0,
      totalAdvancePaid: booking.totalAdvancePaid ? Number(booking.totalAdvancePaid) : 0,
      totalBalancePaid: booking.totalBalancePaid ? Number(booking.totalBalancePaid) : 0,
      totalRefunded: booking.totalRefunded ? Number(booking.totalRefunded) : 0,
      villa: booking.villa ? {
        ...booking.villa,
        basePrice: Number(booking.villa.basePrice)
      } : null
    }))
  }));

  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-foreground">Customers</h1>
          <p className="text-muted-foreground mt-1">Directory of guests who have booked your properties.</p>
        </div>
      </div>
      
      <CustomerList users={formattedUsers} />
    </div>
  );
}
