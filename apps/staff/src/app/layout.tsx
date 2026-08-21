import React from 'react';
import './globals.css';
import { GlobalDashboardLayout, NavItem } from '@villa-platform/ui';

export const metadata = {
  title: 'Staff Dashboard - Mavon',
};

const staffNavItems: NavItem[] = [
  { label: 'Tasks', href: '/' },
  { label: 'Housekeeping', href: '/housekeeping' },
  { label: 'Check-In / Out', href: '/checkin' },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <GlobalDashboardLayout navItems={staffNavItems} title="Mavon Staff" userProfile={{ name: 'Staff Member', email: 'staff.mavon.online' }}>
          {children}
        </GlobalDashboardLayout>
      </body>
    </html>
  );
}
