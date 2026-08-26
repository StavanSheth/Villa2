import React from 'react';
import { cn } from '@villa-platform/design-system';

interface GlassPanelProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Use as aside (sidebar) element */
  as?: 'div' | 'aside' | 'section';
}

/**
 * GlassPanel — Sidebar and large surface areas with Glass 1 material.
 * 
 * Applies glass-nav treatment (72% opacity, blur 24px, saturate 180%).
 * Designed for sidebars, side panels, and large structural surfaces.
 * 
 * @example
 * <GlassPanel as="aside" className="w-64 h-screen">
 *   <nav>...</nav>
 * </GlassPanel>
 */
export function GlassPanel({
  children,
  className,
  as: Component = 'div',
  ...props
}: GlassPanelProps) {
  return (
    <Component
      className={cn('glass-nav', className)}
      {...props}
    >
      {children}
    </Component>
  );
}
