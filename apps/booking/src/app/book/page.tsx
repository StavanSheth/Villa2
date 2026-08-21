import React from 'react';
import { BookingWizard } from '@villa-platform/ui/booking';

export default function BookVillaPage() {
  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-[var(--text-dark)]">Reserve Your Stay</h1>
          <p className="text-[var(--text-sec-dark)] mt-1">Select dates, customize your experience, and finalize your booking.</p>
        </div>
      </div>

      <div className="mt-8">
        <BookingWizard />
      </div>
    </div>
  );
}
