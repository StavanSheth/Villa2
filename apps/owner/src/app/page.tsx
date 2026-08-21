import React from 'react';
export const dynamic = 'force-dynamic';
import { prisma } from '@villa-platform/database';
import { StatCard, BookingCard, ThemeToggle, VillaCard } from '@villa-platform/ui';
import { formatBookingSegments } from '@villa-platform/ui/booking';
import { UpcomingCheckIns } from '../components/UpcomingCheckIns';
import { 
  IndianRupee, 
  Users, 
  Hotel, 
  CalendarRange, 
  BellRing, 
  AlertCircle, 
  Star, 
  BarChart3,
  PlusCircle,
  FileText,
  Activity
} from 'lucide-react';
import Link from 'next/link';

export default async function OwnerDashboardPage() {
  // Fetch data
  const ownerId = "owner-123"; // Using mock owner ID for this demo
  
  const villas = await prisma.villa.findMany({
    where: { name: { not: 'Concurrency Villa' } },
    include: {
      bookings: {
        where: { status: { in: ['CONFIRMED', 'ADVANCE_PAID', 'AWAITING_PAYMENT'] } }
      }
    }
  });

  const villaIds = villas.map(v => v.id);

  const activeBookings = await prisma.booking.findMany({
    where: { 
      villaId: { in: villaIds },
      status: { in: ['CONFIRMED', 'ADVANCE_PAID', 'AWAITING_PAYMENT'] }
    },
    orderBy: { checkIn: 'asc' },
    include: { villa: true, user: true }
  });

  const recentEvents = await prisma.bookingEvent.findMany({
    where: { booking: { villaId: { in: villaIds } } },
    orderBy: { createdAt: 'desc' },
    take: 5,
    include: { booking: { include: { villa: true } } }
  });

  const reviews = await prisma.review.findMany({
    where: { villaId: { in: villaIds } },
    orderBy: { createdAt: 'desc' },
    take: 3,
    include: { user: true, villa: true }
  });

  const allBookings = await prisma.booking.findMany({
    where: { villaId: { in: villaIds } },
    include: { events: true }
  });

  // Calculate Metrics
  const totalRevenue = activeBookings.reduce((sum, b) => sum + Number(b.totalPaid || 0), 0);
  const totalBookings = activeBookings.length;
  const totalGuests = activeBookings.reduce((sum, b) => sum + b.totalGuests, 0);
  const totalRefunds = allBookings.reduce((sum, b) => sum + Number(b.cancellationRefund || 0), 0);

  const totalRefundsToInitiate = allBookings.reduce((sum, b) => {
    let pendingRefundAmount = 0;
    for (const evt of (b.events || [])) {
      if (['CANCELLED', 'CANCELLATION_REQUESTED', 'EDIT_BOOKING', 'EDIT_DATES'].includes(evt.action)) {
        pendingRefundAmount += Number((evt.metadata as any)?.refundAmount) || 0;
      } else if (['REFUND_PROCESSED', 'REFUND_PROCESSED_MANUAL'].includes(evt.action)) {
        const amt = Number((evt.metadata as any)?.amount) || Number((evt.metadata as any)?.refundAmount) || pendingRefundAmount;
        pendingRefundAmount = Math.max(0, pendingRefundAmount - amt);
      }
    }
    if (pendingRefundAmount === 0 && b.status === 'CANCELLED' && Number(b.cancellationRefund) > 0) {
      if (!b.events?.some((e: any) => ['REFUND_PROCESSED', 'REFUND_PROCESSED_MANUAL'].includes(e.action))) {
        pendingRefundAmount = Number(b.cancellationRefund);
      }
    }
    return sum + pendingRefundAmount;
  }, 0);

  // Separate upcoming check-ins
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const upcomingCheckIns = activeBookings.filter(b => new Date(b.checkIn) >= startOfToday).slice(0, 5);
  const pendingActions = allBookings.filter(b => b.status === 'AWAITING_PAYMENT' || (b.refundPolicySnapshot && (b.refundPolicySnapshot as any).status === 'PENDING_OWNER_SELECTION'));

  return (
    <div className="space-y-8 p-4 md:p-8 min-h-screen text-white">
      {/* Header */}
      <div className="border-b border-white/10 pb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-serif text-[#D4AF37] mb-2">Owner Portfolio</h1>
          <p className="text-white/60 text-sm">Welcome back. Here's what's happening across your properties.</p>
        </div>
        <ThemeToggle />
      </div>

      {/* SECTION 9: Quick Actions */}
      <div className="flex gap-4">
        <Link 
          href="/book"
          data-testid="btn-create-booking"
          className="flex items-center gap-2 px-4 py-2 bg-[#D4AF37] text-black font-semibold rounded-lg hover:bg-yellow-600 transition-colors shadow-lg"
        >
          <PlusCircle size={18} /> Create Booking
        </Link>
        <Link 
          href="/reports"
          data-testid="btn-view-reports"
          className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white font-semibold rounded-lg border border-white/20 hover:bg-white/20 transition-colors"
        >
          <FileText size={18} /> View Reports
        </Link>
      </div>

      {/* SECTION 1 & 2: High-Level Financials & Occupancy (Metrics Row) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <StatCard 
          title="Total Processed Refunds" 
          value={`₹${totalRefunds.toLocaleString()}`} 
          subtitle="Refunds issued"
          icon={AlertCircle} 
        />
        <StatCard 
          title="Refunds to Initiate"
          value={`₹${totalRefundsToInitiate.toLocaleString()}`}
          subtitle={totalRefundsToInitiate > 0 ? "Pending customer refunds" : "All refunds processed"}
          icon={AlertCircle}
          variant={totalRefundsToInitiate > 0 ? "warning" : "default"}
        />
        <StatCard 
          title="Total Revenue"
          value={`₹${totalRevenue.toLocaleString()}`}
          subtitle="From active bookings"
          icon={IndianRupee}
          variant="success"
        />
        <StatCard 
          title="Total Bookings"
          value={totalBookings.toString()}
          subtitle="Across all properties"
          icon={Hotel}
          variant="primary"
        />
        <StatCard 
          title="Total Guests"
          value={totalGuests.toString()}
          subtitle="Expected arrivals"
          icon={Users}
          variant="default"
        />
        <StatCard 
          title="Pending Actions"
          value={pendingActions.length.toString()}
          subtitle="Require your attention"
          icon={AlertCircle}
          variant={pendingActions.length > 0 ? "warning" : "default"}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* SECTION 3: Properties Portfolio */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2"><Hotel className="text-[#D4AF37]" size={20}/> Property Overview</h2>
            <div className="grid grid-cols-1 gap-4">
              {villas.map(villa => (
                <div key={villa.id} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-all">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white mb-1">{villa.name}</h3>
                      <div className="text-sm text-white/60">Lonavala, Maharashtra • {villa.capacity} Guests Max • {villa.bedrooms} Bedrooms • {villa.bathrooms} Bathrooms</div>
                    </div>
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-semibold rounded-full">
                      Active Property
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-white/10 text-sm">
                    <div>
                      <span className="text-white/40 block text-xs">Base Rate</span>
                      <span className="text-white font-medium">₹{Number(villa.basePrice).toLocaleString()}/night</span>
                    </div>
                    <div>
                      <span className="text-white/40 block text-xs">Active Reservations</span>
                      <span className="text-[#D4AF37] font-bold">{villa.bookings.length} Bookings</span>
                    </div>
                    <div>
                      <span className="text-white/40 block text-xs">Featured Amenities</span>
                      <span className="text-white/80 font-medium">{Array.isArray(villa.amenities) && villa.amenities.length > 0 ? (villa.amenities as string[]).slice(0, 3).join(', ') : 'Pool, WiFi, AC'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 4: Upcoming Check-Ins */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2"><CalendarRange className="text-[#D4AF37]" size={20}/> Upcoming Check-Ins</h2>
            <UpcomingCheckIns initialBookings={JSON.parse(JSON.stringify(upcomingCheckIns))} />
          </section>

          {/* SECTION 8: Revenue Chart (Placeholder) */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2"><BarChart3 className="text-[#D4AF37]" size={20}/> Revenue Trends</h2>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-6 h-64 flex items-end justify-between gap-2 px-8">
              {/* Dummy bars for visual effect */}
              {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                <div key={i} className="w-full bg-[#D4AF37]/20 hover:bg-[#D4AF37]/40 rounded-t-sm relative group cursor-pointer transition-all" style={{ height: `${h}%` }}>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    ₹{h}k
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-white/40 px-8">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>
          </section>

        </div>

        {/* Right Column */}
        <div className="space-y-8">
          
          {/* SECTION 6: Pending Actions */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2"><AlertCircle className="text-[#D4AF37]" size={20}/> Pending Actions</h2>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3">
              {pendingActions.length > 0 ? (
                pendingActions.map(action => (
                  <div key={action.id} className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <div className="text-sm font-bold text-red-400 mb-1">{action.bookingCode}</div>
                    <div className="text-xs text-white/80">{action.status === 'AWAITING_PAYMENT' ? 'Awaiting Payment' : 'Refund Review Required'}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-white/50 text-center py-4">All caught up!</div>
              )}
            </div>
          </section>

          {/* SECTION 5: Recent Activity */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2"><Activity className="text-[#D4AF37]" size={20}/> Recent Activity</h2>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
              {recentEvents.length > 0 ? (
                recentEvents.map(event => (
                  <div key={event.id} className="border-b border-white/10 pb-3 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-semibold text-white/90">{event.action.replace('_', ' ')}</span>
                      <span className="text-xs text-[#D4AF37]">{new Date(event.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-xs text-white/60">{event.booking.villa.name} • {event.booking.bookingCode}</div>
                  </div>
                ))
              ) : (
                <div className="text-sm text-white/50 text-center py-4">No recent activity.</div>
              )}
            </div>
          </section>

          {/* SECTION 7: Recent Reviews */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2"><Star className="text-[#D4AF37]" size={20}/> Recent Reviews</h2>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-4">
              {reviews.length > 0 ? (
                reviews.map(review => (
                  <div key={review.id} className="p-4 bg-white/5 border border-white/10 rounded-xl">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-sm">{review.user?.firstName || 'Guest'}</span>
                      <span className="text-gold text-xs flex items-center gap-1"><Star size={12} fill="#D4AF37" color="#D4AF37"/> {review.rating}/5</span>
                    </div>
                    <p className="text-xs text-white/70 italic line-clamp-2">"{review.comment}"</p>
                  </div>
                ))
              ) : (
                <div className="text-sm text-white/50 text-center py-4">No reviews yet.</div>
              )}
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
