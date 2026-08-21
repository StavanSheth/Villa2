'use client';

import React from 'react';
import { 
  StatCard, 
  BookingCard, 
  NotificationFeed, 
  VillaCard 
} from '@villa-platform/ui';
import { ThemeToggle } from '@villa-platform/ui';
import { useCustomerNotifications, useRecommendedVillas } from '../hooks/useCustomerData';
import { CalendarRange, CreditCard, Hotel, Wallet, IndianRupee } from 'lucide-react';
import { formatBookingSegments } from '@villa-platform/ui/booking';

export default function CustomerDashboardHome() {
  const { data: notifications = [], isLoading: notifsLoading } = useCustomerNotifications();
  const { data: recommendations = [], isLoading: villasLoading } = useRecommendedVillas();

  const [bookings, setBookings] = React.useState<any[]>([]);
  const [walletBalance, setWalletBalance] = React.useState<number>(0);

  React.useEffect(() => {
    // Fetch Bookings
    fetch('/api/bookings')
      .then(res => {
        const contentType = res.headers.get('content-type');
        if (res.ok && contentType && contentType.includes('application/json')) {
          return res.json();
        }
        return [];
      })
      .then(data => {
        if (Array.isArray(data)) setBookings(data);
      })
      .catch(console.error);

    // Fetch Wallet Balance
    fetch('/api/wallet')
      .then(res => res.json())
      .then(data => {
        if (data && typeof data.walletBalance === 'number') {
          setWalletBalance(data.walletBalance);
        }
      })
      .catch(console.error);
  }, []);

  const validBookings = bookings.filter((b: any) => {
    // Strictly discard any bookings with status 'AWAITING_PAYMENT' or 0 paid amount
    const isConfirmedStatus = b.status === 'CONFIRMED' || b.status === 'ADVANCE_PAID';
    const hasPaidAmount = Number(b.totalPaid || 0) > 0;
    return isConfirmedStatus || hasPaidAmount;
  });

  const formattedBookings = validBookings.map((b: any) => {
    const latestTx = b.orderTransactions && b.orderTransactions[0];
    
    const formatSegments = (segments: any) => {
      if (!segments || segments.length === 0) return formatBookingSegments(b.nightlyBreakdown, b.checkIn as any, b.checkOut as any);
      return segments.map((seg: any) => {
        const start = new Date(seg.checkIn).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        const end = new Date(seg.checkOut).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `${start} - ${end}`;
      }).join(', ');
    };

    const sumGuests = (guestsObj: any) => {
      if (!guestsObj || Object.keys(guestsObj).length === 0) return b.totalGuests;
      const firstDay = Object.values(guestsObj)[0] as any;
      return firstDay ? firstDay.adults + (firstDay.children || 0) : b.totalGuests;
    };

    return {
      id: b.bookingCode || b.id,
      villaName: b.villa?.name || "Chunawala's Seven C Villa",
      location: "Lonavala, Maharashtra",
      imageUrl: "http://localhost:3000/photos/day/Hero%20page.jpeg",
      dates: latestTx ? formatSegments(latestTx.snapshotStaySegments) : formatBookingSegments(b.nightlyBreakdown, b.checkIn as any, b.checkOut as any),
      guests: latestTx ? sumGuests(latestTx.snapshotGuests) : b.totalGuests,
      paymentStatus: b.status,
    };
  });

  const activeBookingRaw = validBookings[0];
  
  // Calculate total advance paid and payment left for all upcoming valid bookings
  const totalAdvancePaid = validBookings.reduce((sum, b) => sum + (Number(b.totalAdvancePaid) || 0), 0);
  const totalPaymentLeft = validBookings.reduce((sum, b) => sum + (Number(b.amountToBePaid) || 0), 0);

  const totalRefundsToCollect = bookings.reduce((sum, b) => sum + (Number(b.pendingRefund) || 0), 0);

  return (
    <div className="space-y-8 p-4 md:p-8">
      {/* Greeting Header */}
      <div className="border-b border-white/10 pb-6 flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-serif text-white mb-2">Good Evening, Stavan</h1>
          <p className="text-white/60 text-sm">Welcome back to your exclusive booking dashboard.</p>
        </div>
        <ThemeToggle />
      </div>

      {/* Top Overview Row */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <StatCard 
          title="Refund Wallet"
          value={`₹${walletBalance.toLocaleString()}`}
          subtitle={walletBalance > 0 ? "Available for your next booking" : "No active refund balance"}
          icon={Wallet}
          variant="success"
        />
        <StatCard 
          title="Refunds to Collect"
          value={`₹${totalRefundsToCollect.toLocaleString()}`}
          subtitle={totalRefundsToCollect > 0 ? "Pending from cancellations" : "No pending refunds"}
          icon={IndianRupee}
          variant={totalRefundsToCollect > 0 ? "warning" : "default"}
        />
        <StatCard 
          title="Total Advance Paid"
          value={`₹${totalAdvancePaid.toLocaleString()}`}
          subtitle="Across all upcoming stays"
          icon={CreditCard}
          variant="primary"
        />
        <StatCard 
          title="Payment Left"
          value={`₹${totalPaymentLeft.toLocaleString()}`}
          subtitle={totalPaymentLeft > 0 ? "Pending dues for check-in" : "All clear"}
          icon={IndianRupee}
          variant={totalPaymentLeft > 0 ? "warning" : "default"}
        />
        <StatCard 
          title="Upcoming Stay"
          value={activeBookingRaw 
            ? (activeBookingRaw.orderTransactions?.[0]?.snapshotStaySegments?.[0]?.checkIn
                ? new Date(activeBookingRaw.orderTransactions[0].snapshotStaySegments[0].checkIn).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                : (activeBookingRaw.nightlyBreakdown && Array.isArray(activeBookingRaw.nightlyBreakdown) && activeBookingRaw.nightlyBreakdown.length > 0
                    ? new Date(`${(activeBookingRaw.nightlyBreakdown[0] as any).date}T00:00:00`).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
                    : new Date(activeBookingRaw.checkIn).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })))
            : "None"}
          subtitle={activeBookingRaw ? `${activeBookingRaw.villa?.name || "Seven C Villa"}` : "No upcoming stays"}
          icon={CalendarRange}
          variant="default"
        />
      </div>

      {/* Main Content Split */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        
        {/* Left Column: All Upcoming Bookings */}
        <div className="xl:col-span-2 space-y-8">
          
          {/* Upcoming Bookings Section */}
          <section className="space-y-4">
            <h2 className="text-xl font-bold text-white mb-4">Upcoming Bookings ({formattedBookings.length})</h2>
            {formattedBookings.length > 0 ? (
              <div className="space-y-6">
                {formattedBookings.map((b) => (
                  <BookingCard key={b.id} booking={b} />
                ))}
              </div>
            ) : (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-8 text-center text-white/50">
                You have no active bookings. <a href="/book" className="text-gold hover:underline">Book a villa now!</a>
              </div>
            )}
          </section>

        </div>

        {/* Right Column: Notifications */}
        <div className="xl:col-span-1">
          <div className="sticky top-6 h-[600px]">
            {notifsLoading ? (
              <div className="h-full bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center text-white/40">
                Loading notifications...
              </div>
            ) : (
              <NotificationFeed 
                notifications={notifications} 
                onMarkAllRead={() => console.log('Marked all read')}
              />
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
