import React from 'react';
import { Star, MapPin, Users, Wifi } from 'lucide-react';
import { clsx } from 'clsx';

export interface VillaCardProps {
  id: string;
  name: string;
  location: string;
  imageUrl: string;
  rating: number;
  reviewsCount: number;
  guests: number;
  pricePerNight: number;
  tags?: string[];
  onBookNow?: (id: string) => void;
  onViewDetails?: (id: string) => void;
}

export function VillaCard({
  id,
  name,
  location,
  imageUrl,
  rating,
  reviewsCount,
  guests,
  pricePerNight,
  tags = [],
  onBookNow,
  onViewDetails
}: VillaCardProps) {
  return (
    <div className="group bg-white/5 border border-white/10 rounded-2xl overflow-hidden flex flex-col transition-all hover:bg-white/10 hover:shadow-xl hover:shadow-black/40 hover:-translate-y-1">
      <div className="relative h-48 w-full overflow-hidden bg-black/40">
        <img 
          src={imageUrl} 
          alt={name} 
          className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
        />
        <div className="absolute top-3 right-3 bg-black/60 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1 border border-white/10">
          <Star size={14} className="text-yellow-400 fill-yellow-400" />
          <span className="text-white text-xs font-bold">{rating.toFixed(1)}</span>
        </div>
      </div>
      
      <div className="p-5 flex-1 flex flex-col">
        <div className="mb-2">
          <div className="flex justify-between items-start">
            <h3 className="text-lg font-bold text-white leading-tight mb-1">{name}</h3>
          </div>
          <div className="flex items-center gap-1 text-white/50 text-xs">
            <MapPin size={12} />
            <span>{location}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-3 mb-4 text-xs text-white/70">
          <div className="flex items-center gap-1">
            <Users size={14} className="text-white/40" />
            <span>Up to {guests} guests</span>
          </div>
          {tags.includes('wifi') && (
            <div className="flex items-center gap-1">
              <Wifi size={14} className="text-white/40" />
              <span>Fast Wi-Fi</span>
            </div>
          )}
        </div>
        
        <div className="mt-auto pt-4 border-t border-white/10 flex items-center justify-between">
          <div>
            <span className="text-xl font-bold text-white">₹{pricePerNight.toLocaleString('en-IN')}</span>
            <span className="text-xs text-white/40 ml-1">/ night</span>
          </div>
          
          <div className="flex gap-2">
            {onViewDetails && (
              <button 
                onClick={() => onViewDetails(id)}
                className="px-3 py-1.5 text-xs font-medium text-white/70 hover:text-white transition-colors"
              >
                Details
              </button>
            )}
            {onBookNow && (
              <button 
                onClick={() => onBookNow(id)}
                className="px-4 py-1.5 bg-primary text-primary-foreground text-xs font-bold rounded-lg hover:brightness-110 transition-all shadow-lg shadow-primary/20"
              >
                Book
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
