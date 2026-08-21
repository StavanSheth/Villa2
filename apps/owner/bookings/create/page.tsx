'use client';

import React from 'react';
import { BookingWizard } from '@villa-platform/ui/booking';

/**
 * Owner Create Booking Page
 * Uses the same BookingWizard as the customer app, but in OWNER mode.
 * The wizard automatically:
 * - Shows the Booking Type selector step
 * - Shows internal notes and reason fields
 * - Shows the payment toggle for applicable types
 * - Hides payment step for owner stays, maintenance, blocked dates
 * - Auto-confirms bookings where rules dictate
 */
export default function OwnerCreateBookingPage() {
  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-[var(--text-dark)]">Create Booking</h1>
          <p className="text-[var(--text-sec-dark)] mt-1">
            Create a reservation — owner stay, guest booking, maintenance block, or more.
          </p>
        </div>
      </div>

      <div className="mt-8">
        <BookingWizard
          mode="OWNER"
          // ponytail: villaId will come from owner context/session in production
          // villaId={ownerVillaId}
          onComplete={(booking) => {
            console.log('Owner booking created:', booking);
          }}
        />
      </div>
    </div>
  );
}
