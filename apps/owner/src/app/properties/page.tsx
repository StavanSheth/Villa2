import React from 'react';
import { prisma } from '@villa-platform/database';
import { Home, Edit, MapPin, Users, BedDouble, Bath, Hotel, Calendar, Banknote, PlusCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { redirect } from 'next/navigation';
import { requireAuth } from '../../lib/auth';

export default async function PropertiesPage() {
  const auth = await requireAuth();
  if (!auth) redirect('/login');

  const villas = await prisma.villa.findMany({
    where: auth.role === 'SUPER_ADMIN' ? {} : { 
      OR: [
        { ownerId: auth.userId },
        { ownerId: null } // allow claiming unassigned properties
      ]
    },
    include: {
      bookings: {
        where: {
          status: { in: ['CONFIRMED', 'ADVANCE_PAID', 'AWAITING_PAYMENT', 'UPCOMING'] },
          checkOut: { gt: new Date() }
        }
      }
    }
  });

  return (
    <div className="space-y-10 animate-fade-in pb-20 max-w-7xl mx-auto px-4 md:px-8 text-foreground min-h-screen">
      
      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-3xl bg-card bg-gradient-to-r from-background via-card to-background border border-border p-8 md:p-12 shadow-2xl">
        <div className="absolute top-0 right-0 p-12 opacity-10 pointer-events-none">
          <Hotel size={200} />
        </div>
        <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
          <div className="max-w-2xl">
            <h1 className="text-4xl md:text-5xl font-serif text-primary mb-4 tracking-tight">Property Portfolio</h1>
            <p className="text-muted-foreground text-lg">Manage your luxury villa inventory, configure settings, and monitor real-time performance metrics across all your properties.</p>
          </div>
          <Link href="/properties/new" className="whitespace-nowrap flex items-center justify-center gap-2 px-6 py-3 bg-primary text-primary-foreground font-bold rounded-xl hover:scale-105 transition-transform shadow-[0_0_20px_rgba(212,175,55,0.3)]">
            <PlusCircle size={20} />
            Add New Property
          </Link>
        </div>
      </div>

      {/* Properties Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {villas.map(villa => {
          // Dummy data for visual effect since images might be empty
          const fallbackImage = "https://images.unsplash.com/photo-1613490900233-141c5560d75d?q=80&w=2574&auto=format&fit=crop";
          const imageUrl = Array.isArray(villa.images) && villa.images.length > 0 ? villa.images[0] : fallbackImage;
          
          return (
            <div key={villa.id} className="group relative bg-card border border-border rounded-[2rem] overflow-hidden hover:border-primary/50 transition-all duration-500 shadow-2xl hover:shadow-[0_0_40px_rgba(212,175,55,0.15)] flex flex-col h-full">
              
              {/* Image Header */}
              <div className="relative h-64 w-full overflow-hidden">
                <div 
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                  style={{ backgroundImage: `url(${imageUrl})` }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent" />
                
                {/* Badges */}
                <div className="absolute top-6 left-6 right-6 flex justify-between items-start">
                  <div className={`px-4 py-1.5 rounded-full text-xs font-bold backdrop-blur-md border ${villa.isActive ? 'bg-green-500/20 text-green-300 border-green-500/30' : 'bg-red-500/20 text-red-300 border-red-500/30'}`}>
                    {villa.isActive ? '● Active Listing' : '● Inactive'}
                  </div>
                  <Link href={`/properties/${villa.id}`} className="p-2.5 rounded-full bg-background/60 backdrop-blur-md border border-border text-foreground hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all">
                    <Edit size={16} />
                  </Link>
                </div>

                {/* Title overlay */}
                <div className="absolute bottom-6 left-6 right-6">
                  <h2 className="text-3xl font-serif text-foreground mb-2 drop-shadow-md">{villa.name}</h2>
                  <div className="flex items-center gap-2 text-muted-foreground text-sm font-medium">
                    <MapPin size={14} className="text-primary" /> Lonavala, Maharashtra
                  </div>
                </div>
              </div>

              {/* Card Body */}
              <div className="p-8 flex-1 flex flex-col justify-between">
                <div>
                  <p className="text-muted-foreground text-sm mb-8 line-clamp-2 leading-relaxed">
                    {villa.description || 'A beautiful luxury property managed through the platform. Edit the property to add a captivating description for your guests.'}
                  </p>
                  
                  {/* Capacity & Rooms Grid */}
                  <div className="grid grid-cols-3 gap-3 mb-8">
                    <div className="bg-muted border border-border rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:bg-accent hover:border-primary/50 transition-colors">
                      <Users className="text-primary mb-2" size={24} />
                      <div className="text-xl font-bold text-foreground">{villa.capacity}</div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Guests</div>
                    </div>
                    <div className="bg-muted border border-border rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:bg-accent hover:border-primary/50 transition-colors">
                      <BedDouble className="text-primary mb-2" size={24} />
                      <div className="text-xl font-bold text-foreground">{villa.bedrooms}</div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Bedrooms</div>
                    </div>
                    <div className="bg-muted border border-border rounded-2xl p-4 flex flex-col items-center justify-center text-center hover:bg-accent hover:border-primary/50 transition-colors">
                      <Bath className="text-primary mb-2" size={24} />
                      <div className="text-xl font-bold text-foreground">{villa.bathrooms}</div>
                      <div className="text-[10px] uppercase tracking-wider text-muted-foreground mt-1">Bathrooms</div>
                    </div>
                  </div>
                </div>

                {/* Performance & Actions */}
                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-gradient-to-r from-[#D4AF37]/10 to-transparent rounded-2xl border border-[#D4AF37]/20">
                    <div className="flex items-center gap-3">
                      <div className="bg-primary/20 p-2 rounded-lg text-primary">
                        <Calendar size={20} />
                      </div>
                      <div>
                        <div className="text-xs text-muted-foreground">Active Bookings</div>
                        <div className="font-bold text-foreground">{villa.bookings.length} upcoming stays</div>
                      </div>
                    </div>
                    <Link href={`/bookings?villa=${villa.id}`} className="text-sm font-medium text-primary hover:text-primary/80 flex items-center gap-1 transition-colors">
                      View <ArrowRight size={14} />
                    </Link>
                  </div>
                  
                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div>
                      <div className="text-xs text-muted-foreground uppercase tracking-wide mb-1">Nightly Rate From</div>
                      <div className="text-2xl font-bold text-foreground flex items-center gap-1">
                        <Banknote size={20} className="text-primary" />
                        ₹{Number(villa.basePrice).toLocaleString()}
                      </div>
                    </div>
                    <Link href={`/properties/${villa.id}`} className="px-5 py-2.5 rounded-full border border-border text-foreground font-medium hover:bg-muted transition-colors">
                      Manage Details
                    </Link>
                  </div>
                </div>

              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
