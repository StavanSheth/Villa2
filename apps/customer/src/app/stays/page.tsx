import React from 'react';

export default function MyStaysPage() {
  return (
    <div className="space-y-8 animate-fade-in pb-20">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-[var(--text-dark)]">My Stays</h1>
          <p className="text-[var(--text-sec-dark)] mt-1">Manage your upcoming, current, and past reservations.</p>
        </div>
      </div>

      <div className="liquid-glass rounded-2xl p-12 flex flex-col items-center justify-center text-center mt-8">
        <h2 className="text-xl font-serif text-[var(--text-dark)] mb-4">No other stays found.</h2>
        <p className="text-[var(--text-sec-dark)] mb-6 max-w-md">You only have your upcoming stay at Seven C Villa. Would you like to book another trip?</p>
        <button className="bg-white/5 border border-white/10 text-[var(--text-dark)] hover:border-gold hover:text-gold font-semibold px-6 py-3 rounded-lg transition shadow-lg">
          Browse Dates
        </button>
      </div>
    </div>
  );
}
