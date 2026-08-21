import React from 'react';
import { prisma } from '@villa-platform/database';
import { FileText, Calendar, CreditCard } from 'lucide-react';
import Link from 'next/link';

export default async function InvoicesPage() {
  const bookings = await prisma.booking.findMany({
    where: { status: { not: 'CANCELLED' } },
    include: { villa: true },
    orderBy: { createdAt: 'desc' }
  });

  return (
    <div className="space-y-6 p-4 md:p-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-serif text-white">My Invoices</h1>
          <p className="text-sm text-white/50 mt-1">View and download invoices for your bookings</p>
        </div>
        <div className="flex items-center gap-2 text-xs text-white/40">
          <FileText size={14} />
          <span>{bookings.length} invoices</span>
        </div>
      </div>

      <div className="space-y-4">
        {bookings.length === 0 && (
          <div className="p-8 text-center border border-white/10 rounded-xl bg-black/60 text-white/50">
            No invoices available.
          </div>
        )}
        {bookings.map((booking) => {
          const isPaid = Number(booking.totalPaid) >= Number(booking.currentTotal);
          const status = isPaid ? 'PAID' : 'PENDING';
          const dueDate = new Date(booking.checkIn);
          dueDate.setDate(dueDate.getDate() - 2); // Due 2 days before check-in

          return (
            <div key={booking.id} className="liquid-glass rounded-2xl overflow-hidden">
              <div className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-xl bg-[#D4AF37]/10 text-[#D4AF37]">
                    <FileText size={22} />
                  </div>
                  <div>
                    <div className="flex items-center gap-3 mb-1">
                      <h2 className="text-lg font-medium text-white">INV-{booking.bookingCode}</h2>
                      <span className={`text-[10px] font-bold uppercase px-2.5 py-0.5 rounded-full border ${
                        status === 'PAID' ? 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' :
                        'bg-amber-500/15 text-amber-400 border-amber-500/30'
                      }`}>
                        {status}
                      </span>
                    </div>
                    <p className="text-sm text-white/50">{booking.villa.name}</p>
                    <div className="flex items-center gap-4 mt-2 text-xs text-white/40">
                      <span className="flex items-center gap-1"><Calendar size={12} /> {new Date(booking.createdAt).toLocaleDateString()}</span>
                      <span className="flex items-center gap-1"><CreditCard size={12} /> Booking: {booking.bookingCode}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-6">
                  <div className="text-right">
                    <p className="text-xl font-mono font-semibold text-white">₹{Number(booking.currentTotal).toLocaleString()}</p>
                    <p className="text-[10px] text-white/30 uppercase tracking-wider">
                      {status === 'PAID' ? 'Amount Paid' : `Due: ${dueDate.toLocaleDateString()}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Link
                      href={`/invoices/${booking.bookingCode}/print`}
                      target="_blank"
                      className="px-4 py-2 border border-[#D4AF37] text-[#D4AF37] hover:bg-[#D4AF37]/10 rounded-lg transition text-sm font-medium"
                    >
                      Download PDF
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
