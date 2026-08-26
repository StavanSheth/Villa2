'use client';

import React, { useEffect, useState } from 'react';
import { useThemeStore } from '@villa-platform/hooks';
import { cn } from '@villa-platform/design-system';
import { ThemeToggle } from '../theme/ThemeToggle';
import { SessionTimer } from '../SessionTimer';
import { Sparkles, Bell, Search, Menu } from 'lucide-react';

export interface NavItem {
  label: string;
  href: string;
  icon?: React.ReactNode;
}

interface GlobalDashboardLayoutProps {
  children: React.ReactNode;
  navItems: NavItem[];
  title?: string;
  userProfile?: {
    name: string;
    email: string;
    avatarUrl?: string;
  };
}

/**
 * GlobalDashboardLayout — Shared app shell for all dashboard apps.
 * 
 * Provides:
 *   - Glass sidebar with navigation
 *   - Glass header with search and profile
 *   - Theme toggle
 *   - Responsive behavior
 * 
 * All styling uses semantic tokens — this component doesn't know
 * whether it's Day or Night mode.
 */
import { usePathname } from 'next/navigation';

export function GlobalDashboardLayout({ children, navItems, title = 'Mavon Dashboard', userProfile }: GlobalDashboardLayoutProps) {
  const sidebarOpen = useThemeStore((state) => state.sidebarOpen);
  const toggleSidebar = useThemeStore((state) => state.toggleSidebar);
  const setSidebarOpen = useThemeStore((state) => state.setSidebarOpen);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setMounted(true);
    // Close sidebar by default on mobile screens
    if (window.innerWidth < 768) {
      setSidebarOpen(false);
    }
  }, [setSidebarOpen]);

  if (pathname === '/login') {
    return <>{children}</>;
  }


  return (
    <div className="flex h-screen overflow-hidden relative bg-background">
      {/* Subtle radial gradient background for depth */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-30">
        <div 
          className="w-full h-full" 
          style={{ backgroundImage: 'radial-gradient(circle at center, rgba(212, 167, 44, 0.06) 0%, transparent 100%)' }} 
        />
      </div>

      {/* ── Sidebar Overlay (Mobile) ── */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={toggleSidebar}
        />
      )}

      {/* ── Left Sidebar ── */}
      <aside 
        className={cn(
          'fixed inset-y-0 left-0 z-50 md:relative shrink-0',
          'bg-card flex flex-col border-y-0 border-l-0 border-r border-border',
          'transition-transform duration-300 ease-in-out',
          'w-[280px]',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0',
        )}
      >
        {/* Logo / Brand */}
        <div className="h-16 flex items-center justify-center border-b border-border px-2">
          <div className="flex items-center gap-2 overflow-hidden whitespace-nowrap">
            <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/40 flex items-center justify-center text-primary flex-shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div className="flex flex-col animate-fade-in">
              <span className="font-display text-lg tracking-wide text-foreground leading-tight">
                {title === 'Mavon Dashboard' ? "Chunawala's" : title}
              </span>
              <span className="text-[8px] uppercase tracking-[0.22em] text-primary font-medium">
                Seven C Villa
              </span>
            </div>
          </div>
        </div>


        {/* Navigation Links */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navItems.map((item, idx) => (
            <a 
              key={idx} 
              href={item.href} 
              onClick={() => {
                if (window.innerWidth < 768) {
                  setSidebarOpen(false);
                }
              }}
              data-testid={`sidebar-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              className={cn(
                'group flex items-center px-4 py-3 text-body font-medium',
                'rounded-xl transition-all duration-normal',
                'hover:bg-accent hover:text-primary',
                'text-muted-foreground',
              )}
            >
              {item.icon ? (
                <div className="flex-shrink-0 w-5 h-5 mr-3 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
              ) : (
                <span className="flex-shrink-0 w-5 h-5 mr-3 rounded-full bg-accent border border-border group-hover:border-primary/50 transition-colors" />
              )}
              <span className="animate-fade-in whitespace-nowrap">{item.label}</span>
            </a>
          ))}
        </nav>
        
        {/* Sidebar Footer */}
        <div className="p-4 border-t border-border flex flex-col gap-4">
          <p className="text-overline uppercase tracking-widest text-center text-muted-foreground animate-fade-in truncate w-full">
            {userProfile?.email || 'admin@mavon.online'}
          </p>
        </div>
      </aside>

      {/* ── Main Content Area ── */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Universal Top Header */}
        <header className="h-16 flex items-center justify-between px-4 lg:px-8 bg-card border-b border-border z-20 shrink-0 shadow-sm">
          {/* Left: Burger (Mobile) & Theme Toggle */}
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleSidebar}
              className="p-2 -ml-2 rounded-full hover:bg-accent transition-colors text-foreground md:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="hidden md:block md:w-0"></div> {/* Spacer for desktop alignment if needed */}
            {mounted && <ThemeToggle />}
          </div>

          {/* Right: Session Timer & Profile Icon */}
          <div className="flex items-center gap-4">
            {mounted && <SessionTimer />}
            
            {userProfile?.avatarUrl ? (
              <img 
                src={userProfile.avatarUrl} 
                alt="Profile" 
                className="w-9 h-9 rounded-full border border-border shadow-sm cursor-pointer hover:ring-2 hover:ring-primary/50 transition-all object-cover"
              />
            ) : (
              <div 
                className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-semibold shadow-sm cursor-pointer hover:ring-2 hover:ring-blue-400 transition-all"
                title={userProfile?.name || 'User'}
              >
                {(userProfile?.name || userProfile?.email || 'U').charAt(0).toUpperCase()}
              </div>
            )}
          </div>
        </header>

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          <div className="max-w-7xl mx-auto animate-fade-in relative z-10">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
