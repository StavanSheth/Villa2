import React from 'react';
import { Calendar, Bell, Shield, ArrowRight } from 'lucide-react';

export default function CustomerDashboardPage() {
  return (
    <div className="space-y-8 animate-fade-in">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-[var(--text-dark)]">Welcome Back, Vikramaditya</h1>
          <p className="text-[var(--text-sec-dark)] mt-1">Here is the overview of your upcoming stay and activity.</p>
        </div>
        <button className="flex items-center gap-2 bg-gold text-black font-semibold px-5 py-2.5 rounded-lg hover:bg-[#b8952b] transition shadow-lg">
          <Calendar className="w-4 h-4" /> Book Another Stay
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Upcoming Stay Card */}
        <div className="lg:col-span-2 liquid-glass rounded-2xl p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-8 opacity-10">
            <Shield className="w-32 h-32 text-gold" />
          </div>
          <h2 className="text-xl font-serif text-[var(--text-dark)] mb-4">Upcoming Stay</h2>
          <div className="space-y-4 relative z-10">
            <div className="flex justify-between items-end border-b border-white/10 pb-4">
              <div>
                <p className="text-[10px] uppercase tracking-widest text-gold mb-1">Villa</p>
                <p className="text-2xl font-medium text-[var(--text-dark)]">Seven C Villa</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] uppercase tracking-widest text-gold mb-1">Check-in</p>
                <p className="text-lg text-[var(--text-dark)]">Aug 10, 2026</p>
              </div>
            </div>
            
            <div className="flex justify-between items-center pt-2">
              <div>
                <p className="text-sm text-[var(--text-sec-dark)]">Booking Ref: <span className="text-gold font-mono">MVN-2026-891</span></p>
                <p className="text-sm text-[var(--text-sec-dark)] mt-1">Status: <span className="text-green-400 font-medium">Confirmed</span></p>
              </div>
              <button className="px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-sm text-[var(--text-dark)] hover:border-gold hover:text-gold transition">
                View Details
              </button>
            </div>
          </div>
        </div>

        {/* Countdown / Quick Actions */}
        <div className="liquid-glass rounded-2xl p-6 flex flex-col justify-center items-center text-center">
          <p className="text-[10px] uppercase tracking-widest text-gold mb-2">Check-in In</p>
          <div className="flex items-center gap-3 font-serif text-3xl text-[var(--text-dark)] mb-6">
            <div className="flex flex-col"><span className="font-light">05</span><span className="text-[9px] font-sans text-[var(--text-sec-dark)] uppercase">Days</span></div>
            <span className="text-gold opacity-50">:</span>
            <div className="flex flex-col"><span className="font-light">12</span><span className="text-[9px] font-sans text-[var(--text-sec-dark)] uppercase">Hours</span></div>
          </div>
          <button className="w-full py-2.5 bg-white/5 border border-white/10 rounded-lg text-sm text-[var(--text-dark)] hover:border-gold transition flex items-center justify-center gap-2">
            View Arrival Instructions <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
