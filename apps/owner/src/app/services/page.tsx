import React from 'react';
import { prisma } from '@villa-platform/database';
import { ServiceManager } from './ServiceManager';

import { redirect } from 'next/navigation';
import { requireAuth } from '../../lib/auth';

export default async function ServicesPage() {
  const auth = await requireAuth();
  if (!auth) redirect('/login');

  const services = await prisma.serviceDef.findMany({
    orderBy: { category: 'asc' },
  });

  const formattedServices = services.map(svc => ({
    ...svc,
    price: Number(svc.price)
  }));

  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-6xl mx-auto">
      <ServiceManager initialServices={formattedServices} />
    </div>
  );
}
