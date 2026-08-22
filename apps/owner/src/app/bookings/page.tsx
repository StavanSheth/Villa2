import React from 'react';
export const dynamic = 'force-dynamic';
import { prisma } from '@villa-platform/database';
import { CalendarDays, Edit } from 'lucide-react';
import Link from 'next/link';

import { redirect } from 'next/navigation';
import { requireAuth } from '../../lib/auth';

import { BookingFilters } from './BookingFilters';

export default async function OwnerBookingsPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const auth = await requireAuth();
  if (!auth) redirect('/login'); 

  const params = await searchParams;
  const statusFilter = typeof params.status === 'string' ? params.status : undefined;
  const paymentTypeFilter = typeof params.paymentType === 'string' ? params.paymentType : undefined;
  const dateStart = typeof params.dateStart === 'string' ? params.dateStart : undefined;
  const dateEnd = typeof params.dateEnd === 'string' ? params.dateEnd : undefined;

  const whereClause: any = {};
  
  if (statusFilter) {
    whereClause.status = statusFilter;
  }
  
  if (dateStart || dateEnd) {
    whereClause.checkIn = {};
    if (dateStart) whereClause.checkIn.gte = new Date(dateStart).toISOString();
    if (dateEnd) whereClause.checkIn.lte = new Date(dateEnd).toISOString();
  }

  if (paymentTypeFilter) {
    whereClause.orderTransactions = {
      some: { paymentType: { contains: paymentTypeFilter } }
    };
  }

  const bookings = await prisma.booking.findMany({
    where: whereClause,
    include: { user: true, villa: true, events: true, orderTransactions: { orderBy: { srNo: 'desc' }, take: 1 } },
    orderBy: { createdAt: 'desc' }
  });

  // Calculate totals
  const totalFilteredPaid = bookings.reduce((sum, b) => sum + (Number(b.totalPaid) || 0), 0);
  const totalFilteredFinalAmount = bookings.reduce((sum, b) => sum + (Number(b.currentTotal) || 0), 0);
  const totalFilteredRefund = bookings.reduce((sum, b) => sum + (Number((b as any).pendingRefund) || 0), 0);

  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-6xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-[var(--text-dark)]">All Bookings</h1>
          <p className="text-[var(--text-sec-dark)] mt-1">Manage and view all customer reservations.</p>
        </div>
      </div>

      <div className="liquid-glass rounded-2xl overflow-hidden mt-8">
        <div className="p-6 border-b border-white/10 bg-white/5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <CalendarDays className="w-5 h-5 text-gold" />
            <h2 className="text-lg font-medium text-[var(--text-dark)]">Master Ledger</h2>
          </div>
        </div>
        
        <div className="px-6 pt-6">
          <BookingFilters />
        </div>
        
        <div className="overflow-x-auto pb-4">
          <table className="w-full text-left border-collapse min-w-[1000px]">
          <thead>
            <tr className="border-b border-white/10">
              <th className="p-4 text-xs font-semibold text-[var(--text-sec-dark)] uppercase tracking-wider">Booking Code</th>
              <th className="p-4 text-xs font-semibold text-[var(--text-sec-dark)] uppercase tracking-wider">Dates</th>
              <th className="p-4 text-xs font-semibold text-[var(--text-sec-dark)] uppercase tracking-wider">Total Paid</th>
              <th className="p-4 text-xs font-semibold text-[var(--text-sec-dark)] uppercase tracking-wider">Final Amount</th>
              <th className="p-4 text-xs font-semibold text-[var(--text-sec-dark)] uppercase tracking-wider">Refund</th>
              <th className="p-4 text-xs font-semibold text-[var(--text-sec-dark)] uppercase tracking-wider">Status</th>
              <th className="p-4 text-xs font-semibold text-[var(--text-sec-dark)] uppercase tracking-wider text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {bookings.length === 0 && (
              <tr>
                <td colSpan={7} className="p-8 text-center text-[var(--text-sec-dark)]">No bookings found in the database.</td>
              </tr>
            )}
            {bookings.map(booking => {
              const latestTx = booking.orderTransactions && booking.orderTransactions[0];
              const pendingRefundAmount = Number(booking.pendingRefund) || 0;
              
              let datesStr = `${new Date(booking.checkIn).toLocaleDateString()} - ${new Date(booking.checkOut).toLocaleDateString()}`;
              if (latestTx && latestTx.snapshotStaySegments && Array.isArray(latestTx.snapshotStaySegments) && latestTx.snapshotStaySegments.length > 0) {
                datesStr = latestTx.snapshotStaySegments.map((seg: any) => {
                  return `${new Date(seg.checkIn).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })} - ${new Date(seg.checkOut).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}`;
                }).join(', ');
              }

              return (
              <tr key={booking.id} className="hover:bg-white/5 transition-colors group">
                <td className="p-4">
                  <div className="font-mono font-bold text-[var(--text-dark)] bg-white/10 px-2 py-1 rounded inline-block">{booking.bookingCode}</div>
                </td>
                <td className="p-4 text-sm text-[var(--text-dark)] font-medium">
                  {datesStr}
                </td>
                <td className="p-4 text-sm text-[var(--text-dark)]">
                  ₹{Number(booking.totalPaid).toLocaleString()}
                </td>
                <td className="p-4 text-sm text-[var(--text-dark)] font-medium">
                  ₹{Number(booking.currentTotal).toLocaleString()}
                </td>
                <td className="p-4 text-sm text-[var(--text-sec-dark)]">
                  {pendingRefundAmount > 0 ? (
                    <span className="text-red-400 font-medium">₹{pendingRefundAmount.toLocaleString()}</span>
                  ) : (
                    <span className="text-white/30">-</span>
                  )}
                </td>
                <td className="p-4">
                  {(() => {
                    let colorClass = "bg-gray-500/10 text-gray-400 border-gray-500/20";
                    if (booking.status === 'CONFIRMED') colorClass = "bg-green-500/10 text-green-400 border-green-500/20";
                    else if (booking.status === 'ADVANCE_PAID') colorClass = "bg-blue-500/10 text-blue-400 border-blue-500/20";
                    else if (booking.status === 'CANCELLED') colorClass = "bg-red-500/10 text-red-400 border-red-500/20";
                    else if (booking.status === 'PARTIALLY_CANCELLED') colorClass = "bg-orange-500/10 text-orange-400 border-orange-500/20";
                    else if (booking.status === 'REFUNDED') colorClass = "bg-gray-500/10 text-gray-400 border-gray-500/20";
                    
                    return (
                      <span className={`px-2.5 py-1 rounded-full text-xs font-medium border ${colorClass}`}>
                        {booking.status}
                      </span>
                    );
                  })()}
                </td>
                <td className="p-4 text-right">
                  <Link href={`/bookings/${booking.bookingCode}`} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-md text-[var(--text-sec-dark)] hover:text-gold hover:bg-gold/10 transition">
                    <Edit className="w-4 h-4" /> Manage
                  </Link>
                </td>
              </tr>
            )})}
            {bookings.length > 0 && (
              <tr className="bg-white/5 border-t border-white/20">
                <td colSpan={2} className="p-4 text-right font-bold text-[var(--text-sec-dark)] uppercase tracking-widest text-xs">
                  Totals
                </td>
                <td className="p-4 text-sm font-bold text-[var(--text-dark)]">
                  ₹{totalFilteredPaid.toLocaleString()}
                </td>
                <td className="p-4 text-sm font-bold text-[var(--text-dark)]">
                  ₹{totalFilteredFinalAmount.toLocaleString()}
                </td>
                <td className="p-4 text-sm font-bold text-red-400">
                  {totalFilteredRefund > 0 ? `₹${totalFilteredRefund.toLocaleString()}` : '-'}
                </td>
                <td colSpan={2} className="p-4"></td>
              </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>
    </div>
  );
}
