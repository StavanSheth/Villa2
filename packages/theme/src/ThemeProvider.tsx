'use client';

import React, { useEffect } from 'react';
import { useThemeStore } from '@villa-platform/hooks';

/**
 * Maps the user's role to a specific primary color theme.
 * These CSS variables should be defined in your global CSS (e.g., globals.css).
 */
const themeMap = {
  CUSTOMER: 'theme-customer',       // Blue
  STAFF: 'theme-staff',             // Orange
  ADMIN: 'theme-admin',             // Purple
  SUPER_ADMIN: 'theme-superadmin',  // Red
};

export function ThemeProvider({ 
  children, 
  initialRole = 'CUSTOMER' 
}: { 
  children: React.ReactNode, 
  initialRole?: keyof typeof themeMap 
}) {
  const setRoleTheme = useThemeStore((state) => state.setRoleTheme);
  const roleTheme = useThemeStore((state) => state.roleTheme);

  // Initialize store with server-provided role if needed
  useEffect(() => {
    setRoleTheme(initialRole);
  }, [initialRole, setRoleTheme]);

  // Apply the theme class to the document body or a wrapper div
  useEffect(() => {
    const root = document.documentElement;
    // Remove all theme classes first
    Object.values(themeMap).forEach(themeClass => {
      root.classList.remove(themeClass);
    });
    
    // Add the current role's theme class
    root.classList.add(themeMap[roleTheme]);
  }, [roleTheme]);

  return <>{children}</>;
}
