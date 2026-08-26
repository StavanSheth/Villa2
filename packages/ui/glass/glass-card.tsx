import React from 'react';
import { cn } from '@villa-platform/design-system';

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Disable hover lift effect */
  noHover?: boolean;
  /** Use gold-highlighted border */
  gold?: boolean;
  /** Use compact padding */
  compact?: boolean;
}

/**
 * GlassCard — Content card with Glass 2 material.
 * 
 * Applies glass-card treatment (78% opacity, blur 20px).
 * Auto-adapts to Day/Night through CSS variables.
 * 
 * @example
 * <GlassCard>
 *   <h3 className="text-foreground">Upcoming Booking</h3>
 *   <p className="text-muted-foreground">Villa details</p>
 * </GlassCard>
 */
export function GlassCard({
  children,
  className,
  noHover = false,
  gold = false,
  compact = false,
  ...props
}: GlassCardProps) {
  return (
    <div
      className={cn(
        'glass-card',
        compact ? 'p-4' : 'p-6',
        noHover && 'hover:transform-none hover:shadow-[var(--shadow-card)]',
        gold && 'glass-gold',
        className,
      )}
      {...props}
    >
      {children}
    </div>
  );
}
