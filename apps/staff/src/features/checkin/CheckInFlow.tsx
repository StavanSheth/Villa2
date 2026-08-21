'use client';

import React, { useState, useEffect } from 'react';

// Assuming we have a React Query or SWR hook for polling the API
// For the sake of scaffolding, we mock the hook here
function useBookingPoller(bookingId: string) {
  const [booking, setBooking] = useState<{ id: string, status: string, paymentStatus: string, currentTotal: number, advancePaid: number } | null>(null);

  useEffect(() => {
    // Phase 1 MVP: Polling every 15 seconds
    const fetchBooking = async () => {
      try {
        const res = await fetch(`/api/bookings/${bookingId}`);
        if (res.ok && res.headers.get('content-type')?.includes('application/json')) {
          const data = await res.json();
          if (data?.booking) {
            setBooking(data.booking);
            return;
          }
        }
      } catch (err) {
        console.warn('API endpoint unavailable, using mock check-in data:', err);
      }
      
      // Fallback mock booking for demo/testing
      setBooking({
        id: bookingId,
        status: 'CONFIRMED',
        paymentStatus: 'ADVANCE_PAID',
        currentTotal: 35000,
        advancePaid: 20000,
      });
    };

    fetchBooking(); // Initial fetch
    const interval = setInterval(fetchBooking, 15000); // 15s polling
    
    return () => clearInterval(interval);
  }, [bookingId]);

  return { booking };
}

export default function CheckInFlow({ bookingId }: { bookingId: string }) {
  const { booking } = useBookingPoller(bookingId);
  const [offlinePaymentMethod, setOfflinePaymentMethod] = useState<'CASH' | 'UPI'>('CASH');
  const [utrNumber, setUtrNumber] = useState('');

  if (!booking) return <div>Loading booking details...</div>;

  const isFullyPaid = booking.paymentStatus === 'PAID';
  const remainingAmount = booking.currentTotal - booking.advancePaid;

  const handleOfflinePayment = async () => {
    if (offlinePaymentMethod === 'UPI' && !utrNumber) {
      alert("Please enter UTR number for UPI payments.");
      return;
    }

    try {
      const response = await fetch(`/api/payments/offline`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookingId: booking.id,
          method: offlinePaymentMethod,
          utr: utrNumber,
          amount: remainingAmount
        })
      });

      if (response.ok) {
        alert("Payment collected and verified. Proceeding to Check-In.");
        // UI will automatically update on the next 15s poll, or we can optimistic update
      }
    } catch (e) {
      console.error(e);
      alert("Failed to record offline payment.");
    }
  };

  const handleCheckIn = async () => {
    try {
      await fetch(`/api/bookings/${booking.id}/checkin`, { method: 'POST' });
      alert("Check-in successful!");
    } catch (e) {
      console.error(e);
      alert("Failed to check-in.");
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-white rounded-xl shadow-md space-y-4">
      <h2 className="text-2xl font-bold">Check-In: {booking.id}</h2>
      
      <div className="p-4 bg-gray-50 rounded-lg">
        <p><strong>Status:</strong> {booking.status}</p>
        <p><strong>Payment Status:</strong> {booking.paymentStatus}</p>
        <p><strong>Total Amount:</strong> ₹{booking.currentTotal}</p>
        <p><strong>Advance Paid:</strong> ₹{booking.advancePaid}</p>
      </div>

      {isFullyPaid ? (
        <div className="space-y-4">
          <div className="p-4 bg-green-50 text-green-700 rounded-lg border border-green-200">
            Payment is fully settled. No additional payment required.
          </div>
          <button 
            onClick={handleCheckIn}
            className="w-full bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-blue-700 transition"
          >
            Proceed to Check-In
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="p-4 bg-yellow-50 text-yellow-700 rounded-lg border border-yellow-200">
            Remaining amount to collect: <strong>₹{remainingAmount}</strong>
          </div>
          
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">Payment Method</label>
            <select 
              value={offlinePaymentMethod}
              onChange={(e) => setOfflinePaymentMethod(e.target.value as 'CASH' | 'UPI')}
              className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
            </select>
          </div>

          {offlinePaymentMethod === 'UPI' && (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">UTR Number (Required)</label>
              <input 
                type="text" 
                value={utrNumber}
                onChange={(e) => setUtrNumber(e.target.value)}
                className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                placeholder="Enter 12-digit UTR"
              />
            </div>
          )}

          <button 
            onClick={handleOfflinePayment}
            className="w-full bg-green-600 text-white font-semibold py-2 px-4 rounded-lg hover:bg-green-700 transition"
          >
            Collect Payment
          </button>
        </div>
      )}
    </div>
  );
}
