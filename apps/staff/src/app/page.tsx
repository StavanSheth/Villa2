import {
  CalendarCheck,
  LogIn,
  LogOut,
  User as UserIcon,
  CheckCircle,
  FileText,
  Clock,
  AlertCircle,
  ChevronDown,
} from "lucide-react";

import { prisma } from "@villa-platform/database";
import { format, startOfDay, endOfDay } from "date-fns";
import ClientBookingActions from "./ClientBookingActions";

export default async function StaffDashboardPage() {
  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);

  // Default to mock data if DB is unavailable
  let upcomingBookings: any[] = [
    {
      id: "mock-id",
      code: "MVN-849201",
      checkIn: new Date(),
      checkOut: new Date(Date.now() + 86400000 * 2),
      status: "CONFIRMED",
      guests: [
        { name: "Rahul Sharma (Primary Guest)", photoUrl: null },
        { name: "Priya Sharma (Adult)", photoUrl: null },
        { name: "Aryan Sharma (Child)", photoUrl: null }
      ],
      services: [
        { name: "Private Chef (Breakfast & Dinner)" },
        { name: "Airport Transfer (Pickup scheduled)" },
        { name: "Daily Housekeeping" }
      ],
      ledger: {
        nights: 1,
        accommodation: 10000,
        cleaningFee: 1500,
        gst: 2070,
        orderTotal: 13570,
        advancePaid: 0,
        balancePaid: 13570,
        remaining: 0
      },
      missingCount: 2,
      rawIdProofs: [],
      rawCheckIn: new Date()
    }
  ];

  try {
    if (process.env.DATABASE_URL) {
      const dbBookings = await prisma.booking.findMany({
        where: {
          checkIn: { gte: todayStart },
          status: { in: ["CONFIRMED", "ADVANCE_PAID"] }
        },
        include: { 
          user: true, 
          villa: true, 
          services: true,
          guestIdProofs: true,
          segments: true
        },
        orderBy: {
          checkIn: 'asc'
        },
        take: 10
      });

      if (dbBookings.length > 0) {
        upcomingBookings = dbBookings.map(b => {
          const nights = b.nightlyBreakdown ? (b.nightlyBreakdown as any[]).length : 1;
          const accommodation = Number(b.currentTotal) - Number(b.cleaningFee) - Number(b.gstAmount);
          const advancePaid = Number(b.totalAdvancePaid);
          const balancePaid = Number(b.totalBalancePaid);
          
          let expectedAdults = 1;
          let expectedChildren = 0;
          if (b.segments && b.segments.length > 0) {
            expectedAdults = b.segments.reduce((acc, seg) => acc + seg.adults, 0);
            expectedChildren = b.segments.reduce((acc, seg) => acc + seg.children, 0);
          }

          const missingCount = Math.max(0, expectedAdults - b.guestIdProofs.length);

          let guests: any[] = [
            { name: `${b.user.firstName} ${b.user.lastName} (Primary Guest)`, photoUrl: null },
            ...b.guestIdProofs.map(g => ({ name: g.guestName || "Guest", photoUrl: g.fileUrl }))
          ];

          if (guests.length < expectedAdults) {
            const needed = expectedAdults - guests.length;
            for (let i = 0; i < needed; i++) {
              guests.push({ name: `Pending Guest ${guests.length + 1}`, photoUrl: null, isPending: true });
            }
          }

          let mappedServices = b.services.map(s => ({ name: s.name }));
          if (mappedServices.length === 0 && b.servicesSnapshot) {
            let snapshot: any = b.servicesSnapshot;
            if (typeof snapshot === 'string') {
              try { snapshot = JSON.parse(snapshot); } catch (e) {}
            }
            if (Array.isArray(snapshot)) {
              mappedServices = snapshot.map((s: any) => ({ 
                name: `${s.name || 'Unknown Service'} ${s.quantity && s.quantity > 1 ? 'x' + s.quantity : ''}`.trim() 
              }));
            }
          }
          
          return {
            id: b.id,
            code: b.bookingCode,
            checkIn: b.checkIn,
            checkOut: b.checkOut,
            status: b.status,
            expectedAdults,
            expectedChildren,
            guests: guests,
            services: mappedServices,
            ledger: {
              nights: nights,
              accommodation: accommodation > 0 ? accommodation : 10000,
              cleaningFee: Number(b.cleaningFee),
              gst: Number(b.gstAmount),
              orderTotal: Number(b.currentTotal),
              advancePaid: advancePaid,
              balancePaid: balancePaid,
              remaining: Number(b.amountToBePaid || 0)
            },
            missingCount,
            rawIdProofs: b.guestIdProofs,
            rawCheckIn: b.checkIn
          };
        });
      }
    }
  } catch (error) {
    console.warn("StaffDashboardPage: DB offline or unreachable, using mock data");
  }

  return (
    <div className="animate-fade-in space-y-8 pb-12">
      <div>
        <h1 className="text-display text-primary">Staff Dashboard</h1>
        <p className="text-caption text-muted-foreground mt-1 uppercase tracking-wider font-medium">
          Upcoming Stays Overview
        </p>
      </div>

      <div className="space-y-8">
        {upcomingBookings.map((booking, idx) => (
          <details key={booking.code || idx} className="group bg-card border border-border rounded-[var(--radius-card)] overflow-hidden shadow-villa-sm [&_summary::-webkit-details-marker]:hidden">
            
            {/* Header (Summary) */}
            <summary className="cursor-pointer list-none outline-none focus-visible:ring-2 focus-visible:ring-primary">
              <div className="bg-muted px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-transparent group-open:border-border transition-colors hover:bg-muted/80">
                <div className="flex items-center gap-4">
                  <div className="w-8 h-8 rounded-full bg-background border border-border flex items-center justify-center shadow-sm">
                    <ChevronDown className="w-5 h-5 text-muted-foreground transition-transform duration-300 group-open:-rotate-180" />
                  </div>
                  <div>
                    <span className="text-caption text-primary font-semibold tracking-wider uppercase">Booking ID</span>
                    <h2 className="text-xl font-semibold text-foreground">{booking.code}</h2>
                  </div>
                </div>
                <div className="flex gap-8 ml-12 md:ml-0">
                  <div>
                    <span className="text-caption text-muted-foreground uppercase tracking-wider block mb-1 font-medium">Check-in</span>
                    <div className="text-body text-foreground font-medium">
                      {format(booking.checkIn, "dd MMM yyyy, HH:mm")}
                    </div>
                  </div>
                  <div>
                    <span className="text-caption text-muted-foreground uppercase tracking-wider block mb-1 font-medium">Check-out</span>
                    <div className="text-body text-foreground font-medium">
                      {format(booking.checkOut, "dd MMM yyyy, HH:mm")}
                    </div>
                  </div>
                </div>
              </div>
            </summary>

            <div className="animate-in fade-in duration-300">
              <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Guests & Services */}
              <div className="space-y-8">
                
                {/* Guests & Photos */}
                <section className="bg-background border border-border rounded-[var(--radius-card)] p-5 shadow-sm">
                  <h3 className="text-caption font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-primary" /> Members & Photos
                    <span className="text-caption ml-2 normal-case font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full border border-border">
                      {booking.expectedAdults} Adult{booking.expectedAdults !== 1 ? 's' : ''}, {booking.expectedChildren} Child{booking.expectedChildren !== 1 ? 'ren' : ''}
                    </span>
                  </h3>
                  <div className="space-y-3">
                    {booking.guests.map((guest: any, i: number) => (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-[var(--radius-sm)] border ${guest.isPending ? 'bg-danger/5 border-dashed border-danger/20' : 'bg-muted border-border'}`}>
                        {guest.photoUrl ? (
                          <img src={guest.photoUrl} alt={guest.name} className="w-10 h-10 rounded-full object-cover border border-border" />
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border shadow-villa-xs ${guest.isPending ? 'bg-background border-danger/20' : 'bg-background border-border'}`}>
                            {guest.isPending ? <AlertCircle className="w-5 h-5 text-danger" /> : <UserIcon className="w-5 h-5 text-muted-foreground" />}
                          </div>
                        )}
                        <span className={`text-body font-medium ${guest.isPending ? 'text-danger italic' : 'text-foreground'}`}>
                          {guest.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Services */}
                <section className="bg-background border border-border rounded-[var(--radius-card)] p-5 shadow-sm">
                  <h3 className="text-caption font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-primary" /> Services
                  </h3>
                  <ul className="space-y-2">
                    {booking.services.length > 0 ? booking.services.map((service: any, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-body text-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 flex-shrink-0" />
                        {service.name}
                      </li>
                    )) : (
                      <li className="text-body text-muted-foreground italic">No additional services requested.</li>
                    )}
                  </ul>
                </section>

              </div>

              {/* Right Column: Ledger */}
              <div>
                <section className="bg-muted rounded-[var(--radius-card)] p-6 border border-primary/30 shadow-villa-sm">
                  <h3 className="text-caption font-semibold text-primary uppercase tracking-wider mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Ledger (Order Summary)
                  </h3>
                  
                  <div className="space-y-3 text-body">
                    <div className="flex justify-between text-card-foreground">
                      <span>Accommodation ({booking.ledger.nights} nights)</span>
                      <span>₹{booking.ledger.accommodation.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-card-foreground">
                      <span>Cleaning Fee</span>
                      <span>₹{booking.ledger.cleaningFee.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-card-foreground">
                      <span>GST (18%)</span>
                      <span>₹{booking.ledger.gst.toLocaleString('en-IN')}</span>
                    </div>
                    
                    <div className="pt-3 pb-3 border-y border-border my-3 space-y-3">
                      <div className="flex justify-between text-foreground font-medium">
                        <span>Order Total</span>
                        <span>₹{booking.ledger.orderTotal.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Advance Paid</span>
                        <span>₹{booking.ledger.advancePaid.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-muted-foreground">
                        <span>Balance Paid</span>
                        <span>₹{booking.ledger.balancePaid.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-caption text-muted-foreground uppercase tracking-widest font-semibold">Remaining to Collect</span>
                      <span className={`text-lg font-bold ${booking.ledger.remaining > 0 ? 'text-danger' : 'text-success'}`}>
                        ₹{booking.ledger.remaining.toLocaleString('en-IN')}
                      </span>
                    </div>
                  </div>
                </section>
              </div>
            </div>

            {/* Actions Footer - Replaced static with client component */}
            <ClientBookingActions 
              booking={{ id: booking.id, code: booking.code }} 
              missingCount={booking.missingCount} 
              rawIdProofs={booking.rawIdProofs} 
              checkInTime={booking.rawCheckIn}
              remainingAmount={booking.ledger.remaining}
            />

            </div>
          </details>
        ))}
      </div>
    </div>
  );
}
