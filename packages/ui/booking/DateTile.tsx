'use client';
import React from 'react';

export type DateStatus = 
  | 'AVAILABLE'
  | 'SELECTED'
  | 'BOOKED'
  | 'MAINTENANCE'
  | 'BLOCKED'
  | 'OWNER_BOOKING'
  | 'HOLIDAY'
  | 'PENDING_PAYMENT'
  | 'PAST'
  | 'PEAK'
  | 'IN_RANGE';

interface DateTileProps {
  date: Date;
  status: DateStatus;
  price?: number;
  isToday?: boolean;
  minStay?: number;
  label?: string;       // Optional label for owner calendar (e.g., "Maintenance", "VIP")
  onClick: (date: Date) => void;
  onMouseEnter?: (date: Date) => void;
  isStartOrEnd?: boolean;
}

const statusColors: Record<DateStatus, string> = {
  AVAILABLE:       'bg-green-500/20 border-green-500/30 text-green-700 dark:text-green-300 hover:bg-green-500/40 hover:border-green-500/50',
  SELECTED:        'bg-emerald-600 border-emerald-400 text-white shadow-[0_0_15px_rgba(16,185,129,0.5)]',
  IN_RANGE:        'bg-emerald-500/40 border-emerald-500/50 text-emerald-900 dark:text-emerald-100',
  BOOKED:          'bg-red-500/20 border-red-500/30 text-red-700 dark:text-red-300 opacity-50 cursor-not-allowed',
  MAINTENANCE:     'bg-yellow-500/20 border-yellow-500/30 text-yellow-700 dark:text-yellow-300 opacity-50 cursor-not-allowed',
  BLOCKED:         'bg-neutral-500/20 border-neutral-500/30 text-neutral-700 dark:text-neutral-400 opacity-50 cursor-not-allowed',
  OWNER_BOOKING:   'bg-emerald-700/30 border-emerald-500/40 text-emerald-700 dark:text-emerald-300 opacity-60 cursor-not-allowed',
  HOLIDAY:         'bg-purple-500/20 border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-500/40 hover:border-purple-500/50',
  PENDING_PAYMENT: 'bg-orange-500/20 border-orange-500/30 text-orange-700 dark:text-orange-300 opacity-60 cursor-not-allowed',
  PAST:            'bg-muted border-border text-muted-foreground cursor-not-allowed',
  PEAK:            'bg-purple-500/20 border-purple-500/30 text-purple-700 dark:text-purple-300 hover:bg-purple-500/40 hover:border-purple-500/50',
};

// Status labels for tooltip display
const statusLabels: Partial<Record<DateStatus, string>> = {
  MAINTENANCE:     'Maintenance',
  BLOCKED:         'Blocked',
  OWNER_BOOKING:   'Owner Booking',
  HOLIDAY:         'Holiday',
  PENDING_PAYMENT: 'Pending Payment',
  BOOKED:          'Booked',
};

export const DateTile: React.FC<DateTileProps> = ({ 
  date, 
  status, 
  price, 
  isToday, 
  label,
  onClick, 
  onMouseEnter,
  isStartOrEnd 
}) => {
  const dayNumber = date.getDate();
  const isSelectable = status === 'AVAILABLE' || status === 'PEAK' || status === 'SELECTED' || status === 'IN_RANGE' || status === 'HOLIDAY';
  const isClickable = isSelectable || status === 'BOOKED' || status === 'OWNER_BOOKING' || status === 'MAINTENANCE' || status === 'PENDING_PAYMENT';
  
  return (
    <div className="relative group">
      <button
        type="button"
        disabled={!isClickable}
        onClick={() => isClickable && onClick(date)}
        onMouseEnter={() => isSelectable && onMouseEnter && onMouseEnter(date)}
        className={`
          w-full aspect-square rounded-xl border flex flex-col items-center justify-center transition-all duration-300
          ${statusColors[status]}
          ${isStartOrEnd ? 'scale-105 shadow-[0_0_20px_rgba(16,185,129,0.4)] z-10' : 'scale-100'}
        `}
      >
        <span className="text-lg font-medium">{dayNumber}</span>
        {price && isSelectable && (
          <span className="text-[9px] opacity-70">₹{price / 1000}k</span>
        )}
        {/* Show status indicator dot for non-selectable states with entries */}
        {label && !isSelectable && (
          <span className="text-[7px] mt-0.5 truncate max-w-full px-1 opacity-80">{label}</span>
        )}
      </button>

      {/* Hover Tooltip (Glassmorphism) */}
      {isSelectable && status !== 'SELECTED' && status !== 'IN_RANGE' && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-2 bg-card backdrop-blur-md border border-border rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 shadow-xl">
          <div className="flex flex-col items-center text-center">
            <span className="text-sm font-bold text-foreground">₹{price?.toLocaleString('en-IN')}</span>
            <span className="text-[10px] text-muted-foreground">Per Night</span>
            {status === 'PEAK' && <span className="text-[10px] text-purple-400 font-medium mt-1">Weekend Pricing</span>}
            {status === 'HOLIDAY' && <span className="text-[10px] text-purple-400 font-medium mt-1">Holiday Pricing</span>}
          </div>
          {/* Tooltip Arrow */}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black/80"></div>
        </div>
      )}

      {/* Non-selectable status tooltip */}
      {!isSelectable && statusLabels[status] && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max px-3 py-2 bg-card backdrop-blur-md border border-border rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-50 shadow-xl">
          <div className="flex flex-col items-center text-center">
            <span className="text-xs font-medium text-foreground">{label || statusLabels[status]}</span>
          </div>
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-black/80"></div>
        </div>
      )}
    </div>
  );
};
