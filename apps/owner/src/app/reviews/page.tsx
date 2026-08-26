import React from 'react';
import { prisma } from '@villa-platform/database';
import { ReviewManager } from './ReviewManager';
import { redirect } from 'next/navigation';
import { requireAuth } from '../../lib/auth';

export default async function ReviewsPage() {
  const auth = await requireAuth();
  if (!auth) redirect('/login');

  const reviews = await prisma.review.findMany({
    where: auth.role === 'SUPER_ADMIN' ? {} : {
      villa: {
        OR: [
          { ownerId: auth.userId },
          { ownerId: null }
        ]
      }
    },
    include: {
      user: true,
      villa: true,
      booking: true,
    },
    orderBy: { createdAt: 'desc' }
  });

  const formattedReviews = reviews.map(review => ({
    ...review,
    user: {
      ...review.user,
      walletBalance: Number(review.user.walletBalance)
    },
    villa: {
      ...review.villa,
      basePrice: Number(review.villa.basePrice)
    },
    booking: review.booking ? {
      ...review.booking,
      currentTotal: Number(review.booking.currentTotal),
      totalPaid: Number(review.booking.totalPaid),
      cleaningFee: Number(review.booking.cleaningFee),
      platformFee: Number(review.booking.platformFee),
      gstAmount: Number(review.booking.gstAmount),
      discountAmount: Number(review.booking.discountAmount),
      cancellationRefund: review.booking.cancellationRefund ? Number(review.booking.cancellationRefund) : null,
    } : null
  }));

  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-foreground">Guest Reviews</h1>
          <p className="text-muted-foreground mt-1">Read and respond to feedback from your past guests.</p>
        </div>
      </div>

      <ReviewManager initialReviews={formattedReviews} />
    </div>
  );
}
