/**
 * Villa Design System — TypeScript Entry Point
 * 
 * Exports utility functions used across the design system.
 */

import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind classes with clsx for conditional class composition.
 * Use this instead of raw className concatenation.
 * 
 * @example
 * cn("bg-card text-foreground", isActive && "border-primary", className)
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Theme modes supported by the design system.
 */
export type Theme = 'light' | 'dark' | 'system';

/**
 * Role themes for multi-tenant theming.
 */
export type RoleTheme = 'CUSTOMER' | 'STAFF';

/**
 * Design system radius scale values.
 */
export const RADIUS = {
  xs: '8px',
  sm: '12px',
  md: '16px',
  lg: '20px',
  xl: '24px',
  '2xl': '28px',
  full: '9999px',
} as const;

/**
 * Design system duration scale values (in ms).
 */
export const DURATION = {
  instant: 80,
  fast: 140,
  normal: 220,
  slow: 300,
  theme: 300,
  page: 220,
} as const;
