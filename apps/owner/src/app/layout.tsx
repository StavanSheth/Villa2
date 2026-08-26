import React from 'react';
import './globals.css';
import { GlobalDashboardLayout, NavItem } from '@villa-platform/ui';
import { ThemeProvider } from '@villa-platform/theme';

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
  { label: 'Services', href: '/services', icon: <Sparkles className="w-5 h-5" /> },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider initialRole="ADMIN" defaultTheme="dark">
          <GlobalDashboardLayout navItems={ownerNavItems} title="Mavon Owner" userProfile={{ name: 'Owner', email: 'owner.mavon.online' }}>
            {children}
          </GlobalDashboardLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
