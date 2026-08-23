'use client';

import React, { useEffect, useState } from 'react';
import { useThemeStore } from '@villa-platform/hooks';
import { ThemeToggle } from '../theme/ThemeToggle';
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

export function GlobalDashboardLayout({ children, navItems, title = 'Mavon Dashboard', userProfile }: GlobalDashboardLayoutProps) {
  const sidebarOpen = useThemeStore((state) => state.sidebarOpen);
  const toggleSidebar = useThemeStore((state) => state.toggleSidebar);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden transition-colors duration-1000 relative bg-transparent">
      {/* Background Hero wrapper style for depth */}
      <div className="absolute inset-0 z-0 pointer-events-none hero-bg-wrapper opacity-30">
        <div className="hero-bg" style={{ backgroundImage: 'radial-gradient(circle at center, rgba(212, 175, 55, 0.08) 0%, transparent 100%)' }} />
      </div>

      {/* Left Sidebar */}
      <aside 
        className={`relative z-20 ${sidebarOpen ? 'w-64' : 'w-20'} 
        transition-all duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] flex flex-col liquid-glass border-y-0 border-l-0 border-r border-black/10 dark:border-white/10`}
      >
        <div className="h-16 flex items-center justify-center border-b border-black/10 dark:border-white/10">
          <div className="flex items-center gap-2 px-2 overflow-hidden whitespace-nowrap">
            <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center text-gold flex-shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            {sidebarOpen && (
              <div className="flex flex-col animate-fade-in">
                <span className="font-serif text-lg tracking-wide text-[var(--text-dark)] leading-tight">
                  {title === 'Mavon Dashboard' ? 'Chunawala\'s' : title}
                </span>
                <span className="text-[8px] uppercase tracking-[0.22em] text-gold font-medium">
                  Seven C Villa
                </span>
              </div>
            )}
          </div>
        </div>
        <nav className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
          {navItems.map((item, idx) => (
            <a 
              key={idx} 
              href={item.href} 
              data-testid={`sidebar-nav-${item.label.toLowerCase().replace(/\s+/g, '-')}`}
              className="group flex items-center px-4 py-3 text-sm font-medium rounded-2xl transition-all duration-300 hover:bg-black/5 dark:hover:bg-white/10 hover:text-gold text-[var(--text-sec-dark)]"
            >
              {item.icon ? (
                <div className="flex-shrink-0 w-5 h-5 mr-3 flex items-center justify-center group-hover:scale-110 transition-transform">
                  {item.icon}
                </div>
              ) : (
                <span className="flex-shrink-0 w-5 h-5 mr-3 rounded-full bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 group-hover:border-gold/50 transition-colors"></span>
              )}
              {sidebarOpen && <span className="animate-fade-in whitespace-nowrap">{item.label}</span>}
            </a>
          ))}
        </nav>
        
        {/* Sidebar Footer with ThemeToggle */}
        <div className="p-4 border-t border-black/10 dark:border-white/10 flex flex-col gap-4">
          {sidebarOpen && <p className="text-[10px] uppercase tracking-widest text-center text-[var(--text-sec-dark)] animate-fade-in truncate w-full">{userProfile?.email || 'admin@mavon.online'}</p>}
          <div className="flex justify-center">
            {mounted && <ThemeToggle />}
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        {/* Top Navbar */}
        <header 
          className="h-16 flex items-center justify-between px-6 liquid-glass border-b border-black/10 dark:border-white/10 border-t-0 border-x-0 z-20"
        >
          <div className="flex items-center gap-4">
            <button 
              onClick={toggleSidebar}
              className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-[var(--text-dark)]"
            >
              <Menu className="w-5 h-5" />
            </button>
            {/* Global Search */}
            <div className="relative group hidden sm:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-[var(--text-sec-dark)] group-focus-within:text-gold transition-colors" />
              <input 
                type="text" 
                data-testid="global-search-input"
                placeholder="Search (Ctrl + K)..." 
                className="pl-10 pr-4 py-2 rounded-full text-sm transition-all duration-300 w-64 focus:w-80 bg-black/5 dark:bg-white/5 border border-black/10 dark:border-white/10 focus:border-gold/50 text-[var(--text-dark)] focus:outline-none focus:ring-1 focus:ring-gold/30"
              />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            {/* Notifications & Profile */}
            <button className="p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors text-[var(--text-dark)] relative group">
              <Bell className="w-5 h-5 group-hover:rotate-12 transition-transform" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500 border border-black/50"></span>
            </button>
            <div className="flex items-center space-x-3 pl-4 border-l border-black/10 dark:border-white/10">
              <div 
                data-testid="user-profile-button"
                className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold bg-gradient-to-br from-amber-200 to-amber-500 text-black shadow-lg hover:scale-105 transition-transform cursor-pointer"
              >
                {userProfile?.name?.charAt(0) || 'U'}
              </div>
              <div className="hidden md:flex flex-col justify-center">
                <span className="text-sm font-medium text-[var(--text-dark)] leading-tight">{userProfile?.name || 'User'}</span>
                <span className="text-[10px] uppercase tracking-wider text-gold leading-tight mt-0.5">Dashboard</span>
              </div>
            </div>
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
