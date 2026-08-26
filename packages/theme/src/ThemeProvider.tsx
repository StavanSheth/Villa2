'use client';

import React, { useEffect } from 'react';
import { useThemeStore } from '@villa-platform/hooks';
import type { RoleTheme } from '@villa-platform/design-system';

/**
 * Maps the user's role to a specific primary color theme class.
 */
const roleThemeMap: Record<RoleTheme, string> = {
  CUSTOMER: 'theme-customer',
  STAFF: 'theme-staff',
  ADMIN: 'theme-admin',
  SUPER_ADMIN: 'theme-superadmin',
};

interface ThemeProviderProps {
  children: React.ReactNode;
  initialRole?: RoleTheme;
  /** Default theme if none is persisted. */
  defaultTheme?: 'light' | 'dark' | 'system';
}

/**
 * ThemeProvider — Controls both Day/Night and role themes.
 * 
 * Applies:
 *   - `.dark` class on `<html>` for Night mode
 *   - Role theme class on `<html>` for multi-tenant theming
 * 
 * Listens to `prefers-color-scheme` for `system` mode.
 * 
 * Usage:
 *   <ThemeProvider initialRole="STAFF" defaultTheme="dark">
 *     <App />
 *   </ThemeProvider>
 */
export function ThemeProvider({
  children,
  initialRole = 'CUSTOMER',
  defaultTheme = 'dark',
}: ThemeProviderProps) {
  const theme = useThemeStore((state) => state.theme);
  const resolvedTheme = useThemeStore((state) => state.resolvedTheme);
  const setTheme = useThemeStore((state) => state.setTheme);
  const setRoleTheme = useThemeStore((state) => state.setRoleTheme);
  const roleTheme = useThemeStore((state) => state.roleTheme);

  // Initialize role theme from server-provided value
  useEffect(() => {
    setRoleTheme(initialRole);
  }, [initialRole, setRoleTheme]);

  // Apply Day/Night theme class on <html>
  useEffect(() => {
    const root = document.documentElement;

    if (resolvedTheme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    // Also remove legacy body.light-theme class if present
    document.body.classList.remove('light-theme');
  }, [resolvedTheme]);

  // Apply role theme class on <html>
  useEffect(() => {
    const root = document.documentElement;
    // Remove all role theme classes first
    Object.values(roleThemeMap).forEach((themeClass) => {
      root.classList.remove(themeClass);
    });
    // Add the current role's theme class
    root.classList.add(roleThemeMap[roleTheme]);
  }, [roleTheme]);

  // Listen for system theme changes when in 'system' mode
  useEffect(() => {
    if (theme !== 'system') return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => {
      // Re-trigger resolution
      setTheme('system');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [theme, setTheme]);

  return <>{children}</>;
}
