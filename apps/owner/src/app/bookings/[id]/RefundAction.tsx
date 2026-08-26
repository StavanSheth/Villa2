'use client';

import React, { useState } from 'react';
import { RefreshCw, CheckCircle, AlertCircle, X, Zap, Landmark } from 'lucide-react';
import { useRouter } from 'next/navigation';

export function RefundAction({ bookingId, refundAmount, hasRefundedEvent }: { bookingId: string, refundAmount: number, hasRefundedEvent: boolean }) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [refundMethod, setRefundMethod] = useState<'gateway' | 'manual'>('gateway');
  const router = useRouter();

  const handleRefund = async () => {
    try {
      setLoading(true);
      setError(null);
      // In a real implementation, you would pass the refundMethod to the API
      const res = await fetch(`/api/bookings/${bookingId}/refund`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount: refundAmount, method: refundMethod })
      });

      if (!res.ok) {
        throw new Error('Failed to process refund');
      }

      setIsModalOpen(false);
      router.refresh();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  if (refundAmount <= 0) return null;

  if (hasRefundedEvent) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-green-500/10 text-green-400 border border-green-500/20 rounded-lg">
        <CheckCircle size={18} />
        <span className="font-medium text-sm">Refund Processed (₹{refundAmount.toLocaleString()})</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-2">
        <button
          onClick={() => setIsModalOpen(true)}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-red-500/20 text-red-400 border border-red-500/30 rounded-lg hover:bg-red-500/30 transition-colors font-medium text-sm disabled:opacity-50"
        >
          {loading ? <RefreshCw size={18} className="animate-spin" /> : <AlertCircle size={18} />}
          Initiate Refund (₹{refundAmount.toLocaleString()})
        </button>
        {error && <span className="text-red-400 text-xs">{error}</span>}
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-card p-4">
          <div className="bg-[#18181b] border border-zinc-800 rounded-xl w-full max-w-lg shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-5 border-b border-zinc-800/60">
              <h2 className="text-xl font-bold text-foreground font-serif">Refund & Settlement Method</h2>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="text-zinc-400 hover:text-foreground transition-colors p-1"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 flex flex-col gap-5">
              <p className="text-zinc-300 text-sm">
                Select how you wish to issue the refund for booking <span className="text-[#f5c518] font-semibold">{bookingId}</span>:
              </p>

              <div className="flex flex-col gap-3">
                <button
                  onClick={() => setRefundMethod('gateway')}
                  className={`flex items-start gap-4 p-4 rounded-lg border text-left transition-all ${
                    refundMethod === 'gateway' 
                      ? 'border-[#f5c518] bg-[#f5c518]/5' 
                      : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800'
                  }`}
                >
                  <div className="mt-1">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      refundMethod === 'gateway' ? 'border-[#f5c518]' : 'border-zinc-500'
                    }`}>
                      {refundMethod === 'gateway' && <div className="w-2 h-2 rounded-full bg-[#f5c518]" />}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 font-bold text-foreground text-base">
                      <Zap size={18} className="text-orange-400 fill-orange-400/20" />
                      Payment Gateway (Razorpay API)
                    </div>
                    <p className="text-zinc-400 text-sm mt-1">
                      Automated refund directly to original source account/card.
                    </p>
                  </div>
                </button>

                <button
                  onClick={() => setRefundMethod('manual')}
                  className={`flex items-start gap-4 p-4 rounded-lg border text-left transition-all ${
                    refundMethod === 'manual' 
                      ? 'border-[#f5c518] bg-[#f5c518]/5' 
                      : 'border-zinc-800 bg-zinc-900/50 hover:bg-zinc-800'
                  }`}
                >
                  <div className="mt-1">
                    <div className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                      refundMethod === 'manual' ? 'border-[#f5c518]' : 'border-zinc-500'
                    }`}>
                      {refundMethod === 'manual' && <div className="w-2 h-2 rounded-full bg-[#f5c518]" />}
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center gap-2 font-bold text-foreground text-base">
                      <Landmark size={18} className="text-zinc-300" />
                      Manual Bank / UPI Settlement
                    </div>
                    <p className="text-zinc-400 text-sm mt-1">
                      Manual transfer by owner with reference tracking number.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <div className="p-5 border-t border-zinc-800 flex justify-end gap-3 bg-zinc-900/30">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 text-foreground font-medium text-sm transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                onClick={handleRefund}
                disabled={loading}
                className="px-5 py-2.5 rounded-lg bg-red-600 hover:bg-red-700 text-foreground font-medium text-sm transition-colors flex items-center gap-2 disabled:opacity-50"
              >
                {loading && <RefreshCw size={16} className="animate-spin" />}
                Confirm & Process Refund
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
