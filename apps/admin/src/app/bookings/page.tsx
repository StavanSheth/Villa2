// apps/admin/src/app/bookings/page.tsx
// Admin Bookings — reads from the SAME database as Customer and Owner dashboards.

import React from 'react';
import { CalendarDays, Eye, Users, IndianRupee } from 'lucide-react';
import { prisma } from '@villa-platform/database';

export default async function AdminBookingsPage() {
  const bookings = await prisma.booking.findMany({
    include: {
      user: true,
      villa: true,
      events: { orderBy: { createdAt: 'desc' }, take: 1 },
    },
    orderBy: { createdAt: 'desc' },
  });

  const statusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': case 'FULLY_PAID': return 'bg-green-500/10 text-green-400 border-green-500/20';
      case 'ADVANCE_PAID': return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
      case 'CANCELLED': return 'bg-red-500/10 text-red-400 border-red-500/20';
      case 'CHECKED_IN': case 'UPCOMING': return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
      default: return 'bg-white/10 text-white/60 border-white/10';
    }
  };

  return (
    <div className="animate-fade-in space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-serif text-white">All Bookings</h1>
          <p className="text-sm text-white/50 mt-1">Platform-wide view of all reservations across all villas.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-white/50">Total:</span>
          <span className="font-mono font-bold text-gold">{bookings.length}</span>
        </div>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="card">
          <div className="text-green-400 mb-2"><CalendarDays className="w-5 h-5" /></div>
          <p className="text-xl font-semibold text-white">{bookings.filter(b => b.status === 'CONFIRMED' || b.status === 'FULLY_PAID').length}</p>
          <p className="text-xs text-white/50 mt-1">Confirmed</p>
        </div>
        <div className="card">
          <div className="text-blue-400 mb-2"><IndianRupee className="w-5 h-5" /></div>
          <p className="text-xl font-semibold text-white">₹{bookings.reduce((s, b) => s + Number(b.currentTotal), 0).toLocaleString()}</p>
          <p className="text-xs text-white/50 mt-1">Total Revenue</p>
        </div>
        <div className="card">
          <div className="text-yellow-400 mb-2"><IndianRupee className="w-5 h-5" /></div>
          <p className="text-xl font-semibold text-white">₹{bookings.reduce((s, b) => s + (Number(b.currentTotal) - Number(b.totalPaid)), 0).toLocaleString()}</p>
          <p className="text-xs text-white/50 mt-1">Outstanding Balance</p>
        </div>
        <div className="card">
          <div className="text-red-400 mb-2"><CalendarDays className="w-5 h-5" /></div>
          <p className="text-xl font-semibold text-white">{bookings.filter(b => b.status === 'CANCELLED').length}</p>
          <p className="text-xs text-white/50 mt-1">Cancelled</p>
        </div>
      </div>

      {/* Table */}
      <div className="card overflow-hidden !p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[900px]">
            <thead>
              <tr className="border-b border-white/10 bg-white/5">
                <th className="p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Booking Code</th>
                <th className="p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Customer</th>
                <th className="p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Villa</th>
                <th className="p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Dates</th>
                <th className="p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Amount</th>
                <th className="p-4 text-xs font-semibold text-white/50 uppercase tracking-wider">Status</th>
                <th className="p-4 text-xs font-semibold text-white/50 uppercase tracking-wider text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {bookings.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-white/40">No bookings in the system.</td>
                </tr>
              )}
              {bookings.map(booking => (
                <tr key={booking.id} className="hover:bg-white/5 transition-colors group">
                  <td className="p-4">
                    <span className="font-mono font-bold text-white bg-white/10 px-2 py-1 rounded">{booking.bookingCode}</span>
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-white font-medium">{booking.user.firstName} {booking.user.lastName}</div>
                    <div className="text-xs text-white/40">{booking.user.email}</div>
                  </td>
                  <td className="p-4 text-sm text-white/70">{booking.villa.name}</td>
                  <td className="p-4 text-sm text-white/70">
                    {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}
                  </td>
                  <td className="p-4">
                    <div className="text-sm text-white font-medium">₹{Number(booking.currentTotal).toLocaleString()}</div>
                    <div className="text-xs text-white/40">Paid: ₹{Number(booking.totalPaid).toLocaleString()}</div>
                  </td>
                  <td className="p-4">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${statusColor(booking.status)}`}>
                      {booking.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <button className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-white/40 hover:text-[#D4AF37] hover:bg-[#D4AF37]/10 transition text-sm">
                      <Eye className="w-4 h-4" /> View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
