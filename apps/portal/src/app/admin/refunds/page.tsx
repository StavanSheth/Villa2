import React from 'react';
import { CreditCard, Check, X, AlertTriangle } from 'lucide-react';

export default function RefundsPage() {
  const refunds = [
    { id: "ref-01", bookingId: "MVN-2026-893", guest: "Siddharth Rao", amount: "₹45,000", reason: "Medical emergency cancellation", status: "PENDING_APPROVAL" }
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-serif text-white">Refund Management</h1>
        <p className="text-sm text-white/50 mt-1">Review, approve, and execute customer refund requests</p>
      </div>

      <div className="bg-black/60 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-white/80">
          <thead className="bg-white/5 text-xs text-white/40 uppercase border-b border-white/10">
            <tr>
              <th className="px-6 py-4">Booking Ref</th>
              <th className="px-6 py-4">Guest</th>
              <th className="px-6 py-4">Amount</th>
              <th className="px-6 py-4">Reason</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {refunds.map((r) => (
              <tr key={r.id} className="hover:bg-white/5 transition">
                <td className="px-6 py-4 font-mono font-medium text-primary">{r.bookingId}</td>
                <td className="px-6 py-4 font-medium text-white">{r.guest}</td>
                <td className="px-6 py-4 font-mono font-semibold text-white">{r.amount}</td>
                <td className="px-6 py-4 text-white/60">{r.reason}</td>
                <td className="px-6 py-4 text-right space-x-2">
                  <button className="text-xs px-3 py-1.5 bg-green-500/20 text-green-400 font-semibold rounded hover:bg-green-500/30 transition">Approve</button>
                  <button className="text-xs px-3 py-1.5 bg-red-500/20 text-red-400 font-semibold rounded hover:bg-red-500/30 transition">Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
