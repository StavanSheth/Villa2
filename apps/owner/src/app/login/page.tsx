'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const handleDemoLogin = (roleToken: string) => {
    document.cookie = `access_token=${roleToken}; path=/; max-age=86400`;
    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d1117] text-white p-4">
      <div className="max-w-md w-full bg-white/5 border border-white/10 rounded-xl p-8 backdrop-blur-md">
        <h2 className="text-3xl font-serif text-[#D4AF37] mb-2 text-center">Villa Owner Portal</h2>
        <p className="text-sm text-white/60 text-center mb-8">Sign in to manage your properties and bookings</p>

        <form onSubmit={(e) => { e.preventDefault(); handleDemoLogin('demo-owner-jwt'); }} className="space-y-4">
          <div>
            <label className="block text-xs text-white/70 uppercase font-semibold mb-1">Email</label>
            <input 
              type="email" 
              defaultValue="owner@mavon.online" 
              className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
          <div>
            <label className="block text-xs text-white/70 uppercase font-semibold mb-1">Password</label>
            <input 
              type="password" 
              defaultValue="••••••••" 
              className="w-full px-4 py-2 bg-white/5 border border-white/20 rounded text-white focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <button 
            type="submit" 
            className="w-full py-3 bg-[#D4AF37] text-black font-semibold rounded hover:bg-yellow-600 transition-colors mt-6"
          >
            Sign In as Owner
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-white/10 text-center">
          <p className="text-xs text-white/50 mb-3">Quick Demo Access</p>
          <div className="flex gap-2 justify-center">
            <button 
              onClick={() => handleDemoLogin('demo-owner-jwt')}
              className="px-3 py-1.5 bg-white/10 text-xs rounded hover:bg-white/20 text-white"
            >
              Demo Owner Token
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
