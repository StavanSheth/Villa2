import React from 'react';
import './globals.css';
import { GlobalDashboardLayout, NavItem } from '@villa-platform/ui';

export const metadata = {
  title: 'Owner Dashboard - Mavon',
};

import { LayoutDashboard, Home, CalendarDays, DollarSign, Tag, Users, FileSpreadsheet, Sparkles, Star } from 'lucide-react';

const ownerNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/', icon: <LayoutDashboard className="w-5 h-5" /> },
  { label: 'Properties', href: '/properties', icon: <Home className="w-5 h-5" /> },
  { label: 'Bookings', href: '/bookings', icon: <CalendarDays className="w-5 h-5" /> },
  { label: 'Pricing', href: '/pricing', icon: <DollarSign className="w-5 h-5" /> },
  { label: 'Promo Codes', href: '/promos', icon: <Tag className="w-5 h-5" /> },
  { label: 'Customers', href: '/customers', icon: <Users className="w-5 h-5" /> },
  { label: 'Financials', href: '/reports', icon: <FileSpreadsheet className="w-5 h-5" /> },
  { label: 'Services', href: '/services', icon: <Sparkles className="w-5 h-5" /> },
  { label: 'Reviews', href: '/reviews', icon: <Star className="w-5 h-5" /> },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <GlobalDashboardLayout navItems={ownerNavItems} title="Mavon Owner" userProfile={{ name: 'Owner', email: 'owner.mavon.online' }}>
          {children}
        </GlobalDashboardLayout>
      </body>
    </html>
  );
}
