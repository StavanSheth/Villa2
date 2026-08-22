import React from 'react';
import { prisma } from '@villa-platform/database';
import { calculateLedgerTotals, formatCurrency } from '@villa-platform/database';
import Link from 'next/link';

import { Edit3, Activity } from 'lucide-react';
import { formatBookingSegments } from '@villa-platform/ui/booking';

export default async function CustomerBookingDetailsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  
  const booking = await prisma.booking.findFirst({
    where: {
      OR: [
        { bookingCode: id },
        { id: id }
      ]
    },
    include: {
      villa: true,
      services: true,
      promoCode: true,
      events: {
        orderBy: { createdAt: 'desc' }
      },
      orderTransactions: {
        orderBy: { srNo: 'asc' }
      }
    }
  });

  const serviceDefs = await prisma.serviceDef.findMany();
  const serviceMap = Object.fromEntries(serviceDefs.map(s => [s.id, s.name]));

  if (!booking) {
    return <div className="p-20 text-center text-white">Booking not found for code: {id}</div>;
  }

  const isCancelled = booking.status === 'CANCELLED';

  return (
    <div className="space-y-6 p-8 bg-[#111111] min-h-screen text-white animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <Link href="/bookings" className="text-[#D4AF37] hover:underline text-sm mb-4 inline-block">&larr; Back to My Bookings</Link>
          <h1 className="text-3xl font-serif text-white">Booking Details</h1>
          <p className="text-white/50 font-mono mt-1">ID: {booking.bookingCode}</p>
        </div>
        <div className="flex items-center gap-3">
          {!isCancelled && (
            <Link 
              href={`/bookings/${booking.bookingCode}/edit`}
              className="px-4 py-2 border border-gold/30 bg-gold/10 text-gold hover:bg-gold/20 rounded-lg text-sm font-bold flex items-center gap-2 transition"
            >
              <Edit3 size={16} /> Edit Reservation
            </Link>
          )}
          <span className={`px-4 py-2 font-bold rounded-lg ${
            booking.status === 'CONFIRMED' ? 'bg-green-500/20 text-green-400' :
            isCancelled ? 'bg-red-500/20 text-red-400' :
            'bg-blue-500/20 text-blue-400'
          }`}>
            {booking.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-8">
        <div className="lg:col-span-2 space-y-6">
          <div className="border border-white/10 bg-black/60 rounded-xl p-6">
            <h2 className="text-xl font-bold text-[#D4AF37] mb-4">Stay Information</h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-xs text-white/50 uppercase block mb-1">Villa</label>
                <div className="font-medium text-white">{booking.villa.name}</div>
              </div>
              <div>
                <label className="text-xs text-white/50 uppercase block mb-1">Guests</label>
                <div className="font-medium text-white">{booking.totalGuests}</div>
              </div>
              <div className="col-span-2">
                <label className="text-xs text-white/50 uppercase block mb-1">Stay Dates</label>
                <div className="font-medium text-white">
                  {formatBookingSegments(booking.nightlyBreakdown, booking.checkIn as any, booking.checkOut as any)}
                </div>
              </div>
            </div>
          </div>
          
          {booking.services.length > 0 && (
            <div className="border border-white/10 bg-black/60 rounded-xl p-6">
              <h2 className="text-xl font-bold text-[#D4AF37] mb-4">Added Services</h2>
              <div className="space-y-3">
                {booking.services.map(svc => (
                  <div key={svc.id} className="flex justify-between items-center p-3 rounded-lg bg-white/5 border border-white/10">
                    <div>
                      <div className="font-medium text-white">{svc.name}</div>
                      <div className="text-xs text-white/50">Qty: {svc.quantity}</div>
                    </div>
                    <div className="font-bold text-white">₹{Number(svc.totalPrice).toLocaleString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border border-white/10 bg-black/60 rounded-xl p-6 overflow-hidden">
            <h2 className="text-xl font-bold text-[#D4AF37] mb-4 flex items-center gap-2">
              <Activity size={20} /> Booking Ledger & Edit Logs
            </h2>
              <div className="overflow-x-auto pb-2">
                <table className="w-full text-left border-collapse min-w-[1200px]">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="p-3 text-xs font-semibold text-white/50 uppercase tracking-wider">Edit Time</th>
                      <th className="p-3 text-xs font-semibold text-white/50 uppercase tracking-wider">Action & Role</th>
                      <th className="p-3 text-xs font-semibold text-white/50 uppercase tracking-wider">State Change</th>
                      <th className="p-3 text-xs font-semibold text-white/50 uppercase tracking-wider">Check In/Out</th>
                      <th className="p-3 text-xs font-semibold text-white/50 uppercase tracking-wider">Guests</th>
                      <th className="p-3 text-xs font-semibold text-white/50 uppercase tracking-wider">Payment Type</th>
                      <th className="p-3 text-xs font-semibold text-white/50 uppercase tracking-wider">Refund Tier</th>
                      <th className="p-3 text-xs font-semibold text-white/50 uppercase tracking-wider">Refund Status</th>
                      <th className="p-3 text-xs font-semibold text-white/50 uppercase tracking-wider whitespace-nowrap">Action Amount</th>
                      <th className="p-3 text-xs font-semibold text-white/50 uppercase tracking-wider min-w-[200px]">Services</th>
                      <th className="p-3 text-xs font-semibold text-white/50 uppercase tracking-wider text-right">Balance</th>
                      <th className="p-3 text-xs font-semibold text-white/50 uppercase tracking-wider text-right">Total Paid</th>
                      <th className="p-3 text-xs font-semibold text-white/50 uppercase tracking-wider text-right">Remaining Amount</th>
                      <th className="p-3 text-xs font-semibold text-white/50 uppercase tracking-wider text-right">Refund Amount</th>
                      <th className="p-3 text-xs font-semibold text-white/50 uppercase tracking-wider text-right">Refund Paid</th>
                      <th className="p-3 text-xs font-semibold text-white/50 uppercase tracking-wider text-right">Amount To Be Paid</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {(() => {
                      const formatDateStr = (d: any) => {
                        const dt = new Date(d);
                        return `${dt.getDate()} ${dt.toLocaleString('default', { month: 'short' })} ${dt.getFullYear()}, ${dt.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' }).toLowerCase()}`;
                      };

                      const formatShortDate = (dateString: string) => {
                        const dt = new Date(dateString);
                        return `${dt.toLocaleString('default', { month: 'short' })} ${dt.getDate().toString().padStart(2, '0')}`;
                      };
                      
                      const renderStaySegments = (segments: any) => {
                        if (!segments || !Array.isArray(segments) || segments.length === 0) return '-';
                        return segments.map((seg: any, i: number) => (
                          <div key={i} className="mb-2 whitespace-pre-wrap">
                            <span className="font-medium text-white">{formatShortDate(seg.checkIn)}</span>–<span className="font-medium text-white">{formatShortDate(seg.checkOut)}</span>
                          </div>
                        ));
                      };

                      const renderGuests = (guests: any) => {
                        if (!guests || typeof guests !== 'object' || Object.keys(guests).length === 0) return '-';
                        return Object.entries(guests).map(([date, counts]: [string, any], i) => (
                          <div key={i} className="mb-2 whitespace-pre-wrap">
                            <span className="font-medium text-white">{formatShortDate(date)}:</span> {counts.adults}A, {counts.children}C
                          </div>
                        ));
                      };

                      const renderServices = (services: any) => {
                        if (!services || typeof services !== 'object' || Object.keys(services).length === 0) return '-';
                        return Object.entries(services).map(([date, svcs]: [string, any], i) => (
                          <div key={i} className="mb-2 whitespace-pre-wrap">
                            <span className="font-medium text-white">{formatShortDate(date)}:</span>
                            {Array.isArray(svcs) ? svcs.map((svc: string, j: number) => <div key={j} className="ml-2">{svc}</div>) : '-'}
                          </div>
                        ));
                      };

                      const renderAmt = (val: number) => {
                        return <div className="whitespace-nowrap">{formatCurrency(val)}</div>;
                      };

                      return (
                        <>
                          {(booking as any).orderTransactions.map((tx: any, idx: number) => {
                            // Match action amount logic
                            let actionAmountStr = '₹0';
                            const correspondingEvent = booking.events?.find((e: any) => 
                              e.action === tx.actionType && new Date(e.createdAt).getTime() === new Date(tx.transactionTime).getTime()
                            );

                            if ((correspondingEvent?.metadata as any)?.actionAmountStr) {
                              actionAmountStr = (correspondingEvent?.metadata as any).actionAmountStr;
                            } else if (tx.actionType === 'BOOKING_CREATED' || tx.actionType === 'CREATE') {
                              actionAmountStr = `₹${Number(tx.newOrderTotal).toLocaleString()}`;
                            } else if (tx.actionType === 'ADVANCE_PAYMENT' || tx.actionType === 'PAYMENT' || tx.actionType === 'REFUND_PROCESSED_MANUAL' || tx.actionType === 'REFUND') {
                              const amt = Number(tx.advancePaymentDelta) + Number(tx.balancePaymentDelta) + Math.abs(Number(tx.refundPaidDelta) || 0) + Math.abs(Number(tx.refundDueDelta) || 0);
                              actionAmountStr = `₹${Math.abs(amt).toLocaleString()} CR`;
                            } else {
                              const diff = Number(tx.orderValueDelta);
                              if (diff > 0) actionAmountStr = `+₹${diff.toLocaleString()}`;
                              else if (diff < 0) actionAmountStr = `−₹${Math.abs(diff).toLocaleString()}`;
                              else actionAmountStr = '₹0';
                            }

                            return (
                              <tr key={tx.id || idx} className="hover:bg-white/5 transition-colors group">
                                <td className="p-3 text-xs text-white/70 font-mono whitespace-nowrap align-top">
                                  {formatDateStr(tx.transactionTime)}
                                </td>
                                <td className="p-3 text-xs align-top">
                                  <div className="font-bold text-white whitespace-nowrap">{tx.actionType.replace(/_/g, ' ')}<br/><span className="text-[10px] uppercase text-white/50">{tx.actorRole}</span></div>
                                </td>
                                <td className="p-3 text-xs text-white/70 align-top whitespace-nowrap">
                                  {tx.previousState ? `${tx.previousState.replace(/_/g, ' ')} → ${tx.newState.replace(/_/g, ' ')}` : tx.newState || '-'}
                                </td>
                                <td className="p-3 text-xs text-white/70 align-top min-w-[130px]">
                                  {renderStaySegments(tx.snapshotStaySegments)}
                                </td>
                                <td className="p-3 text-xs text-white/70 align-top min-w-[110px]">
                                  {renderGuests(tx.snapshotGuests)}
                                </td>
                                <td className="p-3 text-xs text-white/70 align-top whitespace-nowrap">
                                  {tx.paymentType}
                                </td>
                                <td className="p-3 text-xs text-white/70 max-w-[150px] truncate align-top">
                                  {tx.refundTier}
                                </td>
                                <td className="p-3 text-xs text-white/70 align-top whitespace-nowrap">
                                  {tx.refundStatus.replace(/_/g, ' ')}
                                </td>
                                <td className="p-3 text-xs font-bold text-white align-top whitespace-nowrap">
                                  {actionAmountStr}
                                </td>
                                <td className="p-3 text-xs text-white/70 min-w-[200px] max-w-[300px] align-top whitespace-pre-wrap">
                                  {renderServices(tx.snapshotServices)}
                                </td>
                                <td className="p-3 text-xs text-white/70 text-right align-top">
                                  {renderAmt(Number(tx.newOrderTotal) - (Number(tx.newTotalPaid) - Number(tx.newTotalRefunded)))}
                                </td>
                                <td className="p-3 text-xs text-white/70 text-right whitespace-nowrap align-top">
                                  {renderAmt(Number(tx.newTotalPaid))}
                                </td>
                                <td className="p-3 text-xs text-white/70 text-right whitespace-nowrap align-top">
                                  {renderAmt(Number(tx.newRemainingAmount))}
                                </td>
                                <td className="p-3 text-xs text-white/70 text-right whitespace-nowrap align-top">
                                  {renderAmt(Number(tx.newPendingRefund))}
                                </td>
                                <td className="p-3 text-xs text-white/70 text-right whitespace-nowrap align-top">
                                  {renderAmt(Number(tx.newTotalRefunded))}
                                </td>
                                <td className="p-3 text-xs text-white/70 text-right whitespace-nowrap align-top">
                                  {renderAmt(Number(tx.newAmountToBePaid))}
                                </td>
                              </tr>
                            );
                          })}
                          <tr className="bg-white/5 border-t border-white/20">
                            <td colSpan={10} className="p-4 text-right font-bold text-white/50 uppercase tracking-widest text-xs">
                              Totals
                            </td>
                            <td className="p-4 text-right text-xs">
                              <div className="text-white/50 uppercase">Balance</div>
                              <div className="font-bold text-white text-lg">
                                {(() => {
                                  const { balance } = calculateLedgerTotals(booking);
                                  return renderAmt(balance);
                                })()}
                              </div>
                            </td>
                            <td className="p-4 text-right text-xs">
                              <div className="text-white/50 uppercase">Total Paid</div>
                              <div className="font-bold text-white">
                                ₹{Number(booking.totalPaid).toLocaleString()}
                              </div>
                            </td>
                            <td className="p-4 text-right text-xs">
                              <div className="text-white/50 uppercase">Remaining Amount</div>
                              <div className="font-bold text-white">
                                ₹{calculateLedgerTotals(booking).remainingAmount.toLocaleString()}
                              </div>
                            </td>
                            <td className="p-4 text-right text-xs">
                              <div className="text-white/50 uppercase">Pending Refund</div>
                              <div className="font-bold text-red-400">
                                ₹{calculateLedgerTotals(booking).pendingRefund.toLocaleString()}
                              </div>
                            </td>
                            <td className="p-4 text-right text-xs">
                              <div className="text-white/50 uppercase">Refund Paid</div>
                              <div className="font-bold text-white">
                                ₹{Number((booking as any).totalRefunded || 0).toLocaleString()}
                              </div>
                            </td>
                            <td className="p-4 text-right text-xs">
                              <div className="text-white/50 uppercase">Amount To Be Paid</div>
                              <div className="font-bold text-gold text-lg">
                                ₹{Number(booking.amountToBePaid).toLocaleString()}
                              </div>
                            </td>
                          </tr>
                        </>
                      );
                    })()}
                  </tbody>
                </table>
              </div>
            </div>
          </div>

        <div className="space-y-6">
          <div className="border border-white/10 bg-black/60 rounded-xl p-6">
            <h2 className="text-xl font-bold text-[#D4AF37] mb-4">Price Breakdown</h2>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Accommodation</span>
                <span className="text-white font-medium">₹{(Number(booking.currentTotal) - Number(booking.gstAmount) - Number(booking.cleaningFee) + Number(booking.discountAmount)).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Cleaning Fee</span>
                <span className="text-white font-medium">₹{Number(booking.cleaningFee).toLocaleString()}</span>
              </div>
              {Number(booking.discountAmount) > 0 && (
                <div className="flex justify-between text-sm text-green-400">
                  <span>Discount {booking.promoCode ? `(${booking.promoCode.code})` : ''}</span>
                  <span>-₹{Number(booking.discountAmount).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-white/70">Taxes (GST)</span>
                <span className="text-white font-medium">₹{Number(booking.gstAmount).toLocaleString()}</span>
              </div>
              <div className="border-t border-white/10 pt-3 mt-3 flex justify-between">
                <span className="text-white font-bold">Total</span>
                <span className="text-[#D4AF37] font-bold text-lg">₹{Number(booking.currentTotal).toLocaleString()}</span>
              </div>
              <div className="border-t border-white/10 pt-3 mt-3 flex justify-between text-sm">
                <span className="text-white/70">Paid</span>
                <span className="text-green-400">₹{Number(booking.totalPaid).toLocaleString()}</span>
              </div>
            </div>
          </div>

          <div className="border border-gold/20 bg-gold/5 rounded-xl p-6 space-y-4">
            <h3 className="text-lg font-bold text-gold flex items-center gap-2">
              🛡️ Cancellation & Refund Policy
            </h3>
            <div className="space-y-2 text-xs text-white/80">
              <div className="flex justify-between p-2 rounded bg-white/5 border border-white/10">
                <span>&gt; 14 Days before Check-in</span>
                <span className="font-bold text-green-400">100% Refund</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-white/5 border border-white/10">
                <span>7 - 14 Days before Check-in</span>
                <span className="font-bold text-yellow-400">50% Refund</span>
              </div>
              <div className="flex justify-between p-2 rounded bg-white/5 border border-white/10">
                <span>&lt; 7 Days before Check-in</span>
                <span className="font-bold text-red-400">0% (Non-refundable)</span>
              </div>
            </div>
            {booking.cancellationRefund !== null && (
              <div className="pt-2 border-t border-white/10 text-xs">
                <span className="text-white/60">Refund Amount Processed: </span>
                <span className="font-bold text-gold">₹{Number(booking.cancellationRefund).toLocaleString()}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
