// apps/web/src/app/(dashboard)/admin/page.tsx
// Admin Dashboard — Revenue, bookings, occupancy, pending payments overview

import {
  BarChart3,
  CalendarCheck,
  CreditCard,
  Users,
  Star,
  FileText,
  TrendingUp,
  AlertCircle,
  ArrowRight,
  IndianRupee,
} from "lucide-react";
import Link from "next/link";

import { prisma } from "@villa-platform/database";

export default async function AdminDashboardPage() {
  const currentMonthStart = new Date();
  currentMonthStart.setDate(1);
  currentMonthStart.setHours(0, 0, 0, 0);

  let stats = {
    monthlyRevenue: 847236,
    totalBookings: 42,
    occupancyRate: 78,
    pendingPayments: 3,
    activeCustomers: 156,
    pendingReviews: 5,
    pendingRefunds: 2,
    invoicesIssued: 38,
  };

  try {
    if (process.env.DATABASE_URL) {
      const [
        totalBookings,
        pendingPayments,
        invoicesIssued,
        activeCustomersCount,
        revenueData
      ] = await Promise.all([
        prisma.booking.count(),
        prisma.booking.count({ where: { status: "AWAITING_PAYMENT" } }),
        prisma.invoice.count(),
        prisma.user.count({ where: { roles: { some: { role: { name: "CUSTOMER" } } } } }),
        prisma.paymentTransaction.aggregate({
          where: {
            status: "SUCCESS",
            createdAt: { gte: currentMonthStart }
          },
          _sum: { amount: true }
        })
      ]);

      stats = {
        monthlyRevenue: Number(revenueData._sum.amount || 0),
        totalBookings,
        occupancyRate: 78,
        pendingPayments,
        activeCustomers: activeCustomersCount,
        pendingReviews: 0,
        pendingRefunds: 0,
        invoicesIssued,
      };
    }
  } catch (error) {
    console.warn("AdminDashboardPage: DB offline or unreachable, using mock data");
  }

  const adminLinks = [
    { label: "Manage Villas", href: "/villas", icon: <CalendarCheck className="w-5 h-5" />, description: "Edit villa details, pricing, add-ons" },
    { label: "Manage Staff", href: "/staff", icon: <Users className="w-5 h-5" />, description: "Add/remove staff, assign permissions" },
    { label: "Manage Customers", href: "/customers", icon: <Users className="w-5 h-5" />, description: "View customer profiles and history" },
    { label: "Pricing Rules", href: "/pricing", icon: <IndianRupee className="w-5 h-5" />, description: "Seasonal pricing and coupon management" },
    { label: "Reviews", href: "/reviews", icon: <Star className="w-5 h-5" />, description: "Moderate pending reviews" },
    { label: "Refunds", href: "/refunds", icon: <CreditCard className="w-5 h-5" />, description: "Process refund requests" },
    { label: "Reports", href: "/reports", icon: <BarChart3 className="w-5 h-5" />, description: "Revenue, occupancy, and analytics" },
    { label: "Audit Logs", href: "/audit", icon: <FileText className="w-5 h-5" />, description: "System activity and staff actions" },
  ];

  return (
    <div className="animate-fade-in space-y-8">
      <div>
        <h1 className="text-2xl font-serif text-white">Admin Dashboard</h1>
        <p className="text-sm text-white/50 mt-1">
          Platform overview and management
        </p>
      </div>

      {/* Revenue + Key Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "Monthly Revenue",
            value: `₹${stats.monthlyRevenue.toLocaleString("en-IN")}`,
            icon: <TrendingUp className="w-5 h-5" />,
            color: "text-primary",
          },
          {
            label: "Total Bookings",
            value: stats.totalBookings,
            icon: <CalendarCheck className="w-5 h-5" />,
            color: "text-green-400",
          },
          {
            label: "Occupancy Rate",
            value: `${stats.occupancyRate}%`,
            icon: <BarChart3 className="w-5 h-5" />,
            color: "text-blue-400",
          },
          {
            label: "Pending Payments",
            value: stats.pendingPayments,
            icon: <AlertCircle className="w-5 h-5" />,
            color: "text-yellow-400",
          },
        ].map((stat) => (
          <div key={stat.label} className="card">
            <div className={`mb-3 ${stat.color}`}>{stat.icon}</div>
            <p className="text-xl font-semibold text-white">{stat.value}</p>
            <p className="text-xs text-white/50 mt-1">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Quick Links Grid */}
      <div>
        <h2 className="text-lg font-serif text-white mb-4">Management</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="card group hover:border-primary/40 transition-all"
            >
              <div className="text-white/40 group-hover:text-primary transition-colors mb-3">
                {link.icon}
              </div>
              <h3 className="text-sm font-medium text-white mb-1">
                {link.label}
              </h3>
              <p className="text-xs text-white/40 leading-relaxed">
                {link.description}
              </p>
              <ArrowRight className="w-3.5 h-3.5 text-white/20 group-hover:text-primary mt-3 transition-colors" />
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
