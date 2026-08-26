import React from 'react';
import { BookingWizard } from '@villa-platform/ui/booking';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function OwnerBookVillaPage() {
  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <Link href="/" className="text-primary hover:underline flex items-center gap-2 mb-2 text-sm">
        <ArrowLeft size={16} /> Back to Dashboard
      </Link>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-foreground">Reserve Your Stay / Create Booking</h1>
          <p className="text-muted-foreground mt-1">Select dates, customize your experience, and finalize your booking.</p>
        </div>
      </div>

      <div className="mt-8">
        <BookingWizard mode="OWNER" />
      </div>
    </div>
  );
}
