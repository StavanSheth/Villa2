"use client";
import React, { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';

export function ThemeToggle({ className = '' }: { className?: string }) {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    // Check if user previously set a preference
    const savedTheme = localStorage.getItem('mavon-theme');
    if (savedTheme === 'light') {
      setIsDark(false);
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
  }, []);

  const toggleTheme = () => {
    const nextDark = !isDark;
    setIsDark(nextDark);
    if (nextDark) {
      document.body.classList.remove('light-theme');
      localStorage.setItem('mavon-theme', 'dark');
    } else {
      document.body.classList.add('light-theme');
      localStorage.setItem('mavon-theme', 'light');
    }
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
        className={`flex items-center justify-center rounded-full shadow-md transition-all duration-500 transform-gpu ${
          isDark
            ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-black'
            : 'bg-gradient-to-br from-amber-200 to-amber-500 text-black'
        }`}
        style={{
          width: '24px',
          height: '24px',
          transform: isDark ? 'translateX(0px)' : 'translateX(26px)',
        }}
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
