import React from 'react';
import { Users, Search, Star, Mail, Phone, Calendar } from 'lucide-react';

export default function CustomersPage() {
  const customers = [
    { id: "c-01", name: "Rahul Sharma", email: "rahul@example.com", phone: "+91 99887 76655", totalStays: 4, spent: "₹3,40,000", rating: 5.0 },
    { id: "c-02", name: "Priya Patel", email: "priya@example.com", phone: "+91 98765 43210", totalStays: 2, spent: "₹1,80,000", rating: 4.8 },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-2xl font-serif text-white">Customer Database</h1>
        <p className="text-sm text-white/50 mt-1">Guest profiles, stay history, and lifetime value</p>
      </div>

      <div className="bg-black/60 border border-white/10 rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm text-white/80">
          <thead className="bg-white/5 text-xs text-white/40 uppercase border-b border-white/10">
            <tr>
              <th className="px-6 py-4">Customer</th>
              <th className="px-6 py-4">Contact</th>
              <th className="px-6 py-4">Total Stays</th>
              <th className="px-6 py-4">Total Spent</th>
              <th className="px-6 py-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {customers.map((c) => (
              <tr key={c.id} className="hover:bg-white/5 transition">
                <td className="px-6 py-4 font-medium text-white">{c.name}</td>
                <td className="px-6 py-4 text-white/60">
                  <p>{c.email}</p>
                  <p className="text-xs text-white/40">{c.phone}</p>
                </td>
                <td className="px-6 py-4 text-white/90">{c.totalStays} stays</td>
                <td className="px-6 py-4 font-mono font-semibold text-primary">{c.spent}</td>
                <td className="px-6 py-4 text-right">
                  <button className="text-xs px-3 py-1.5 bg-white/10 rounded hover:bg-white/20 transition">View Profile</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
