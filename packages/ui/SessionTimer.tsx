'use client';

import React, { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { cn } from '@villa-platform/design-system';

export function SessionTimer() {
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const SESSION_DURATION = 45 * 60; // 45 minutes in seconds

  useEffect(() => {
    // Function to get the session_start cookie
    const getSessionStart = () => {
      const match = document.cookie.match(/(^| )session_start=([^;]+)/);
      if (match) {
        return parseInt(match[2], 10);
      }
      return null;
    };

    const calculateTimeLeft = () => {
      const sessionStart = getSessionStart();
      if (!sessionStart) return null;

      const now = Date.now();
      const elapsedSeconds = Math.floor((now - sessionStart) / 1000);
      const remaining = Math.max(0, SESSION_DURATION - elapsedSeconds);
      return remaining;
    };

    // Initial calculation
    setTimeLeft(calculateTimeLeft());

    // Update every second
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  if (timeLeft === null) {
    return null; // Not logged in or no session start tracked
  }

  // Only show warning if less than 5 minutes remain
  const showWarning = timeLeft <= 5 * 60;

  if (!showWarning) {
    return null;
  }

  const minutes = Math.floor(timeLeft / 60);
  const seconds = timeLeft % 60;
  const timeString = `${minutes}:${seconds.toString().padStart(2, '0')}`;

  const isCritical = timeLeft <= 60; // Less than 1 minute

  return (
    <div 
      className={cn(
        "flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold animate-fade-in shadow-sm border",
        isCritical 
          ? "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30 animate-pulse" 
          : "bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/30"
      )}
    >
      <Clock className="w-3.5 h-3.5" />
      <span>Session expires in {timeString}</span>
    </div>
  );
}
