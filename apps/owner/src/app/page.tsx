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


  const allBookings = await prisma.booking.findMany({
    where: { villaId: { in: villaIds } },
    include: { events: true }
  });

  // Calculate Metrics
  const totalRevenue = activeBookings.reduce((sum, b) => sum + Number(b.totalPaid || 0), 0);
  const totalBookings = activeBookings.length;
  const totalGuests = activeBookings.reduce((sum, b) => sum + b.totalGuests, 0);
  const totalRefunds = allBookings.reduce((sum, b) => sum + Number((b as any).totalRefunded || 0), 0);
  const totalRefundsToInitiate = allBookings.reduce((sum, b) => sum + Number((b as any).pendingRefund || 0), 0);

  // Separate upcoming check-ins
  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const upcomingCheckIns = activeBookings.filter(b => new Date(b.checkIn) >= startOfToday).slice(0, 5);
  const pendingActions = allBookings.filter(b => 
    b.status === 'AWAITING_PAYMENT' || 
    (b.refundPolicySnapshot && (b.refundPolicySnapshot as any).status === 'PENDING_OWNER_SELECTION') ||
    Number((b as any).pendingRefund || 0) > 0
  );

  return (
    <div className="space-y-8 p-4 md:p-8 min-h-screen text-foreground">
      {/* Page Header */}
      <div className="border-b border-border pb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-serif text-primary mb-2">Owner Portfolio</h1>
          <p className="text-muted-foreground text-sm">Welcome back. Here's what's happening across your properties.</p>
        </div>
      </div>

      {/* SECTION 9: Quick Actions */}
      <div className="flex gap-4">
        <Link 
          href="/book"
          data-testid="btn-create-booking"
          className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground font-semibold rounded-lg hover:brightness-110 transition-colors shadow-lg"
        >
          <PlusCircle size={18} /> Create Booking
        </Link>

      </div>

      {/* SECTION 1 & 2: High-Level Financials & Occupancy (Metrics Row) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
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
            <h2 className="text-xl font-bold flex items-center gap-2"><Hotel className="text-primary" size={20}/> Property Overview</h2>
              <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
                {villas.map(villa => (
                <div key={villa.id} className="bg-card border border-border rounded-2xl p-6 hover:border-primary/50 transition-all shadow-sm">
                    <div className="flex justify-between items-start mb-4">
                    <div>
                      <h3 className="text-xl font-bold text-foreground mb-1">{villa.name}</h3>
                      <div className="text-sm text-muted-foreground">Lonavala, Maharashtra • {villa.capacity} Guests Max • {villa.bedrooms} Bedrooms • {villa.bathrooms} Bathrooms</div>
                    </div>
                    <span className="px-3 py-1 bg-green-500/20 text-green-400 border border-green-500/30 text-xs font-semibold rounded-full">
                      Active Property
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 pt-4 border-t border-border text-sm">
                    <div>
                      <span className="text-muted-foreground block text-xs">Base Rate</span>
                      <span className="text-foreground font-medium">₹{Number(villa.basePrice).toLocaleString()}/night</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block text-xs">Active Reservations</span>
                      <span className="text-foreground font-medium">{villa.bookings?.length || 0}</span>
                    </div>
                    <div className="col-span-2 sm:col-span-1">
                      <span className="text-muted-foreground block text-xs">Featured Amenities</span>
                      <span className="text-foreground font-medium">{Array.isArray(villa.amenities) && villa.amenities.length > 0 ? (villa.amenities as string[]).slice(0, 3).join(', ') : 'Pool, WiFi, AC'}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* SECTION 4: Upcoming Check-Ins */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2"><CalendarRange className="text-primary" size={20}/> Upcoming Check-Ins</h2>
            <UpcomingCheckIns initialBookings={JSON.parse(JSON.stringify(upcomingCheckIns))} />
          </section>

          {/* SECTION 8: Revenue Chart (Placeholder) */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold flex items-center gap-2"><BarChart3 className="text-primary" size={20}/> Revenue Trend (Last 7 Days)</h2>
            <div className="bg-card border border-border rounded-2xl p-6 h-64 flex items-end justify-between gap-2 px-8 shadow-sm">
              {/* Dummy bars for visual effect */}
              {[40, 70, 45, 90, 65, 80, 100].map((h, i) => (
                <div key={i} className="w-full bg-primary/20 hover:bg-primary/40 rounded-t-sm relative group cursor-pointer transition-all" style={{ height: `${h}%` }}>
                  <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-background border border-border text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                    ₹{h}k
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-between text-xs text-muted-foreground px-8">
              <span>Mon</span><span>Tue</span><span>Wed</span><span>Thu</span><span>Fri</span><span>Sat</span><span>Sun</span>
            </div>
          </section>

        </div>

        {/* Right Column */}
        <div className="space-y-8">
          
          {/* SECTION 6: Pending Actions */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2"><AlertCircle className="text-primary" size={18}/> Pending Actions</h2>
            <div className="bg-card border border-border rounded-2xl p-4 space-y-3 shadow-sm">
              {pendingActions.length > 0 ? (
                pendingActions.map(action => (
                  <div key={action.id} className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl flex items-center justify-between">
                    <div className="flex-1">
                    <div className="text-sm font-semibold">{action.id}</div>
                    <div className="text-xs text-muted-foreground">{action.status === 'AWAITING_PAYMENT' ? 'Awaiting Payment' : 'Refund Review Required'}</div>
                  </div>
                  <button className="text-xs bg-primary text-primary-foreground px-3 py-1.5 rounded-lg hover:brightness-110">Resolve</button>
                </div>
                ))
              ) : (
                <div className="text-sm text-muted-foreground text-center py-4">All caught up!</div>
              )}
            </div>
          </section>

          {/* SECTION 5: Recent Activity */}
          <section className="space-y-4">
            <h2 className="text-lg font-bold flex items-center gap-2"><Activity className="text-primary" size={18}/> Recent Activity</h2>
            <div className="bg-card border border-border rounded-2xl p-4 space-y-4 shadow-sm">
              {recentEvents.length > 0 ? recentEvents.map(event => (
                  <div key={event.id} className="border-b border-border pb-3 last:border-0 last:pb-0">
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-sm font-semibold text-foreground">{event.action.replace('_', ' ')}</span>
                      <span className="text-xs text-muted-foreground">{new Date(event.createdAt).toLocaleDateString()}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">{event.booking.villa.name} • {event.booking.bookingCode}</div>
                  </div>
              )) : (
                <div className="text-sm text-muted-foreground text-center py-4">No recent activity.</div>
              )}
            </div>
          </section>


        </div>
      </div>
    </div>
  );
}
