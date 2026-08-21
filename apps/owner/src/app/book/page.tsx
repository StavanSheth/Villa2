import React from 'react';
import { BookingWizard } from '@villa-platform/ui/booking';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function OwnerBookVillaPage() {
  return (
    <div className="space-y-8 animate-fade-in pb-20 p-4 md:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <Link href="/" className="text-[#D4AF37] hover:underline flex items-center gap-2 mb-6 text-sm">
          <ArrowLeft size={16} /> Back to Dashboard
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-serif text-white">Reserve Your Stay / Create Booking</h1>
            <p className="text-white/60 mt-1">Select dates, customize your experience, and finalize your booking.</p>
          </div>
        </div>

        <div className="bg-black/40 border border-white/10 rounded-3xl p-6 md:p-12 shadow-2xl">
          <BookingWizard mode="OWNER" />
        </div>
      </div>
    </div>
  );
}
