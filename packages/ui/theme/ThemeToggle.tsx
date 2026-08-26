"use client";
import React from 'react';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '@villa-platform/hooks';

/**
 * ThemeToggle — Day/Night mode switch.
 * 
 * Uses the zustand theme store instead of local state.
 * Renders as a pill toggle with sun/moon icons.
 */
export function ThemeToggle({ className = '' }: { className?: string }) {
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const isDark = resolvedTheme === 'dark';

  const toggleTheme = () => {
    setTheme(isDark ? 'light' : 'dark');
  };

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? 'Switch to Morning mode' : 'Switch to Night mode'}
      className={`pointer-events-auto relative flex items-center rounded-full cursor-pointer select-none transition-all duration-500 shadow-inner ${
        isDark
          ? 'bg-white/15 border border-white/25 hover:border-white/40 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]'
          : 'bg-black/10 border border-black/20 hover:border-black/30 shadow-[inset_0_2px_8px_rgba(0,0,0,0.15)]'
      } ${className}`}
      style={{
        width: '60px',
        height: '32px',
        padding: '3px',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
      }}
    >
      <div
        className={`absolute top-[3px] left-[3px] flex items-center justify-center rounded-full shadow-md transition-all duration-500 transform-gpu ${
          isDark
            ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-black translate-x-0'
            : 'bg-gradient-to-br from-amber-200 to-amber-500 text-black translate-x-[28px]'
        }`}
        style={{ width: '24px', height: '24px' }}
      >
        {isDark ? (
          <Moon className="w-3.5 h-3.5 text-black fill-black" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-black fill-black" />
        )}
      </div>
    </button>
  );
}
