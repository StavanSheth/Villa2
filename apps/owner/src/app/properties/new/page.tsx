import React from 'react';
import { PropertyForm } from '../../../components/PropertyForm';
import { requireAuth } from '../../../lib/auth';
import { redirect } from 'next/navigation';

export default async function NewPropertyPage() {
  const auth = await requireAuth();
  if (!auth) redirect('/login');

  return (
    <div className="pt-8">
      <PropertyForm />
    </div>
  );
}
