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
    <div className="min-h-screen flex items-center justify-center bg-[#fdfcf9] p-4">
      <div className="max-w-md w-full bg-white border border-gray-200 shadow-xl rounded-xl p-8">
        <h2 className="text-3xl font-serif text-[#D4AF37] mb-2 text-center">Staff Portal</h2>
        <p className="text-sm text-gray-500 text-center mb-8">Sign in to access daily tasks and operations</p>

        <form onSubmit={(e) => { e.preventDefault(); handleDemoLogin('demo-staff-jwt'); }} className="space-y-4">
          <div>
            <label className="block text-xs text-gray-600 uppercase font-semibold mb-1">Email</label>
            <input 
              type="email" 
              defaultValue="staff@mavon.online" 
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded text-gray-900 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-600 uppercase font-semibold mb-1">Password</label>
            <input 
              type="password" 
              defaultValue="••••••••" 
              className="w-full px-4 py-2 bg-gray-50 border border-gray-200 rounded text-gray-900 focus:outline-none focus:border-[#D4AF37]"
            />
          </div>

          <button 
            type="submit" 
            className="w-full py-3 bg-[#D4AF37] text-white font-semibold rounded hover:bg-yellow-600 transition-colors mt-6 shadow-md"
          >
            Sign In as Staff
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-gray-100 text-center">
          <p className="text-xs text-gray-400 mb-3">Quick Demo Access</p>
          <div className="flex gap-2 justify-center">
            <button 
              onClick={() => handleDemoLogin('demo-staff-jwt')}
              className="px-3 py-1.5 bg-gray-100 text-xs rounded hover:bg-gray-200 text-gray-600 transition-colors"
            >
              Demo Staff Token
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
