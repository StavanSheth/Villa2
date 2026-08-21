import React from 'react';
import './globals.css';
import { Home, Search, Calendar, CreditCard, FileText, Heart, Star, Bell, User, Settings } from 'lucide-react';
import { GlobalDashboardLayout } from '@villa-platform/ui/layouts/GlobalDashboardLayout';

const customerNavItems = [
  { label: 'Dashboard', href: '/', icon: <Home className="w-5 h-5" /> },
  { label: 'Search Villas', href: '/book', icon: <Search className="w-5 h-5" /> },
  { label: 'My Stays', href: '/stays', icon: <Calendar className="w-5 h-5" /> },
  { label: 'Payments', href: '/payments', icon: <CreditCard className="w-5 h-5" /> },
  { label: 'Invoices', href: '/invoices', icon: <FileText className="w-5 h-5" /> },
  { label: 'Reviews', href: '/reviews', icon: <Star className="w-5 h-5" /> },
  { label: 'Profile', href: '/profile', icon: <User className="w-5 h-5" /> },
];

export default function CustomerRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-[var(--bg-dark)] text-white">
        <GlobalDashboardLayout 
          navItems={customerNavItems}
          title="Customer Portal"
          userProfile={{ name: 'Vikramaditya Mehta', email: 'vikram@example.com' }}
        >
          {children}
        </GlobalDashboardLayout>
      </body>
    </html>
  );
}
