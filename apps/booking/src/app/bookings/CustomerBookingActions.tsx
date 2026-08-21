'use client';
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

export function CustomerBookingActions({ bookingCode, status }: { bookingCode: string, status: string }) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);

  const handleCancel = async () => {
    if (status === 'CANCELLED') return;
    if (!confirm('Are you sure you want to cancel your reservation? This action cannot be undone.')) return;
    
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/bookings/${bookingCode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'CANCEL', actorRole: 'CUSTOMER' })
      });
      
      if (!res.ok) {
        const contentType = res.headers.get('content-type');
        let errorMsg = `Server error (${res.status})`;
        if (contentType && contentType.includes('application/json')) {
          const data = await res.json();
          errorMsg = data.error || errorMsg;
        }
        throw new Error(errorMsg);
      }
      
      alert('Reservation cancelled successfully');
      router.refresh();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsProcessing(false);
    }
  };

  const isCancelled = status === 'CANCELLED';

  return (
    <div className="flex flex-wrap gap-2 mt-auto">
      <Link href={`/bookings/${bookingCode}`} className="px-4 py-2 bg-white/10 border border-white/20 rounded-lg text-sm font-medium hover:bg-white/20 transition text-white">
        View Details & Invoice
      </Link>
      <button onClick={() => alert('Review functionality coming soon')} className="px-4 py-2 border border-[#D4AF37] text-[#D4AF37] rounded-lg text-sm font-medium hover:bg-[#D4AF37]/10 transition cursor-pointer">
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
