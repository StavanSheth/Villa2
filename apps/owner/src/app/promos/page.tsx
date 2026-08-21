// apps/owner/src/app/promos/page.tsx
// Owner Promo Codes page — reads PromoCode records from the same DB

import React from 'react';
import { prisma } from '@villa-platform/database';
import { PromoManager } from './PromoManager';

import { redirect } from 'next/navigation';
import { requireAuth } from '../../lib/auth';

export default async function PromoCodesPage() {
  const auth = await requireAuth();
  if (!auth) redirect('/login');

  const rawPromos = await prisma.promoCode.findMany({
    orderBy: { code: 'asc' },
  });

  const promos = rawPromos.map(promo => ({
    ...promo,
    value: promo.value ? Number(promo.value) : promo.value,
    minBookingAmt: promo.minBookingAmt ? Number(promo.minBookingAmt) : promo.minBookingAmt,
    maxDiscount: promo.maxDiscount ? Number(promo.maxDiscount) : promo.maxDiscount,
  }));

  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-6xl mx-auto">
      <PromoManager initialPromos={promos} />
    </div>
  );
}
