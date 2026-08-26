import React from 'react';
import { cn } from '@villa-platform/design-system';

interface GlassModalProps extends React.HTMLAttributes<HTMLDivElement> {
  /** Whether to show the backdrop overlay */
  showBackdrop?: boolean;
}

/**
 * GlassModal — Modal/popover with Glass 3 material (strongest).
 * 
 * Applies glass-floating treatment (62% opacity, blur 28px, saturate 180%).
 * Designed for modals, dialogs, popovers, and floating panels.
 * 
 * @example
 * <GlassModal className="max-w-md mx-auto">
 *   <h2 className="text-foreground text-heading">Confirm Booking</h2>
 *   <p className="text-muted-foreground">...</p>
 *   <button className="btn-primary">Confirm</button>
 * </GlassModal>
 */
export function GlassModal({
  children,
  className,
  showBackdrop = false,
  ...props
}: GlassModalProps) {
  const content = (
    <div
      className={cn('glass-floating p-6', className)}
      role="dialog"
      {...props}
    >
      {children}
    </div>
  );

  if (showBackdrop) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />
        <div className="relative z-10">
          {content}
        </div>
      </div>
    );
  }

  return content;
}
