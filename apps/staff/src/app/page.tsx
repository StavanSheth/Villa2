import {
  CalendarCheck,
  LogIn,
  LogOut,
  User as UserIcon,
  CheckCircle,
  FileText,
  Clock,
  AlertCircle,
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
        <h1 className="text-3xl font-serif text-[#D4AF37]">Staff Dashboard</h1>
        <p className="text-sm text-gray-400 mt-1 uppercase tracking-wider font-medium">
          Upcoming Stays Overview
        </p>
      </div>

      <div className="space-y-8">
        {upcomingBookings.map((booking, idx) => (
          <div key={booking.code || idx} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm">
            
            {/* Header */}
            <div className="bg-gray-50 px-6 py-4 flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-gray-200">
              <div>
                <span className="text-xs text-[#D4AF37] font-semibold tracking-wider uppercase">Booking ID</span>
                <h2 className="text-xl font-serif text-gray-900">{booking.code}</h2>
              </div>
              <div className="flex gap-8">
                <div>
                  <span className="text-xs text-gray-400 uppercase tracking-wider block mb-1 font-medium">Check-in</span>
                  <div className="text-sm text-gray-800 font-medium">
                    {format(booking.checkIn, "dd MMM yyyy, HH:mm")}
                  </div>
                </div>
                <div>
                  <span className="text-xs text-gray-400 uppercase tracking-wider block mb-1 font-medium">Check-out</span>
                  <div className="text-sm text-gray-800 font-medium">
                    {format(booking.checkOut, "dd MMM yyyy, HH:mm")}
                  </div>
                </div>
              </div>
            </div>

            <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Guests & Services */}
              <div className="space-y-8">
                
                {/* Guests & Photos */}
                <section>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <UserIcon className="w-4 h-4 text-[#D4AF37]" /> Members & Photos
                    <span className="text-xs ml-2 normal-case font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-full border border-gray-200">
                      {booking.expectedAdults} Adult{booking.expectedAdults !== 1 ? 's' : ''}, {booking.expectedChildren} Child{booking.expectedChildren !== 1 ? 'ren' : ''}
                    </span>
                  </h3>
                  <div className="space-y-3">
                    {booking.guests.map((guest: any, i: number) => (
                      <div key={i} className={`flex items-center gap-3 p-3 rounded-lg border ${guest.isPending ? 'bg-red-50/50 border-dashed border-red-200' : 'bg-gray-50 border-gray-100'}`}>
                        {guest.photoUrl ? (
                          <img src={guest.photoUrl} alt={guest.name} className="w-10 h-10 rounded-full object-cover border border-gray-200" />
                        ) : (
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center border shadow-sm ${guest.isPending ? 'bg-white border-red-200' : 'bg-white border-gray-200'}`}>
                            {guest.isPending ? <AlertCircle className="w-5 h-5 text-red-400" /> : <UserIcon className="w-5 h-5 text-gray-400" />}
                          </div>
                        )}
                        <span className={`text-sm font-medium ${guest.isPending ? 'text-red-600 italic' : 'text-gray-800'}`}>
                          {guest.name}
                        </span>
                      </div>
                    ))}
                  </div>
                </section>

                {/* Services */}
                <section>
                  <h3 className="text-sm font-semibold text-gray-400 uppercase tracking-wider mb-4 flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#D4AF37]" /> Services
                  </h3>
                  <ul className="space-y-2">
                    {booking.services.length > 0 ? booking.services.map((service: any, i: number) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-gray-700">
                        <span className="w-1.5 h-1.5 rounded-full bg-[#D4AF37] mt-1.5 flex-shrink-0" />
                        {service.name}
                      </li>
                    )) : (
                      <li className="text-sm text-gray-400 italic">No additional services requested.</li>
                    )}
                  </ul>
                </section>

              </div>

              {/* Right Column: Ledger */}
              <div>
                <section className="bg-[#FCFAF5] rounded-xl p-6 border border-[#D4AF37]/30 shadow-sm">
                  <h3 className="text-sm font-semibold text-[#D4AF37] uppercase tracking-wider mb-4 flex items-center gap-2">
                    <FileText className="w-4 h-4" /> Ledger (Order Summary)
                  </h3>
                  
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between text-gray-700">
                      <span>Accommodation ({booking.ledger.nights} nights)</span>
                      <span>₹{booking.ledger.accommodation.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>Cleaning Fee</span>
                      <span>₹{booking.ledger.cleaningFee.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-gray-700">
                      <span>GST (18%)</span>
                      <span>₹{booking.ledger.gst.toLocaleString('en-IN')}</span>
                    </div>
                    
                    <div className="pt-3 pb-3 border-y border-gray-200 my-3 space-y-3">
                      <div className="flex justify-between text-gray-900 font-medium">
                        <span>Order Total</span>
                        <span>₹{booking.ledger.orderTotal.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Advance Paid</span>
                        <span>₹{booking.ledger.advancePaid.toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex justify-between text-gray-600">
                        <span>Balance Paid</span>
                        <span>₹{booking.ledger.balancePaid.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center pt-1">
                      <span className="text-xs text-gray-500 uppercase tracking-widest font-semibold">Remaining to Collect</span>
                      <span className={`text-lg font-bold ${booking.ledger.remaining > 0 ? 'text-red-500' : 'text-emerald-600'}`}>
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
            />

          </div>
        ))}
      </div>
    </div>
  );
}
