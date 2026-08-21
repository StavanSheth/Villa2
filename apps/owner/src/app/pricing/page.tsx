import React from 'react';
import { prisma } from '@villa-platform/database';
import { PricingManager } from './PricingManager';

import { redirect } from 'next/navigation';
import { requireAuth } from '../../lib/auth';

export default async function PricingPage() {
  const auth = await requireAuth();
  if (!auth) redirect('/login');

  const rules = await prisma.pricingRule.findMany({
    where: auth.role === 'SUPER_ADMIN' ? {} : {
      villa: {
        OR: [
          { ownerId: auth.userId },
          { ownerId: null }
        ]
      }
    },
    include: { villa: true },
    orderBy: { type: 'asc' },
  });

  const villas = await prisma.villa.findMany({
    where: auth.role === 'SUPER_ADMIN' ? {} : {
      OR: [
        { ownerId: auth.userId },
        { ownerId: null }
      ]
    },
  });

  const formattedRules = rules.map(rule => ({
    ...rule,
    price: Number(rule.price),
    villa: {
      ...rule.villa,
      basePrice: Number(rule.villa.basePrice)
    }
  }));

  const formattedVillas = villas.map(villa => ({
    ...villa,
    basePrice: Number(villa.basePrice)
  }));

  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-6xl mx-auto">
      <PricingManager initialRules={formattedRules} villas={formattedVillas} />
    </div>
  );
}
