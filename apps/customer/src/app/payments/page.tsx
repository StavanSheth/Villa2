import React from 'react';

export default function PaymentsPage() {
  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-[var(--text-dark)]">Payment History</h1>
          <p className="text-[var(--text-sec-dark)] mt-1">View your transactions, advance payments, and remaining balances.</p>
        </div>
      </div>

      <div className="liquid-glass rounded-2xl overflow-hidden mt-8">
        <div className="p-6 border-b border-white/10 bg-white/5">
          <h2 className="text-lg font-medium text-[var(--text-dark)]">Recent Transactions</h2>
        </div>
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/10">
              <th className="p-4 text-xs font-semibold text-[var(--text-sec-dark)] uppercase tracking-wider">Date</th>
              <th className="p-4 text-xs font-semibold text-[var(--text-sec-dark)] uppercase tracking-wider">Booking Ref</th>
              <th className="p-4 text-xs font-semibold text-[var(--text-sec-dark)] uppercase tracking-wider">Amount</th>
              <th className="p-4 text-xs font-semibold text-[var(--text-sec-dark)] uppercase tracking-wider">Type</th>
              <th className="p-4 text-xs font-semibold text-[var(--text-sec-dark)] uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            <tr className="hover:bg-white/5 transition-colors">
              <td className="p-4 text-sm text-[var(--text-dark)]">Aug 01, 2026</td>
              <td className="p-4 text-sm text-gold font-mono">MVN-2026-891</td>
              <td className="p-4 text-sm text-[var(--text-dark)] font-medium">₹5,000</td>
              <td className="p-4 text-sm text-[var(--text-sec-dark)]">Advance Payment</td>
              <td className="p-4 text-sm">
                <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                  Successful
                </span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
