'use client';

import React, { useState } from 'react';
import { BookingCard } from '@villa-platform/ui';
import { formatBookingSegments } from '@villa-platform/ui/booking';

export function UpcomingCheckIns({ initialBookings }: { initialBookings: any[] }) {
  const [paymentFilter, setPaymentFilter] = useState<string>('ALL');
  const [typeFilter, setTypeFilter] = useState<string>('ALL');

  const filteredBookings = initialBookings.filter(b => {
    // Payment filter
    if (paymentFilter !== 'ALL') {
      if (paymentFilter === 'PAID' && b.status !== 'FULLY_PAID' && b.status !== 'ADVANCE_PAID' && b.status !== 'CONFIRMED') return false;
      if (paymentFilter === 'PENDING' && b.status !== 'AWAITING_PAYMENT') return false;
    }
    
    // Type filter
    if (typeFilter !== 'ALL') {
      if (b.bookingType !== typeFilter) return false;
    }

    return true;
  });

  return (
    <div className="space-y-4">
      <div className="flex gap-3 mb-4">
        <select 
          className="bg-white/5 border border-white/20 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-[#D4AF37] transition"
          value={paymentFilter}
          onChange={e => setPaymentFilter(e.target.value)}
        >
          <option value="ALL" className="bg-zinc-800">All Payments</option>
          <option value="PAID" className="bg-zinc-800">Paid/Confirmed</option>
          <option value="PENDING" className="bg-zinc-800">Awaiting Payment</option>
        </select>
        
        <select 
          className="bg-white/5 border border-white/20 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-[#D4AF37] transition"
          value={typeFilter}
          onChange={e => setTypeFilter(e.target.value)}
        >
          <option value="ALL" className="bg-zinc-800">All Types</option>
          <option value="NORMAL" className="bg-zinc-800">Normal</option>
          <option value="OWNER" className="bg-zinc-800">Owner Stay</option>
          <option value="VIP" className="bg-zinc-800">VIP</option>
          <option value="CORPORATE" className="bg-zinc-800">Corporate</option>
        </select>
      </div>

      {filteredBookings.length > 0 ? (
        <div className="space-y-4 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {filteredBookings.map(booking => {
            const bFormatted = {
              id: booking.bookingCode,
              villaName: booking.villa.name,
              location: "Lonavala, Maharashtra",
              imageUrl: "http://localhost:3000/photos/day/Hero%20page.jpeg",
              dates: formatBookingSegments(booking.nightlyBreakdown, booking.checkIn as any, booking.checkOut as any),
              guests: booking.totalGuests,
              paymentStatus: booking.status,
            };
            return <BookingCard key={booking.id} booking={bFormatted as any} />
          })}
        </div>
      ) : (
        <div className="bg-white/5 border border-white/10 p-6 rounded-2xl text-center text-white/50">
          No check-ins match these filters.
        </div>
      )}
    </div>
  );
}
