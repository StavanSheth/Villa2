import React from 'react';
import { Star } from 'lucide-react';

export default function ReviewsPage() {
  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-5xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-[var(--text-dark)]">My Reviews</h1>
          <p className="text-[var(--text-sec-dark)] mt-1">Share your experience or view past reviews.</p>
        </div>
      </div>

      <div className="liquid-glass rounded-2xl p-8 mt-8 flex flex-col items-center justify-center text-center">
        <div className="w-16 h-16 rounded-full bg-gold/10 flex items-center justify-center text-gold mb-4">
          <Star className="w-8 h-8" />
        </div>
        <h2 className="text-xl font-medium text-[var(--text-dark)] mb-2">No Pending Reviews</h2>
        <p className="text-[var(--text-sec-dark)] max-w-sm">You have no completed stays that require a review. We look forward to hosting you soon!</p>
      </div>
    </div>
  );
}
