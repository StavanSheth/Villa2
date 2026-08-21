import React from 'react';
import './globals.css';
import { GlobalDashboardLayout, NavItem } from '@villa-platform/ui';

export const metadata = {
  title: 'Admin Dashboard - Mavon',
};

const adminNavItems: NavItem[] = [
  { label: 'Dashboard', href: '/' },
  { label: 'Villas', href: '/villas' },
  { label: 'Bookings', href: '/bookings' },
  { label: 'Users', href: '/users' },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        <GlobalDashboardLayout navItems={adminNavItems} title="Mavon Admin" userProfile={{ name: 'Admin User', email: 'admin@mavon.online' }}>
          {children}
        </GlobalDashboardLayout>
      </body>
    </html>
  );
}
