import React from 'react';
import './globals.css';
import { QueryProvider } from '../providers/QueryProvider';
import { GlobalDashboardLayout, NavItem } from '@villa-platform/ui';
import { ThemeProvider } from '@villa-platform/theme';

export const metadata = {
  title: 'Booking Dashboard - Mavon',
};

import { CalendarPlus, Calendar, FileText } from 'lucide-react';

const bookingNavItems: NavItem[] = [
  { label: 'Book Villa', href: '/book', icon: <CalendarPlus className="w-5 h-5" /> },
  { label: 'My Stays', href: '/', icon: <Calendar className="w-5 h-5" /> },
  { label: 'Invoices', href: '/invoices', icon: <FileText className="w-5 h-5" /> },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider initialRole="CUSTOMER" defaultTheme="dark">
          <QueryProvider>
            <GlobalDashboardLayout navItems={bookingNavItems} title="Mavon Booking" userProfile={{ name: 'Guest User', email: 'guest.mavon.online' }}>
              {children}
            </GlobalDashboardLayout>
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
