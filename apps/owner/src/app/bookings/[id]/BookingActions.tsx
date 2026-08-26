'use client';
import React, { useState } from 'react';
import { Edit, XCircle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Trash2 } from 'lucide-react';

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
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [refundMethod, setRefundMethod] = useState<'GATEWAY' | 'MANUAL'>('GATEWAY');
  const [txnRef, setTxnRef] = useState('');

  const handleDelete = async () => {
    setShowDeleteModal(true);
  };

  const executeDelete = async () => {
    setIsProcessing(true);
    try {
      const res = await fetch(`/api/bookings/${bookingCode}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
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
      
      setShowDeleteModal(false);
      alert('Booking and all associated logs deleted entirely.');
      router.push('/bookings');
    } catch (err: any) {
      alert(err.message || 'Error deleting booking');
    } finally {
      setIsProcessing(false);
    }
  };

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
          onClick={() => router.push(`/bookings/${bookingCode}/edit`)}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-muted border border-border text-sm transition ${isCancelled ? 'opacity-50 cursor-not-allowed' : 'hover:border-gold hover:text-gold cursor-pointer'}`}
        >
          <Edit className="w-4 h-4" />
          Edit Booking
        </button>
        <button 
          disabled={isCancelled || isProcessing}
          onClick={handleCancel}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400 text-sm transition ${isCancelled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-orange-500/20 cursor-pointer'}`}
        >
          <XCircle className="w-4 h-4" />
          {isProcessing ? 'Processing...' : 'Cancel Booking'}
        </button>
        <button 
          disabled={isProcessing}
          onClick={handleDelete}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20 text-red-400 text-sm transition hover:bg-red-500/20 cursor-pointer`}
        >
          <Trash2 className="w-4 h-4" />
          Delete Logs & Order
        </button>
      </div>

      {/* Owner Refund Selection Modal */}
      {showRefundModal && (
        <div className="fixed inset-0 bg-card backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#18181b] border border-border rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-border pb-4">
              <h3 className="text-xl font-bold text-foreground">Refund & Settlement Method</h3>
              <button onClick={() => setShowRefundModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <p className="text-sm text-muted-foreground">
              Select how you wish to issue the refund for booking <span className="font-mono text-gold font-bold">{bookingCode}</span>:
            </p>

            <div className="space-y-3">
              <label 
                onClick={() => setRefundMethod('GATEWAY')}
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${refundMethod === 'GATEWAY' ? 'bg-gold/10 border-gold text-foreground' : 'bg-muted border-border text-muted-foreground'}`}
              >
                <input type="radio" checked={refundMethod === 'GATEWAY'} onChange={() => setRefundMethod('GATEWAY')} className="mt-1" />
                <div>
                  <div className="font-bold text-sm text-foreground">⚡ Payment Gateway (Razorpay API)</div>
                  <div className="text-xs text-muted-foreground">Automated refund directly to original source account/card.</div>
                </div>
              </label>

              <label 
                onClick={() => setRefundMethod('MANUAL')}
                className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition ${refundMethod === 'MANUAL' ? 'bg-gold/10 border-gold text-foreground' : 'bg-muted border-border text-muted-foreground'}`}
              >
                <input type="radio" checked={refundMethod === 'MANUAL'} onChange={() => setRefundMethod('MANUAL')} className="mt-1" />
                <div>
                  <div className="font-bold text-sm text-foreground">🏦 Manual Bank / UPI Settlement</div>
                  <div className="text-xs text-muted-foreground">Manual transfer by owner with reference tracking number.</div>
                </div>
              </label>

              {refundMethod === 'MANUAL' && (
                <div className="pt-2">
                  <label className="block text-xs uppercase text-muted-foreground font-semibold mb-1">Transaction Ref / UTR No.</label>
                  <input
                    type="text"
                    value={txnRef}
                    onChange={(e) => setTxnRef(e.target.value)}
                    placeholder="e.g. UTR-98218392183"
                    className="w-full bg-muted border border-border rounded-lg p-2.5 text-sm text-foreground focus:outline-none focus:border-gold"
                  />
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-border">
              <button
                onClick={() => setShowRefundModal(false)}
                className="px-4 py-2 bg-muted text-muted-foreground text-sm font-medium rounded-lg hover:bg-muted"
              >
                Cancel
              </button>
              <button
                disabled={isProcessing}
                onClick={executeCancellation}
                className="px-5 py-2 bg-red-600 text-foreground font-semibold text-sm rounded-lg hover:bg-red-500 transition shadow-lg disabled:opacity-50"
              >
                {isProcessing ? 'Processing...' : 'Confirm & Process Refund'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-card backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="bg-[#18181b] border border-red-500/30 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-6">
            <div className="flex justify-between items-center border-b border-red-500/20 pb-4">
              <h3 className="text-xl font-bold text-red-400 flex items-center gap-2">
                <Trash2 className="w-5 h-5" /> Delete Entire Order
              </h3>
              <button onClick={() => setShowDeleteModal(false)} className="text-muted-foreground hover:text-foreground">✕</button>
            </div>

            <p className="text-sm text-muted-foreground">
              Are you sure you want to permanently delete the booking <span className="font-mono font-bold text-red-400">{bookingCode}</span> and all associated logs?
            </p>
            <p className="text-xs text-red-400/80 bg-red-500/10 p-3 rounded-lg border border-red-500/20">
              Warning: This action is irreversible. All transactions, audit logs, and guest details for this order will be permanently removed from the database.
            </p>

            <div className="flex justify-end gap-3 pt-4 border-t border-red-500/20">
              <button
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-muted text-muted-foreground text-sm font-medium rounded-lg hover:bg-muted"
              >
                Cancel
              </button>
              <button
                disabled={isProcessing}
                onClick={executeDelete}
                className="px-5 py-2 bg-red-600 text-foreground font-semibold text-sm rounded-lg hover:bg-red-500 transition shadow-lg disabled:opacity-50"
              >
                {isProcessing ? 'Deleting...' : 'Yes, Delete Entirely'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
