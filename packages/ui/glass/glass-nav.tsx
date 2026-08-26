import React from 'react';
import { cn } from '@villa-platform/design-system';

interface GlassNavProps extends React.HTMLAttributes<HTMLElement> {
  /** Render as header element */
  as?: 'nav' | 'header' | 'div';
}

/**
 * GlassNav — Navigation bar with Glass 1 material.
 * 
 * Applies glass-nav treatment (72% opacity, blur 24px, saturate 180%).
 * Designed for top navigation bars and headers.
 * 
 * @example
 * <GlassNav as="header" className="h-16 flex items-center px-6">
 *   <Logo />
 *   <SearchBar />
 * </GlassNav>
 */
export function GlassNav({
  children,
  className,
  as: Component = 'nav',
  ...props
}: GlassNavProps) {
  return (
    <Component
      className={cn('glass-nav', className)}
      {...props}
    >
      {children}
    </Component>
  );
}
