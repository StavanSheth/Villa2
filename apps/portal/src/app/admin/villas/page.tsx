import React from 'react';
import { Home, Plus, Edit3, Trash2, Eye, MapPin, IndianRupee, Star, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';

export default function VillasPage() {
  const villas = [
    {
      id: "v-01",
      name: "Chunawala's Seven C Villa",
      location: "Lonavala, Maharashtra",
      bedrooms: 5,
      pricePerNight: 15000,
      status: "PUBLISHED",
      rating: 5.0,
      reviewsCount: 124,
      occupancy: "85%",
      imageUrl: "http://localhost:3000/photos/day/Hero%20page.jpeg",
    }
  ];

  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-serif text-white">Villa Portfolio</h1>
          <p className="text-sm text-white/50 mt-1">Manage luxury villas, pricing, and availability status</p>
        </div>
        <button className="flex items-center gap-2 bg-primary text-black font-semibold px-4 py-2.5 rounded-lg hover:bg-[#b8952b] transition">
          <Plus className="w-4 h-4" /> Add New Villa
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {villas.map((villa) => (
          <div key={villa.id} className="bg-black/60 border border-white/10 rounded-xl overflow-hidden hover:border-primary/50 transition group">
            <div className="relative h-48 w-full overflow-hidden bg-white/5">
              <img src={villa.imageUrl} alt={villa.name} className="w-full h-full object-cover group-hover:scale-105 transition duration-500" />
              <span className={`absolute top-3 right-3 text-[11px] font-bold px-2.5 py-1 rounded-full uppercase tracking-wider ${
                villa.status === 'PUBLISHED' ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
              }`}>
                {villa.status}
              </span>
            </div>
            
            <div className="p-5 space-y-3">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className="text-lg font-medium text-white group-hover:text-primary transition">{villa.name}</h2>
                  <p className="text-xs text-white/40 flex items-center gap-1 mt-1">
                    <MapPin className="w-3.5 h-3.5" /> {villa.location} • {villa.bedrooms} Bedrooms
                  </p>
                </div>
                <div className="flex items-center gap-1 text-xs text-amber-400 bg-amber-400/10 px-2 py-1 rounded">
                  <Star className="w-3.5 h-3.5 fill-amber-400" />
                  <span>{villa.rating}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-white/10 flex justify-between items-center text-xs">
                <div>
                  <span className="text-white/40">Rate: </span>
                  <span className="text-white font-mono font-semibold">₹{villa.pricePerNight.toLocaleString('en-IN')}/night</span>
                </div>
                <div>
                  <span className="text-white/40">Occupancy: </span>
                  <span className="text-primary font-semibold">{villa.occupancy}</span>
                </div>
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button className="p-2 text-white/50 hover:text-white hover:bg-white/10 rounded-lg transition" title="View Details">
                  <Eye className="w-4 h-4" />
                </button>
                <button className="p-2 text-white/50 hover:text-primary hover:bg-white/10 rounded-lg transition" title="Edit Villa">
                  <Edit3 className="w-4 h-4" />
                </button>
                <button className="p-2 text-white/50 hover:text-red-400 hover:bg-white/10 rounded-lg transition" title="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
