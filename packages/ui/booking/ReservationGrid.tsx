'use client';
import React, { useState } from 'react';
import { DateTile, DateStatus } from './DateTile';
import { ChevronLeft, ChevronRight, Clock, Calendar as CalendarIcon } from 'lucide-react';
import type { BookingMode, CalendarBookingEntry } from '@villa-platform/types';

interface ReservationGridProps {
  onDateRangeSelect: (start: Date, end: Date, selectedDates?: Date[]) => void;
  mode?: BookingMode;
  bookingEntries?: CalendarBookingEntry[];
  onEntryClick?: (bookingId: string) => void;
  selectedDates?: Date[];
}

// Map CalendarEntryType → DateStatus for rendering
const entryTypeToDateStatus: Record<string, DateStatus> = {
  CUSTOMER:        'BOOKED',
  OWNER:           'OWNER_BOOKING',
  MAINTENANCE:     'MAINTENANCE',
  BLOCKED:         'BLOCKED',
  HOLIDAY:         'HOLIDAY',
  PENDING_PAYMENT: 'PENDING_PAYMENT',
};

export const ReservationGrid: React.FC<ReservationGridProps> = ({
  onDateRangeSelect,
  mode = 'CUSTOMER',
  bookingEntries = [],
  onEntryClick,
  selectedDates = [],
}) => {
  const [currentMonth, setCurrentMonth] = useState(() => {
    if (selectedDates.length > 0) return new Date(selectedDates[0]);
    return new Date();
  });
  const [selectedDateKeys, setSelectedDateKeys] = useState<Set<string>>(() => {
    const keys = new Set<string>();
    selectedDates.forEach(d => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      keys.add(`${y}-${m}-${day}`);
    });
    return keys;
  });
  const [initialSelectedDateKeys] = useState<Set<string>>(() => {
    const keys = new Set<string>();
    selectedDates.forEach(d => {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      keys.add(`${y}-${m}-${day}`);
    });
    return keys;
  });

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const year = currentMonth.getFullYear();
  const month = currentMonth.getMonth();
  const daysInMonth = getDaysInMonth(year, month);
  const firstDay = getFirstDayOfMonth(year, month);
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  /**
   * Find a booking entry that covers a specific date.
   */
  const findEntryForDate = (date: Date): CalendarBookingEntry | undefined => {
    const dateMs = date.getTime();
    const dateStr = formatDateKey(date);
    return bookingEntries.find((entry) => {
      // If the booking has specific selected dates, only match those exact dates
      if (entry.selectedDates && entry.selectedDates.length > 0) {
        return entry.selectedDates.some(d => d.startsWith(dateStr));
      }
      // Otherwise fallback to checkIn and checkOut range logic
      const checkIn = new Date(entry.checkIn);
      checkIn.setHours(0, 0, 0, 0);
      const checkOut = new Date(entry.checkOut);
      checkOut.setHours(0, 0, 0, 0);
      return dateMs >= checkIn.getTime() && dateMs < checkOut.getTime();
    });
  };

  /**
   * Get display status for a calendar date.
   */
  const getStatusForDate = (date: Date): { status: DateStatus; label?: string } => {
    date.setHours(0, 0, 0, 0);
    if (date < today) return { status: 'PAST' };

    // Check real booking entries first
    const entry = findEntryForDate(date);
    if (entry) {
      if (initialSelectedDateKeys.has(formatDateKey(date))) {
        // If it was originally our date, don't show it as blocked by overlapping bookings
        // so the user doesn't get locked out of re-selecting their own date.
      } else {
        const mappedStatus = entryTypeToDateStatus[entry.type] || 'BOOKED';
        return { status: mappedStatus, label: entry.label };
      }
    }


    
    // Peak pricing on weekends
    if (date.getDay() === 0 || date.getDay() === 6) return { status: 'PEAK' };

    return { status: 'AVAILABLE' };
  };

  // Format date key YYYY-MM-DD
  const formatDateKey = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  // Day-by-day click handler (toggles individual days one by one)
  const handleDateClick = (date: Date) => {
    const clickedDate = new Date(date);
    clickedDate.setHours(0, 0, 0, 0);

    const key = formatDateKey(clickedDate);
    const nextSet = new Set(selectedDateKeys);

    // Prevent selecting new dates in the past, but allow deselecting currently selected past dates
    if (clickedDate < today && !nextSet.has(key)) return;

    // In owner mode, check if clicking on an existing booking entry
    if (mode !== 'CUSTOMER' && !nextSet.has(key)) {
      const entry = findEntryForDate(clickedDate);
      if (entry && onEntryClick) {
        onEntryClick(entry.bookingId);
        return;
      }
    }

    // Check if clicked date itself is booked by another entry
    if (findEntryForDate(clickedDate) && !nextSet.has(key) && !initialSelectedDateKeys.has(key)) {
      alert('This date is already booked. Please select available dates.');
      return;
    }

    if (nextSet.has(key)) {
      nextSet.delete(key);
    } else {
      nextSet.add(key);
    }

    setSelectedDateKeys(nextSet);

    // Calculate dates & notify parent
    const sortedDates = Array.from(nextSet)
      .map(k => new Date(k + 'T00:00:00'))
      .sort((a, b) => a.getTime() - b.getTime());

    if (sortedDates.length === 0) {
      onDateRangeSelect(null as any, null as any, []);
    } else {
      const earliestCheckIn = sortedDates[0];
      const latestCheckOut = new Date(sortedDates[sortedDates.length - 1]);
      latestCheckOut.setDate(latestCheckOut.getDate() + 1);
      onDateRangeSelect(earliestCheckIn, latestCheckOut, sortedDates);
    }
  };

  // Compute stay breakdown from selected dates
  const sortedDates = Array.from(selectedDateKeys)
    .map(k => new Date(k + 'T00:00:00'))
    .sort((a, b) => a.getTime() - b.getTime());

  let totalNights = sortedDates.length;
  let totalPrice = 0;

  sortedDates.forEach(d => {
    const isWeekend = d.getDay() === 0 || d.getDay() === 6;
    totalPrice += isWeekend ? 15000 : 10000;
  });

  // Group into contiguous stay segments for exact Check-In / Check-Out timing displays
  const staySegments: { checkIn: Date; checkOut: Date; nights: number }[] = [];
  if (sortedDates.length > 0) {
    let currentStart = sortedDates[0];
    let prev = sortedDates[0];
    let segNights = 1;

    for (let i = 1; i < sortedDates.length; i++) {
      const d = sortedDates[i];
      const diffDays = Math.round((d.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        segNights++;
        prev = d;
      } else {
        const checkOutDate = new Date(prev);
        checkOutDate.setDate(checkOutDate.getDate() + 1);
        staySegments.push({ checkIn: currentStart, checkOut: checkOutDate, nights: segNights });
        currentStart = d;
        prev = d;
        segNights = 1;
      }
    }
    const finalCheckOut = new Date(prev);
    finalCheckOut.setDate(finalCheckOut.getDate() + 1);
    staySegments.push({ checkIn: currentStart, checkOut: finalCheckOut, nights: segNights });
  }

  const handleNextMonth = () => setCurrentMonth(new Date(year, month + 1, 1));
  const handlePrevMonth = () => setCurrentMonth(new Date(year, month - 1, 1));

  const renderGrid = () => {
    const tiles = [];
    const weekdays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    weekdays.forEach((day) => {
      tiles.push(
        <div key={`header-${day}`} className="text-center text-xs font-semibold text-[var(--text-sec-dark)] py-2 uppercase tracking-wider">
          {day}
        </div>
      );
    });

    for (let i = 0; i < firstDay; i++) {
      tiles.push(<div key={`empty-${i}`} className="w-full aspect-square"></div>);
    }

    for (let i = 1; i <= daysInMonth; i++) {
      const date = new Date(year, month, i);
      date.setHours(0, 0, 0, 0);
      
      const { status: dateStatus, label } = getStatusForDate(date);
      const key = formatDateKey(date);
      const isSelected = selectedDateKeys.has(key);
      const status = isSelected ? 'SELECTED' : dateStatus;

      tiles.push(
        <DateTile
          key={`day-${i}`}
          date={date}
          status={status}
          price={status === 'PEAK' || status === 'HOLIDAY' ? 15000 : 10000}
          isToday={date.getTime() === today.getTime()}
          label={label}
          onClick={handleDateClick}
          isStartOrEnd={isSelected}
        />
      );
    }

    return tiles;
  };

  const customerLegend = [
    { color: 'bg-green-500/20 border-green-500/30', label: 'Available' },
    { color: 'bg-emerald-600 border-emerald-400', label: 'Selected' },
    { color: 'bg-purple-500/20 border-purple-500/30', label: 'Peak Price' },
    { color: 'bg-red-500/20 border-red-500/30', label: 'Booked' },
  ];

  const ownerLegend = [
    { color: 'bg-green-500/20 border-green-500/30', label: 'Available' },
    { color: 'bg-red-500/20 border-red-500/30', label: 'Customer Booking' },
    { color: 'bg-emerald-700/30 border-emerald-500/40', label: 'Owner Booking' },
    { color: 'bg-yellow-500/20 border-yellow-500/30', label: 'Maintenance' },
    { color: 'bg-neutral-500/20 border-neutral-500/30', label: 'Blocked' },
    { color: 'bg-purple-500/20 border-purple-500/30', label: 'Holiday' },
    { color: 'bg-blue-500/20 border-blue-500/30', label: 'Today' },
  ];

  const legend = mode === 'CUSTOMER' ? customerLegend : ownerLegend;

  return (
    <div className="w-full max-w-4xl mx-auto liquid-glass rounded-2xl p-6 md:p-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h2 className="text-2xl font-serif text-[var(--text-dark)]">
            {currentMonth.toLocaleString('default', { month: 'long', year: 'numeric' })}
          </h2>
          <p className="text-sm text-[var(--text-sec-dark)] mt-1">
            Click individual dates one by one to select check-in days.
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handlePrevMonth}
            className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-gold transition-colors text-[var(--text-dark)]"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button 
            onClick={handleNextMonth}
            className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 hover:border-gold transition-colors text-[var(--text-dark)]"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-7 gap-2 md:gap-3 relative">
        {renderGrid()}
      </div>

      {/* Check-In / Check-Out Timings Breakdown Banner */}
      {staySegments.length > 0 && (
        <div className="mt-6 p-4 rounded-xl bg-gold/10 border border-gold/30 space-y-3 animate-fade-in">
          <div className="flex justify-between items-center border-b border-gold/20 pb-2">
            <div className="flex items-center gap-2 text-gold font-bold text-sm">
              <CalendarIcon size={16} /> Selected Stay Timings
            </div>
            <div className="text-white font-mono text-sm font-bold">
              {totalNights} {totalNights === 1 ? 'Night' : 'Nights'} • Est. ₹{totalPrice.toLocaleString()}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {staySegments.map((seg, idx) => (
              <div key={idx} className="p-3 bg-black/40 border border-white/10 rounded-lg space-y-1">
                <div className="text-xs text-gold font-semibold uppercase tracking-wider">
                  Stay Segment #{idx + 1} ({seg.nights} {seg.nights === 1 ? 'night' : 'nights'})
                </div>
                <div className="text-xs text-white flex items-center gap-1.5">
                  <Clock size={12} className="text-green-400" />
                  <span className="font-semibold text-green-400">Check-In:</span>
                  <span>{seg.checkIn.toLocaleDateString()} at 12:00 PM</span>
                </div>
                <div className="text-xs text-white flex items-center gap-1.5">
                  <Clock size={12} className="text-red-400" />
                  <span className="font-semibold text-red-400">Check-Out:</span>
                  <span>{seg.checkOut.toLocaleDateString()} at 10:00 AM</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Legend — mode-aware */}
      <div className="mt-8 pt-6 border-t border-white/10 flex flex-wrap gap-4 items-center justify-center text-xs">
        {legend.map(({ color, label }) => (
          <div key={label} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded ${color} border`}></div>
            <span className="text-[var(--text-sec-dark)]">{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};
