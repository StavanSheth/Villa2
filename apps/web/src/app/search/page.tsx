import React from 'react';
import { Search, Filter } from 'lucide-react';

export default function WebSearchPage() {
  return (
    <div className="min-h-screen bg-[#111111] text-white p-8 space-y-6">
      <h1 className="text-3xl font-serif text-[#D4AF37]">Search Luxury Villas</h1>
      <div className="flex gap-4">
        <input type="text" placeholder="Search by location, villa name..." className="flex-1 px-4 py-3 bg-black/60 border border-white/10 rounded-lg text-sm text-white" />
        <button className="bg-[#D4AF37] text-black font-semibold px-6 py-3 rounded-lg">Search</button>
      </div>
    </div>
  );
}
