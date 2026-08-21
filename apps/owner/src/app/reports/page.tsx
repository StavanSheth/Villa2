import React from 'react';
import { BarChart3, TrendingUp, Calendar, DollarSign } from 'lucide-react';
import { prisma } from '@villa-platform/database';

import { redirect } from 'next/navigation';
import { requireAuth } from '../../lib/auth';

export default async function OwnerReportsPage() {
  const auth = await requireAuth();
  if (!auth) redirect('/login');

  const villas = await prisma.villa.findMany({
    where: auth.role === 'SUPER_ADMIN' ? {} : { 
      OR: [
        { ownerId: auth.userId },
        { ownerId: null }
      ]
    },
  });

  const villaIds = villas.map(v => v.id);

  const bookings = await prisma.booking.findMany({
    where: {
      villaId: { in: villaIds }
    }
  });

  const currentYear = new Date().getFullYear();
  const now = new Date();
  const next30Days = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);

  let totalRevenueYTD = 0;
  let pendingPayout = 0;
  let bookedNightsNext30Days = 0;

  bookings.forEach(b => {
    const totalAmt = Number(b.currentTotal) || 0;
    const paidAmt = Number(b.totalPaid) || 0;
    const checkIn = new Date(b.checkIn);
    const checkOut = new Date(b.checkOut);

    // 1. Total Revenue (YTD) - Confirmed bookings in the current year
    if (b.status === 'CONFIRMED' || b.status === 'COMPLETED') {
      if (checkIn.getFullYear() === currentYear) {
        totalRevenueYTD += totalAmt;
      }
    }

    // 2. Pending Payout - Remaining balance on Confirmed/Pending bookings
    if (b.status === 'CONFIRMED' || b.status === 'PENDING') {
      const balance = totalAmt - paidAmt;
      if (balance > 0) {
        pendingPayout += balance;
      }
    }

    // 3. Occupancy - Overlap with next 30 days
    if (b.status === 'CONFIRMED' || b.status === 'COMPLETED') {
      // Find overlap window
      const overlapStart = checkIn > now ? checkIn : now;
      const overlapEnd = checkOut < next30Days ? checkOut : next30Days;
      
      if (overlapStart < overlapEnd) {
        const nights = Math.ceil((overlapEnd.getTime() - overlapStart.getTime()) / (1000 * 60 * 60 * 24));
        bookedNightsNext30Days += nights;
      }
    }
  });

  const totalAvailableNights = villas.length * 30;
  const occupancyRate = totalAvailableNights > 0 
    ? Math.round((bookedNightsNext30Days / totalAvailableNights) * 100)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in text-white p-8 bg-[#111111] min-h-screen">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-[#D4AF37]">Owner Financial & Occupancy Reports</h1>
          <p className="text-sm text-white/50 mt-1">Monthly earnings breakdown, villa occupancy, and payout history</p>
        </div>
        <a 
          href="/api/export-bookings" 
          className="flex items-center gap-2 bg-gold text-black font-semibold px-5 py-2.5 rounded-lg hover:scale-105 transition shadow-lg shrink-0"
        >
          Export All Orders (Excel)
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-black/60 border border-white/10 p-5 rounded-xl space-y-2">
          <p className="text-xs text-white/50">Total Owner Revenue (YTD)</p>
          <p className="text-2xl font-mono font-bold text-green-400">₹{totalRevenueYTD.toLocaleString()}</p>
        </div>
        <div className="bg-black/60 border border-white/10 p-5 rounded-xl space-y-2">
          <p className="text-xs text-white/50">Average Occupancy (Next 30 Days)</p>
          <p className="text-2xl font-mono font-bold text-blue-400">{occupancyRate}%</p>
        </div>
        <div className="bg-black/60 border border-white/10 p-5 rounded-xl space-y-2">
          <p className="text-xs text-white/50">Pending Payout / Balance Owed</p>
          <p className="text-2xl font-mono font-bold text-[#D4AF37]">₹{pendingPayout.toLocaleString()}</p>
        </div>
      </div>
    </div>
  );
}
