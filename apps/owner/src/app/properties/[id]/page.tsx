import React from 'react';
import { prisma } from '@villa-platform/database';
import { PropertyForm } from '../../../components/PropertyForm';
import { requireAuth } from '../../../lib/auth';
import { redirect } from 'next/navigation';

export default async function EditPropertyPage(props: { params: Promise<{ id: string }> }) {
  const auth = await requireAuth();
  if (!auth) redirect('/login');

  const { id } = await props.params;

  const villa = await prisma.villa.findUnique({
    where: { id }
  });

  if (!villa) {
    redirect('/properties');
  }

  // Ensure owner authorization (Super Admins can edit anything)
  if (auth.role !== 'SUPER_ADMIN' && villa.ownerId !== null && villa.ownerId !== auth.userId) {
    redirect('/properties');
  }

  // Serialize Decimal to string and handle Date objects to pass to Client Component safely
  const serializedVilla = JSON.parse(JSON.stringify({
    ...villa,
    basePrice: villa.basePrice.toString()
  }));

  return (
    <div className="pt-8">
      <PropertyForm initialData={serializedVilla} isEdit={true} />
    </div>
  );
}
