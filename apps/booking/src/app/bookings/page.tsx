import React from 'react';
import { prisma } from '@villa-platform/database';
import { CustomerBookingActions } from './CustomerBookingActions';
import { formatBookingSegments } from '@villa-platform/ui/booking';

export default async function CustomerBookingsPage() {
  const bookings = await prisma.booking.findMany({
    include: { villa: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6 p-8 bg-[#111111] min-h-screen text-white">
      <h1 className="text-2xl font-serif text-[#D4AF37]">My Bookings</h1>
      
      {bookings.length === 0 ? (
        <div className="p-8 text-center border border-white/10 rounded-xl bg-black/60 text-white/50">
          You have no bookings yet.
        </div>
      ) : (
        <div className="space-y-6">
          {bookings.map((booking) => (
            <div key={booking.id} className="flex flex-col md:flex-row border border-white/10 rounded-xl overflow-hidden bg-black/60 shadow-sm transition hover:border-[#D4AF37]/30">
              <div className="w-full md:w-48 h-48 md:h-auto bg-white/5 flex-shrink-0">
                <img 
                  src="https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=800&q=80" 
                  alt={booking.villa.name} 
                  className="w-full h-full object-cover opacity-80"
                />
              </div>

              <div className="p-5 flex-1 flex flex-col justify-between">
                <div>
                  <div className="flex justify-between items-start mb-2">
                    <h3 className="text-xl font-bold text-white">{booking.villa.name}</h3>
                    <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                      booking.status === 'CONFIRMED' ? 'bg-green-500/20 text-green-400' :
                      booking.status === 'CANCELLED' ? 'bg-red-500/20 text-red-400' :
                      'bg-blue-500/20 text-blue-400'
                    }`}>
                      {booking.status}
                    </span>
                  </div>
                  <p className="text-sm text-white/50 mb-1 font-mono">ID: {booking.bookingCode}</p>
                  <p className="text-sm text-white/70 font-medium mb-1">
                    Dates: {formatBookingSegments(booking.nightlyBreakdown, booking.checkIn as any, booking.checkOut as any)}
                  </p>
                  <p className="text-sm text-white/70 font-medium mb-4">Guests: {booking.totalGuests}</p>
                </div>

                <CustomerBookingActions bookingCode={booking.bookingCode} status={booking.status} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
