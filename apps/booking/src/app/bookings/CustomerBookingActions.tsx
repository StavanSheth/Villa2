'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { cancelBooking } from '../actions';

export function CustomerBookingActions({ bookingCode, status }: { bookingCode: string, status: string }) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCancel = async () => {
    if (status === 'CANCELLED') return;
    if (!confirm('Are you sure you want to cancel your reservation? This action cannot be undone.')) return;
    
    setIsProcessing(true);
    try {
      await cancelBooking(bookingCode);
      alert('Reservation cancelled successfully');
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Failed to cancel reservation');
    } finally {
      setIsProcessing(false);
    }
  };

  const isCancelled = status === 'CANCELLED';

  return (
    <div className="flex flex-wrap gap-2 mt-auto">
      <Link href={`/bookings/${bookingCode}`} className="px-4 py-2 bg-muted border border-border rounded-lg text-sm font-medium hover:bg-muted transition text-foreground">
        View Details & Invoice
      </Link>
      <button onClick={() => alert('Review functionality coming soon')} className="px-4 py-2 border border-primary text-primary rounded-lg text-sm font-medium hover:bg-primary/10 transition cursor-pointer">
        Leave Review
      </button>
      {!isCancelled && (
        <button 
          disabled={isProcessing}
          onClick={handleCancel}
          className="px-4 py-2 border border-red-500/40 text-red-400 rounded-lg text-sm font-medium hover:bg-red-500/10 transition cursor-pointer disabled:opacity-50"
        >
          {isProcessing ? 'Processing...' : 'Cancel Reservation'}
        </button>
      )}
    </div>
  );
}
