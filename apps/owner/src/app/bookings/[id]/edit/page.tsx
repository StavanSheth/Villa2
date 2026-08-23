import React from 'react';
import { prisma } from '@villa-platform/database';
import { BookingWizard } from '@villa-platform/ui/booking';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default async function OwnerEditBookingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const booking = await prisma.booking.findFirst({
    where: {
      OR: [
        { bookingCode: id },
        { id: id }
      ]
    },
    include: {
      promoCode: true,
      guestIdProofs: true
    }
  });

  if (!booking) {
    return <div className="p-20 text-center text-white">Booking not found for code: {id}</div>;
  }

  const events = await prisma.bookingEvent.findMany({
    where: { bookingId: booking.id, action: 'EDIT_BOOKING' },
    orderBy: { createdAt: 'desc' },
  });

  const txs = await prisma.paymentTransaction.findMany({
    where: { bookingId: booking.id, status: { in: ['SUCCESS', 'CAPTURED'] } }
  });
  const actualPaidAmount = txs.reduce((sum, tx) => sum + Number(tx.amount), 0);
  
  // If the passbook seed data was used, it might not have created PaymentTransactions.
  // In that case, rely on the DB paidAmount, or if that is 0, rely on the events metadata.
  let finalPaidAmount = Number(booking.totalPaid) > 0 ? Number(booking.totalPaid) : actualPaidAmount;
  
  if (finalPaidAmount === 0 && booking.bookingCode.startsWith('PB-SCENARIO')) {
     const createEvent = await prisma.bookingEvent.findFirst({
        where: { bookingId: booking.id, action: 'CREATE' }
     });
     if (createEvent && (createEvent.metadata as any)?.paidAmount) {
         finalPaidAmount = Number((createEvent.metadata as any).paidAmount);
     }
  }

  // Hardcode fallback for the user's specific case in screenshots if needed, but the DB update handles it.
  
  const editBookingData = JSON.parse(JSON.stringify(booking));
  editBookingData.paidAmount = finalPaidAmount;

  return (
    <div className="bg-[#111111] min-h-screen">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <Link href={`/bookings/${id}`} className="text-[#D4AF37] hover:underline flex items-center gap-2 mb-6 text-sm">
          <ArrowLeft size={16} /> Back to Booking Details
        </Link>
        <h1 className="text-3xl font-serif text-white mb-8">Owner Edit Reservation: {booking.bookingCode}</h1>
        
        {events.length > 0 && (
          <div className="mb-8 bg-black/40 border border-white/10 rounded-3xl p-6 shadow-2xl">
            <h2 className="text-xl font-bold text-white mb-4">Order Edit History</h2>
            <div className="space-y-4">
              {events.map((event) => {
                const meta = event.metadata as any;
                return (
                  <div key={event.id} className="border border-white/5 bg-white/5 rounded-xl p-4 text-sm text-white/80">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-semibold text-gold">Edit on {new Date(event.createdAt).toLocaleString()}</span>
                      <span className="text-xs text-white/40">By {event.actorRole}</span>
                    </div>
                    {meta?.refundAmount ? (
                      <div className="text-green-400 mt-2">
                        Refunded: ₹{meta.refundAmount.toLocaleString()} (Added to Wallet)
                      </div>
                    ) : meta?.additionalPayment ? (
                      <div className="text-yellow-400 mt-2">
                        Additional Payment Required: ₹{meta.additionalPayment.toLocaleString()}
                      </div>
                    ) : (
                      <div className="text-white/60 mt-2">Booking dates or services were updated.</div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="bg-black/40 border border-white/10 rounded-3xl p-6 md:p-12 shadow-2xl">
          <BookingWizard 
            mode="OWNER" 
            villaId={booking.villaId}
            editBookingData={editBookingData}
          />
        </div>
      </div>
    </div>
  );
}
