import React from 'react';
import { Search, MapPin, Star } from 'lucide-react';
import Link from 'next/link';

export default function BookingVillasPage() {
  const villas = [
    { id: "v-1", name: "Chunawala's Seven C Villa", price: "₹15,000 / night", rating: 5.0, img: "http://localhost:3000/photos/day/Hero%20page.jpeg" },
  ];

  return (
    <div className="space-y-6 animate-fade-in p-8 bg-[#111111] min-h-screen text-white">
      <h1 className="text-2xl font-serif text-white">Explore Luxury Villas</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {villas.map((v) => (
          <div key={v.id} className="bg-black/60 border border-white/10 rounded-xl overflow-hidden">
            <img src={v.img} alt={v.name} className="w-full h-48 object-cover" />
            <div className="p-4 flex justify-between items-center">
              <div>
                <h3 className="font-semibold text-white">{v.name}</h3>
                <p className="text-xs text-[#D4AF37] font-mono mt-0.5">{v.price}</p>
              </div>
              <Link href="/book" className="bg-[#D4AF37] text-black text-xs font-bold px-4 py-2 rounded-lg hover:bg-[#b8952b] transition">
                Book Now
              </Link>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
