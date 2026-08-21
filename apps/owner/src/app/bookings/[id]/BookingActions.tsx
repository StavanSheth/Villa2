'use client';
import React, { useState } from 'react';
import { Edit, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function BookingActions({ 
  bookingCode, 
  status,
  initialCheckIn,
  initialCheckOut,
  initialGuests,
  initialServices = []
}: { 
  bookingCode: string; 
  status: string;
  initialCheckIn?: string;
  initialCheckOut?: string;
  initialGuests?: number;
  initialServices?: { serviceId: string; name?: string; quantity: number }[];
}) {
  const router = useRouter();
  const [isProcessing, setIsProcessing] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [refundMethod, setRefundMethod] = useState<'GATEWAY' | 'MANUAL'>('GATEWAY');
  const [txnRef, setTxnRef] = useState('');

  const handleCancel = async () => {
    if (status === 'CANCELLED') return;
    setShowRefundModal(true);
  };

  const executeCancellation = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/bookings/${bookingCode}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'CANCEL',
          actorRole: 'OWNER',
          metadata: {
            settlementMethod: refundMethod,
            manualTxnRef: refundMethod === 'MANUAL' ? txnRef : undefined,
            settledAt: new Date().toISOString()
          }
        })
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
      
      setShowRefundModal(false);
      alert(`Booking cancelled! Refund executed via ${refundMethod === 'GATEWAY' ? 'Razorpay Payment Gateway' : 'Manual Transfer'}.`);
      router.refresh();
    } catch (err: any) {
      alert(err.message || 'Error executing cancellation');
    } finally {
      setIsProcessing(false);
    }
  };

  const isCancelled = status === 'CANCELLED';

  return (
    <>
      <div className="flex gap-3">
        <button 
          disabled={isCancelled || isProcessing}
          onClick={() => alert('Edit dates feature coming soon')}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-sm transition ${isCancelled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gold hover:text-gold cursor-pointer'}`}
        >
          <Edit className="w-4 h-4" />
          Edit Dates
        </button>
        <button 
          disabled={isCancelled || isProcessing}
          onClick={handleCancel}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm transition ${isCancelled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-red-500/20 cursor-pointer'}`}
        >
          <XCircle className="w-4 h-4" />
          {isProcessing ? 'Processing...' : 'Cancel Booking'}
        </button>
      </div>

      {/* Owner Refund Selection Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#18181b] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-white/10 pb-4">
              <h3 className="text-xl font-bold text-white">Refund & Settlement Method</h3>
              <button onClick={() => setShowRefundModal(false)} className="text-white/50 hover:text-white">✕</button>
            </div>

            <p className="text-sm text-white/70">
              Select how you wish to issue the refund for booking <span className="font-mono text-gold font-bold">{bookingCode}</span>:
            </p>

            <div className="space-y-3">
              <label 
                onClick={() => setRefundMethod('GATEWAY')}
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${refundMethod === 'GATEWAY' ? 'bg-gold/10 border-gold text-white' : 'bg-white/5 border-white/10 text-white/60'}`}
              >
                <input type="radio" checked={refundMethod === 'GATEWAY'} onChange={() => setRefundMethod('GATEWAY')} className="mt-1" />
                <div>
                  <div className="font-bold text-sm text-white">⚡ Payment Gateway (Razorpay API)</div>
                  <div className="text-xs text-white/50">Automated refund directly to original source account/card.</div>
                </div>
              </label>

              <label 
                onClick={() => setRefundMethod('MANUAL')}
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${refundMethod === 'MANUAL' ? 'bg-gold/10 border-gold text-white' : 'bg-white/5 border-white/10 text-white/60'}`}
              >
                <input type="radio" checked={refundMethod === 'MANUAL'} onChange={() => setRefundMethod('MANUAL')} className="mt-1" />
                <div>
                  <div className="font-bold text-sm text-white">🏦 Manual Bank / UPI Settlement</div>
                  <div className="text-xs text-white/50">Manual transfer by owner with reference tracking number.</div>
                </div>
              </label>

              {refundMethod === 'MANUAL' && (
                <div className="pt-2">
                  <label className="block text-xs uppercase text-white/60 font-semibold mb-1">Transaction Ref / UTR No.</label>
                  <input
                    type="text"
                    value={txnRef}
                    onChange={(e) => setTxnRef(e.target.value)}
                    placeholder="e.g. UTR-98218392183"
                    className="w-full bg-white/5 border border-white/10 rounded-lg p-2.5 text-sm text-white focus:outline-none focus:border-gold"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <button
                onClick={() => setShowRefundModal(false)}
                className="px-4 py-2 bg-white/10 text-white/70 text-sm font-medium rounded-lg hover:bg-white/20"
              >
                Cancel
              </button>
              <button
                disabled={isProcessing}
                onClick={executeCancellation}
                className="px-5 py-2 bg-red-600 text-white font-semibold text-sm rounded-lg hover:bg-red-500 transition shadow-lg disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Confirm & Process Refund'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
