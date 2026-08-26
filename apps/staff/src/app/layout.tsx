import React from 'react';
import './globals.css';
import { GlobalDashboardLayout, NavItem } from '@villa-platform/ui';
import { ThemeProvider } from '@villa-platform/theme';

export const metadata = {
  title: 'Staff Dashboard - Mavon',
};

const staffNavItems: NavItem[] = [
  { label: 'Tasks', href: '/' },
];

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider initialRole="STAFF" defaultTheme="dark">
          <GlobalDashboardLayout navItems={staffNavItems} title="Mavon Staff" userProfile={{ name: 'Staff Member', email: 'staff.mavon.online' }}>
            {children}
          </GlobalDashboardLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
