"use client";

import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Filter, X } from 'lucide-react';

export function BookingFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [status, setStatus] = useState(searchParams.get('status') || '');
  const [paymentType, setPaymentType] = useState(searchParams.get('paymentType') || '');
  const [dateStart, setDateStart] = useState(searchParams.get('dateStart') || '');
  const [dateEnd, setDateEnd] = useState(searchParams.get('dateEnd') || '');

  // Keep local state in sync with URL changes
  useEffect(() => {
    setStatus(searchParams.get('status') || '');
    setPaymentType(searchParams.get('paymentType') || '');
    setDateStart(searchParams.get('dateStart') || '');
    setDateEnd(searchParams.get('dateEnd') || '');
  }, [searchParams]);

  const handleApply = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    
    if (status) params.set('status', status);
    if (paymentType) params.set('paymentType', paymentType);
    if (dateStart) params.set('dateStart', dateStart);
    if (dateEnd) params.set('dateEnd', dateEnd);

    router.push(`/bookings?${params.toString()}`);
  };

  const handleClear = () => {
    setStatus('');
    setPaymentType('');
    setDateStart('');
    setDateEnd('');
    router.push('/bookings');
  };

  const hasActiveFilters = Boolean(status || paymentType || dateStart || dateEnd);

  return (
    <form onSubmit={handleApply} className="bg-muted border border-border rounded-xl p-4 mb-6 flex flex-wrap gap-4 items-end">
      
      <div className="flex-1 min-w-[150px]">
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Status</label>
        <select 
          value={status}
          onChange={e => setStatus(e.target.value)}
          className="w-full bg-card border border-border rounded-lg p-2 text-sm text-foreground focus:outline-none focus:border-gold"
        >
          <option value="">All Statuses</option>
          <option value="NEW">New</option>
          <option value="AWAITING_PAYMENT">Awaiting Payment</option>
          <option value="ADVANCE_PAID">Advance Paid</option>
          <option value="CONFIRMED">Confirmed</option>
          <option value="PARTIALLY_CANCELLED">Partially Cancelled</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="REFUNDED">Refunded</option>
        </select>
      </div>

      <div className="flex-1 min-w-[150px]">
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Payment Type</label>
        <select 
          value={paymentType}
          onChange={e => setPaymentType(e.target.value)}
          className="w-full bg-card border border-border rounded-lg p-2 text-sm text-foreground focus:outline-none focus:border-gold"
        >
          <option value="">All Payments</option>
          <option value="CARD">Credit/Debit Card</option>
          <option value="UPI">UPI</option>
          <option value="BANK_TRANSFER">Bank Transfer</option>
          <option value="CASH">Cash</option>
        </select>
      </div>

      <div className="flex-1 min-w-[150px]">
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Start Date (Check-in)</label>
        <input 
          type="date" 
          value={dateStart}
          onChange={e => setDateStart(e.target.value)}
          className="w-full bg-card border border-border rounded-lg p-2 text-sm text-foreground focus:outline-none focus:border-gold"
        />
      </div>

      <div className="flex-1 min-w-[150px]">
        <label className="block text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">End Date (Check-in)</label>
        <input 
          type="date" 
          value={dateEnd}
          onChange={e => setDateEnd(e.target.value)}
          className="w-full bg-card border border-border rounded-lg p-2 text-sm text-foreground focus:outline-none focus:border-gold"
        />
      </div>

      <div className="flex gap-2">
        <button 
          type="submit"
          className="flex items-center gap-2 bg-gold/10 hover:bg-gold/20 text-gold border border-gold/30 px-4 py-2 rounded-lg text-sm font-semibold transition"
        >
          <Filter size={16} /> Filter
        </button>
        {hasActiveFilters && (
          <button 
            type="button"
            onClick={handleClear}
            className="flex items-center gap-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 px-4 py-2 rounded-lg text-sm font-semibold transition"
          >
            <X size={16} /> Clear
          </button>
        )}
      </div>
    </form>
  );
}
