import React from 'react';
import { Tag, Plus, Calendar, Percent, IndianRupee } from 'lucide-react';

export default function PricingRulesPage() {
  const coupons = [
    { code: "MAVONLUX2026", discount: "15% OFF", validTill: "Dec 31, 2026", usage: "45 used" },
    { code: "SUMMERVILLA", discount: "₹5,000 OFF", validTill: "Aug 31, 2026", usage: "112 used" },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-white">Dynamic Pricing & Coupons</h1>
          <p className="text-sm text-white/50 mt-1">Configure seasonal price multipliers, weekend rates, and promotional coupons</p>
        </div>
        <button className="flex items-center gap-2 bg-[#D4AF37] text-black font-semibold px-4 py-2.5 rounded-lg hover:bg-[#b8952b] transition">
          <Plus className="w-4 h-4" /> Create Coupon Code
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {coupons.map((c) => (
          <div key={c.code} className="bg-black/60 border border-white/10 p-5 rounded-xl flex items-center justify-between">
            <div>
              <div className="flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#D4AF37]" />
                <h3 className="font-mono font-bold text-white">{c.code}</h3>
              </div>
              <p className="text-sm text-green-400 font-semibold mt-1">{c.discount}</p>
              <p className="text-xs text-white/40 mt-0.5">Valid until {c.validTill} • {c.usage}</p>
            </div>
            <button className="text-xs px-3 py-1.5 border border-white/20 text-white rounded hover:bg-white/10">Edit</button>
          </div>
        ))}
      </div>
    </div>
  );
}
