import React from 'react';
import { User, Mail, Phone, MapPin } from 'lucide-react';

export default function ProfilePage() {
  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-[var(--text-dark)]">My Profile</h1>
          <p className="text-[var(--text-sec-dark)] mt-1">Manage your personal information and preferences.</p>
        </div>
      </div>

      <div className="liquid-glass rounded-2xl p-8 mt-8 flex flex-col md:flex-row gap-8 items-start">
        <div className="w-32 h-32 rounded-full bg-gradient-to-br from-amber-200 to-amber-500 text-black flex items-center justify-center text-4xl font-bold shadow-lg flex-shrink-0">
          V
        </div>
        <div className="space-y-6 flex-1 w-full">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="text-xs uppercase tracking-widest text-gold mb-1 block">Full Name</label>
              <div className="flex items-center gap-3 text-[var(--text-dark)] bg-white/5 border border-white/10 px-4 py-3 rounded-lg">
                <User className="w-4 h-4 text-[var(--text-sec-dark)]" />
                Vikramaditya Mehta
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-gold mb-1 block">Email Address</label>
              <div className="flex items-center gap-3 text-[var(--text-dark)] bg-white/5 border border-white/10 px-4 py-3 rounded-lg">
                <Mail className="w-4 h-4 text-[var(--text-sec-dark)]" />
                vikram@example.com
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-gold mb-1 block">Phone Number</label>
              <div className="flex items-center gap-3 text-[var(--text-dark)] bg-white/5 border border-white/10 px-4 py-3 rounded-lg">
                <Phone className="w-4 h-4 text-[var(--text-sec-dark)]" />
                +91 98765 43210
              </div>
            </div>
            <div>
              <label className="text-xs uppercase tracking-widest text-gold mb-1 block">Location</label>
              <div className="flex items-center gap-3 text-[var(--text-dark)] bg-white/5 border border-white/10 px-4 py-3 rounded-lg">
                <MapPin className="w-4 h-4 text-[var(--text-sec-dark)]" />
                Mumbai, India
              </div>
            </div>
          </div>
          
          <div className="pt-4 border-t border-white/10 flex justify-end">
            <button className="bg-gold text-black font-semibold px-6 py-2 rounded-lg hover:scale-105 transition shadow-lg">
              Edit Profile
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
