// apps/web/src/app/(dashboard)/staff/page.tsx
// Staff Dashboard — Today's check-ins/outs, pending verifications

import {
  CalendarCheck,
  LogIn,
  LogOut,
  Banknote,
  Smartphone,
  FileText,
  Clock,
  AlertCircle,
} from "lucide-react";

import { prisma } from "@villa-platform/database";
import { format, startOfDay, endOfDay } from "date-fns";

export default async function StaffDashboardPage() {
  const today = new Date();
  const todayStart = startOfDay(today);
  const todayEnd = endOfDay(today);

  let todayStats = {
    checkIns: 2,
    checkOuts: 1,
    pendingCash: 1,
    pendingUpi: 1,
  };

  let todaysBookings = [
    {
      code: "MVN-849201",
      guest: "Rahul Sharma",
      type: "CHECK_IN",
      time: "14:00",
      villa: "Chunawala's Seven C Villa",
      balance: 15000,
      status: "CONFIRMED",
    },
    {
      code: "MVN-731042",
      guest: "Priya Patel",
      type: "CHECK_IN",
      time: "15:00",
      villa: "Chunawala's Seven C Villa",
      balance: 0,
      status: "CONFIRMED",
    },
    {
      code: "MVN-592183",
      guest: "Amit Desai",
      type: "CHECK_OUT",
      time: "11:00",
      villa: "Chunawala's Seven C Villa",
      balance: 0,
      status: "CHECKED_IN",
    },
  ];

  try {
    if (process.env.DATABASE_URL) {
      const [checkIns, checkOuts, pendingCashBookings] = await Promise.all([
        prisma.booking.findMany({
          where: {
            checkIn: { gte: todayStart, lte: todayEnd },
            status: { in: ["CONFIRMED", "ADVANCE_PAID"] }
          },
          include: { user: true, villa: true, transactions: true }
        }),
        prisma.booking.findMany({
          where: {
            checkOut: { gte: todayStart, lte: todayEnd },
            status: "CHECKED_IN"
          },
          include: { user: true, villa: true, transactions: true }
        }),
        prisma.booking.findMany({
          where: {
            status: "PENDING_VERIFICATION"
          },
          include: { user: true, villa: true, transactions: true }
        })
      ]);

      todayStats = {
        checkIns: checkIns.length,
        checkOuts: checkOuts.length,
        pendingCash: pendingCashBookings.filter(b => b.transactions.some(t => t.method === "CASH")).length,
        pendingUpi: pendingCashBookings.filter(b => b.transactions.some(t => t.method === "UPI")).length,
      };

      todaysBookings = [
        ...checkIns.map(b => ({
          code: b.bookingCode,
          guest: b.user.firstName + ' ' + b.user.lastName,
          type: "CHECK_IN",
          time: "14:00",
          villa: b.villa.name,
          balance: Number(b.currentTotal) - Number(b.totalPaid),
          status: b.status,
        })),
        ...checkOuts.map(b => ({
          code: b.bookingCode,
          guest: b.user.firstName + ' ' + b.user.lastName,
          type: "CHECK_OUT",
          time: "11:00",
          villa: b.villa.name,
          balance: Number(b.currentTotal) - Number(b.totalPaid),
          status: b.status,
        }))
      ];
    }
  } catch (error) {
    console.warn("StaffDashboardPage: DB offline or unreachable, using mock data");
  }


  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-serif text-white">Staff Dashboard</h1>
        <p className="text-sm text-white/50 mt-1">
          Today&apos;s operations overview
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Today's Check-ins", value: todayStats.checkIns, icon: <LogIn className="w-5 h-5" />, color: "text-green-400" },
          { label: "Today's Check-outs", value: todayStats.checkOuts, icon: <LogOut className="w-5 h-5" />, color: "text-blue-400" },
          { label: "Pending Cash", value: todayStats.pendingCash, icon: <Banknote className="w-5 h-5" />, color: "text-yellow-400" },
          { label: "Pending UPI", value: todayStats.pendingUpi, icon: <Smartphone className="w-5 h-5" />, color: "text-purple-400" },
        ].map((stat) => (
          <div key={stat.label} className="card">
            <div className={`mb-3 ${stat.color}`}>{stat.icon}</div>
            <p className="text-2xl font-semibold text-white">{stat.value}</p>
            <p className="text-xs text-white/50 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Today's Activity */}
      <div>
        <h2 className="text-lg font-serif text-white mb-4">Today&apos;s Activity</h2>
        <div className="space-y-3">
          {todaysBookings.map((booking) => (
            <div
              key={booking.code}
              className="card flex items-center justify-between"
            >
              <div className="flex items-center gap-4">
                <div
                  className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    booking.type === "CHECK_IN"
                      ? "bg-green-500/10 text-green-400"
                      : "bg-blue-500/10 text-blue-400"
                  }`}
                >
                  {booking.type === "CHECK_IN" ? (
                    <LogIn className="w-5 h-5" />
                  ) : (
                    <LogOut className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <p className="text-sm font-medium text-white">
                    {booking.guest}
                  </p>
                  <p className="text-xs text-white/40">
                    {booking.code} • {booking.villa} •{" "}
                    <span className="text-white/60">{booking.time}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                {booking.balance > 0 && (
                  <span className="text-xs font-mono text-yellow-400">
                    ₹{booking.balance.toLocaleString("en-IN")} due
                  </span>
                )}
                <button className="btn-gold text-[11px] px-4 py-2">
                  {booking.type === "CHECK_IN" ? "Check In" : "Check Out"}
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
