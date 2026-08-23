// apps/owner/src/app/bookings/[id]/page.tsx
// Owner Control Room — reads booking + events + pricing from DB (same source as customer)

import React from 'react';
import { User, CreditCard, History, Edit, XCircle, Plus, Sparkles, DollarSign, FileText, Download } from 'lucide-react';
import { prisma, calculateLedgerTotals, formatCurrency } from '@villa-platform/database';
import { formatBookingSegments } from '@villa-platform/ui/booking';
import { BookingActions } from './BookingActions';
import { RefundAction } from './RefundAction';

export default async function BookingControlRoom({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const booking = await prisma.booking.findUnique({
    where: { bookingCode: id },
    include: {
      user: true,
      villa: true,
      services: true,
      events: { orderBy: { createdAt: 'asc' } },
      orderTransactions: { orderBy: { srNo: 'asc' } },
      promoCode: true,
      guestIdProofs: true,
    },
  });

  const serviceDefs = await prisma.serviceDef.findMany();
  const serviceMap = Object.fromEntries(serviceDefs.map(s => [s.id, s.name]));

  if (!booking) {
    return <div className="p-20 text-center text-white">Booking not found.</div>;
  }

  const nightlyBreakdown = (booking.nightlyBreakdown as any[]) || [];
  const servicesSnapshot = (booking.servicesSnapshot as any[]) || [];

  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h1 className="text-3xl font-serif text-[var(--text-dark)]">Booking #{booking.bookingCode}</h1>
            <span className="px-3 py-1 rounded-full text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
              {booking.status.replace(/_/g, ' ')}
            </span>
          </div>
          <p className="text-[var(--text-sec-dark)]">{booking.villa.name} • {new Date(booking.checkIn).toLocaleDateString()} - {new Date(booking.checkOut).toLocaleDateString()}</p>
        </div>
        <BookingActions 
          bookingCode={booking.bookingCode} 
          status={booking.status}
          initialCheckIn={booking.checkIn.toISOString()}
          initialCheckOut={booking.checkOut.toISOString()}
          initialGuests={booking.totalGuests}
          initialServices={booking.services.map(s => ({ serviceId: s.serviceId, name: s.name, quantity: s.quantity }))}
        />
      </div>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-8">

        {/* Main Column */}
        <div className="lg:col-span-2 space-y-8">

          {/* Customer/Owner Module */}
          <div className="liquid-glass rounded-2xl p-6">
            <h2 className="text-lg font-medium text-[var(--text-dark)] flex items-center gap-2 mb-6">
              <User className="w-5 h-5 text-gold" />
              {booking.bookingType === 'OWNER' || booking.bookingType === 'MAINTENANCE' || booking.bookingType === 'BLOCKED' ? 'Owner / Booker Details' : 'Customer Details'}
            </h2>
            <div className="grid grid-cols-2 gap-6">
              <div>
                <label className="text-xs uppercase tracking-widest text-[var(--text-sec-dark)] block mb-1">Name</label>
                <div className="text-[var(--text-dark)]">{booking.user.firstName} {booking.user.lastName}</div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-[var(--text-sec-dark)] block mb-1">Email</label>
                <div className="text-[var(--text-dark)]">{booking.user.email}</div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-[var(--text-sec-dark)] block mb-1">Guests</label>
                <div className="text-[var(--text-dark)]">{booking.totalGuests} Guests</div>
              </div>
              <div>
                <label className="text-xs uppercase tracking-widest text-[var(--text-sec-dark)] block mb-1">Payment Type</label>
                <div className="text-[var(--text-dark)]">{booking.paymentType || 'FULL'}</div>
              </div>
            </div>
          </div>

          {/* Timeline / Events — from BookingEvent table */}
          <div className="liquid-glass rounded-2xl p-6 overflow-hidden">
            <h2 className="text-lg font-medium text-[var(--text-dark)] flex items-center gap-2 mb-6">
              <History className="w-5 h-5 text-gold" />
              Audit Ledger
            </h2>
            <div className="overflow-x-auto pb-2">
              <table className="w-full text-left border-collapse min-w-[1200px]">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="p-3 text-xs font-semibold text-[var(--text-sec-dark)] uppercase tracking-wider">Sr No.</th>
                    <th className="p-3 text-xs font-semibold text-[var(--text-sec-dark)] uppercase tracking-wider whitespace-nowrap">Edit Time</th>
                    <th className="p-3 text-xs font-semibold text-[var(--text-sec-dark)] uppercase tracking-wider min-w-[150px]">Action & Role</th>
                    <th className="p-3 text-xs font-semibold text-[var(--text-sec-dark)] uppercase tracking-wider min-w-[150px]">State Change</th>
                    <th className="p-3 text-xs font-semibold text-[var(--text-sec-dark)] uppercase tracking-wider min-w-[150px]">Check In/Out</th>
                    <th className="p-3 text-xs font-semibold text-[var(--text-sec-dark)] uppercase tracking-wider min-w-[150px]">Guests</th>
                    <th className="p-3 text-xs font-semibold text-[var(--text-sec-dark)] uppercase tracking-wider">Payment Type</th>
                    <th className="p-3 text-xs font-semibold text-[var(--text-sec-dark)] uppercase tracking-wider">Refund Tier</th>
                    <th className="p-3 text-xs font-semibold text-[var(--text-sec-dark)] uppercase tracking-wider">Refund Status</th>
                    <th className="p-3 text-xs font-semibold text-[var(--text-sec-dark)] uppercase tracking-wider min-w-[200px]">Services</th>
                    <th className="p-3 text-xs font-semibold text-[var(--text-sec-dark)] uppercase tracking-wider whitespace-nowrap">Action Amount</th>
                    <th className="p-3 text-xs font-semibold text-[var(--text-sec-dark)] uppercase tracking-wider text-right">Balance</th>
                    <th className="p-3 text-xs font-semibold text-[var(--text-sec-dark)] uppercase tracking-wider text-right">Total Paid</th>
                    <th className="p-3 text-xs font-semibold text-[var(--text-sec-dark)] uppercase tracking-wider text-right">Remaining Amount</th>
                    <th className="p-3 text-xs font-semibold text-[var(--text-sec-dark)] uppercase tracking-wider text-right">Refund Amount</th>
                    <th className="p-3 text-xs font-semibold text-[var(--text-sec-dark)] uppercase tracking-wider text-right">Refund Paid</th>
                    <th className="p-3 text-xs font-semibold text-[var(--text-sec-dark)] uppercase tracking-wider text-right">Amount To Be Paid</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {booking.orderTransactions.map((tx: any, idx: number) => {
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
                          <span className="font-medium text-[var(--text-dark)]">{formatShortDate(seg.checkIn)}</span>–<span className="font-medium text-[var(--text-dark)]">{formatShortDate(seg.checkOut)}</span>
                        </div>
                      ));
                    };

                    const renderGuests = (guests: any) => {
                      if (!guests || typeof guests !== 'object' || Object.keys(guests).length === 0) return '-';
                      return Object.entries(guests).map(([date, counts]: [string, any], i) => (
                        <div key={i} className="mb-2 whitespace-pre-wrap">
                          <span className="font-medium text-[var(--text-dark)]">{formatShortDate(date)}:</span> {counts.adults}A, {counts.children}C
                        </div>
                      ));
                    };

                    const renderServices = (services: any) => {
                      if (!services || typeof services !== 'object' || Object.keys(services).length === 0) return '-';
                      return Object.entries(services).map(([date, svcs]: [string, any], i) => (
                        <div key={i} className="mb-2 whitespace-pre-wrap">
                          <span className="font-medium text-[var(--text-dark)]">{formatShortDate(date)}:</span>
                          {Array.isArray(svcs) ? svcs.map((svc: string, j: number) => <div key={j} className="ml-2">{svc}</div>) : '-'}
                        </div>
                      ));
                    };

                    // Match action amount logic to user request
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

                    const renderAmt = (val: number) => {
                      const num = Number(val);
                      return <div className="whitespace-nowrap">{num < 0 ? `-₹${Math.abs(num).toLocaleString()}` : `₹${num.toLocaleString()}`}</div>;
                    };

                    return (
                      <tr key={tx.id || idx} className="hover:bg-white/5 transition-colors group">
                        <td className="p-3 text-xs text-[var(--text-sec-dark)] font-mono whitespace-nowrap align-top">
                          {tx.srNo || idx + 1}
                        </td>
                        <td className="p-3 text-xs text-[var(--text-sec-dark)] font-mono whitespace-nowrap align-top">
                          {formatDateStr(tx.transactionTime)}
                        </td>
                        <td className="p-3 text-xs align-top">
                          <div className="font-bold text-[var(--text-dark)] whitespace-nowrap">{tx.actionType.replace(/_/g, ' ')}<br/><span className="text-[10px] uppercase text-[var(--text-sec-dark)]">{tx.actorRole}</span></div>
                        </td>
                        <td className="p-3 text-xs text-[var(--text-sec-dark)] align-top whitespace-nowrap">
                          {tx.previousState ? `${tx.previousState.replace(/_/g, ' ')} → ${tx.newState.replace(/_/g, ' ')}` : tx.newState || '-'}
                        </td>
                        <td className="p-3 text-xs text-[var(--text-sec-dark)] align-top min-w-[130px]">
                          {renderStaySegments(tx.snapshotStaySegments)}
                        </td>
                        <td className="p-3 text-xs text-[var(--text-sec-dark)] align-top min-w-[110px]">
                          {renderGuests(tx.snapshotGuests)}
                        </td>
                        <td className="p-3 text-xs text-[var(--text-sec-dark)] align-top whitespace-nowrap">
                          {tx.paymentType}
                        </td>
                        <td className="p-3 text-xs text-[var(--text-sec-dark)] max-w-[150px] truncate align-top">
                          {tx.refundTier}
                        </td>
                        <td className="p-3 text-xs text-[var(--text-sec-dark)] align-top whitespace-nowrap">
                          {tx.refundStatus.replace(/_/g, ' ')}
                        </td>
                        <td className="p-3 text-xs text-[var(--text-sec-dark)] min-w-[200px] max-w-[300px] align-top whitespace-pre-wrap">
                          {renderServices(tx.snapshotServices)}
                        </td>
                        <td className="p-3 text-xs font-bold text-white align-top whitespace-nowrap">
                          {actionAmountStr}
                        </td>
                        <td className="p-3 text-xs text-[var(--text-sec-dark)] text-right align-top">
                          {renderAmt(Number(tx.newOrderTotal) - (Number(tx.newTotalPaid) - Number(tx.newTotalRefunded)))}
                        </td>
                        <td className="p-3 text-xs text-[var(--text-sec-dark)] text-right whitespace-nowrap align-top">
                          {renderAmt(Number(tx.newTotalPaid))}
                        </td>
                        <td className="p-3 text-xs text-[var(--text-sec-dark)] text-right whitespace-nowrap align-top">
                          {renderAmt(Number(tx.newRemainingAmount))}
                        </td>
                        <td className="p-3 text-xs text-[var(--text-sec-dark)] text-right whitespace-nowrap align-top">
                          {renderAmt(Number(tx.newPendingRefund))}
                        </td>
                        <td className="p-3 text-xs text-[var(--text-sec-dark)] text-right whitespace-nowrap align-top">
                          {renderAmt(Number(tx.newTotalRefunded))}
                        </td>
                        <td className="p-3 text-xs text-[var(--text-sec-dark)] text-right whitespace-nowrap align-top">
                          {renderAmt(Number(tx.newAmountToBePaid))}
                        </td>
                      </tr>
                    );
                  })}
                  <tr className="bg-white/5 border-t border-white/20">
                    <td colSpan={11} className="p-4 text-right font-bold text-[var(--text-sec-dark)] uppercase tracking-widest text-xs">
                      Totals
                    </td>
                    <td className="p-4 text-right text-xs">
                      <div className="text-[var(--text-sec-dark)] uppercase">Balance</div>
                      <div className="font-bold text-[var(--text-dark)] text-lg">
                        {(() => {
                          const renderAmt = (val: number) => {
                            return <div className="whitespace-nowrap">{formatCurrency(val)}</div>;
                          };
                          const { balance } = calculateLedgerTotals(booking);
                          return renderAmt(balance);
                        })()}
                      </div>
                    </td>
                    <td className="p-4 text-right text-xs">
                      <div className="text-[var(--text-sec-dark)] uppercase">Total Paid</div>
                      <div className="font-bold text-[var(--text-dark)]">
                        ₹{Number(booking.totalPaid).toLocaleString()}
                      </div>
                    </td>
                    <td className="p-4 text-right text-xs">
                      <div className="text-[var(--text-sec-dark)] uppercase">Remaining Amount</div>
                      <div className="font-bold text-[var(--text-dark)]">
                        ₹{calculateLedgerTotals(booking).remainingAmount.toLocaleString()}
                      </div>
                    </td>
                    <td className="p-4 text-right text-xs">
                      <div className="text-[var(--text-sec-dark)] uppercase">Pending Refund</div>
                      <div className="font-bold text-red-400">
                        ₹{calculateLedgerTotals(booking).pendingRefund.toLocaleString()}
                      </div>
                    </td>
                    <td className="p-4 text-right text-xs">
                      <div className="text-[var(--text-sec-dark)] uppercase">Refund Paid</div>
                      <div className="font-bold text-[var(--text-dark)]">
                        ₹{Number(booking.totalRefunded || 0).toLocaleString()}
                      </div>
                    </td>
                    <td className="p-4 text-right text-xs">
                      <div className="text-[var(--text-sec-dark)] uppercase">Amount To Be Paid</div>
                      <div className="font-bold text-gold text-lg">
                        ₹{Number(booking.amountToBePaid).toLocaleString()}
                      </div>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Nightly Breakdown */}
          {nightlyBreakdown.length > 0 && (
            <div className="liquid-glass rounded-2xl p-6">
              <h2 className="text-lg font-medium text-[var(--text-dark)] mb-4">Nightly Breakdown</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                {nightlyBreakdown.map((n: any, i: number) => (
                  <div key={i} className="p-3 rounded-lg bg-white/5 border border-white/10 text-center">
                    <div className="text-xs text-[var(--text-sec-dark)]">{n.dayOfWeek}</div>
                    <div className="text-sm text-[var(--text-dark)] font-medium">{new Date(n.date).toLocaleDateString()}</div>
                    <div className={`text-sm font-bold mt-1 ${n.ruleApplied === 'WEEKEND' || n.ruleApplied === 'HOLIDAY' ? 'text-purple-400' : 'text-green-400'}`}>
                      ₹{n.price.toLocaleString()}
                    </div>
                    <div className="text-[10px] text-[var(--text-sec-dark)]">{n.ruleApplied}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Sidebar Column */}
        <div className="space-y-8">

          {/* Guest ID Proofs */}
          <div className="liquid-glass rounded-2xl p-6">
            <h2 className="text-lg font-medium text-[var(--text-dark)] flex items-center gap-2 mb-6">
              <FileText className="w-5 h-5 text-gold" />
              Guest ID Proofs
            </h2>
            {booking.guestIdProofs.length === 0 ? (
              <p className="text-sm text-[var(--text-sec-dark)]">No ID proofs uploaded.</p>
            ) : (
              <div className="space-y-3">
                {booking.guestIdProofs.map((proof: any) => (
                  <div key={proof.id} className="flex items-center justify-between bg-white/5 border border-white/10 p-3 rounded-xl">
                    <div className="text-sm text-[var(--text-dark)] flex items-center gap-2 overflow-hidden whitespace-nowrap text-ellipsis">
                      <FileText className="w-4 h-4 text-gold flex-shrink-0" />
                      <span className="truncate">{proof.guestName || 'Unnamed Proof'}</span>
                    </div>
                    <a 
                      href={proof.fileUrl} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-gold hover:text-yellow-400 transition ml-2"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Financials Ledger — from booking snapshot */}
          <div className="liquid-glass rounded-2xl p-6">
            <h2 className="text-lg font-medium text-[var(--text-dark)] flex items-center gap-2 mb-6">
              <DollarSign className="w-5 h-5 text-gold" />
              Ledger
            </h2>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-sec-dark)]">Accommodation {nightlyBreakdown.length > 0 ? `(${nightlyBreakdown.length} nights)` : ''}</span>
                <span className="text-[var(--text-dark)] font-medium">
                  ₹{(nightlyBreakdown.length > 0 
                    ? nightlyBreakdown.reduce((s: number, n: any) => s + n.price, 0)
                    : Math.max(0, Number(booking.currentTotal) - Number(booking.gstAmount) - Number(booking.cleaningFee) - servicesSnapshot.reduce((s: number, svc: any) => s + (svc.total || svc.totalPrice || 0), 0) + Number(booking.discountAmount))
                  ).toLocaleString()}
                </span>
              </div>
              {servicesSnapshot.map((svc: any, i: number) => (
                <div key={i} className="flex justify-between text-sm">
                  <span className="text-[var(--text-sec-dark)]">{svc.name}</span>
                  <span className="text-[var(--text-dark)] font-medium">₹{(svc.total || svc.totalPrice || 0).toLocaleString()}</span>
                </div>
              ))}
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-sec-dark)]">Cleaning Fee</span>
                <span className="text-[var(--text-dark)] font-medium">₹{Number(booking.cleaningFee).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-sec-dark)]">GST (18%)</span>
                <span className="text-[var(--text-dark)] font-medium">₹{Number(booking.gstAmount).toLocaleString()}</span>
              </div>
              {Number(booking.discountAmount) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-sec-dark)]">Discount</span>
                  <span className="text-green-400 font-medium">-₹{Number(booking.discountAmount).toLocaleString()}</span>
                </div>
              )}
              
              <div className="h-px bg-white/10 my-4"></div>
              
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-sec-dark)]">Order Total</span>
                <span className="text-[var(--text-dark)] font-bold text-lg">₹{Number(booking.currentTotal).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-sec-dark)]">Advance Paid</span>
                <span className="text-green-400 font-bold">₹{Number(booking.totalAdvancePaid).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-sec-dark)]">Balance Paid</span>
                <span className="text-green-400 font-bold">₹{(Number(booking.totalPaid) - Number(booking.totalAdvancePaid)).toLocaleString()}</span>
              </div>
              
              <div className="h-px bg-white/10 my-4"></div>

              <div className="flex justify-between text-sm bg-white/5 p-3 rounded-lg border border-white/10">
                <span className="text-[var(--text-sec-dark)]">Amount To Be Paid</span>
                <span className="text-gold font-bold text-xl">₹{Number(booking.amountToBePaid).toLocaleString()}</span>
              </div>
              
              {Number(booking.pendingRefund) > 0 && (
                <div className="flex justify-between text-sm bg-red-500/10 p-3 rounded-lg border border-red-500/20">
                  <span className="text-red-400">Refund Due</span>
                  <span className="text-red-400 font-bold text-xl">₹{Number(booking.pendingRefund).toLocaleString()}</span>
                </div>
              )}
            </div>
          </div>
          
          <RefundAction 
            bookingId={booking.bookingCode} 
            refundAmount={Number(booking.pendingRefund) > 0 ? Number(booking.pendingRefund) : (Number(booking.totalRefunded) || 0)}
            hasRefundedEvent={booking.orderTransactions.some((tx: any) => tx.actionType === 'REFUND_PROCESSED_MANUAL' || tx.actionType === 'REFUND' || tx.actionType === 'REFUND_PROCESSED')}
          />
        </div>
      </div>
    </div>
  );
}
