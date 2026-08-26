'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export default function LoginPage() {
  const router = useRouter();

  const handleDemoLogin = (roleToken: string) => {
    document.cookie = `access_token=${roleToken}; path=/; max-age=2700`;
    router.push('/');
    router.refresh();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="max-w-md w-full bg-card border border-border shadow-xl rounded-xl p-8">
        <h2 className="text-3xl font-serif text-primary mb-2 text-center">Staff Portal</h2>
        <p className="text-sm text-muted-foreground text-center mb-8">Sign in to access daily tasks and operations</p>

        <form onSubmit={(e) => { e.preventDefault(); handleDemoLogin('demo-staff-jwt'); }} className="space-y-4">
          <div>
            <label className="block text-xs text-muted-foreground uppercase font-semibold mb-1">Email</label>
            <input 
              type="email" 
              defaultValue="staff@mavon.online" 
              className="w-full px-4 py-2 bg-muted border border-border rounded text-foreground focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground uppercase font-semibold mb-1">Password</label>
            <input 
              type="password" 
              defaultValue="••••••••" 
              className="w-full px-4 py-2 bg-muted border border-border rounded text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <button 
            type="submit" 
            className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded hover:brightness-110 transition-colors mt-6 shadow-md"
          >
            Sign In as Staff
          </button>
        </form>

        <div className="mt-6 pt-6 border-t border-border text-center">
          <p className="text-xs text-muted-foreground mb-3">Quick Demo Access</p>
          <div className="flex gap-2 justify-center">
            <button 
              onClick={() => handleDemoLogin('demo-staff-jwt')}
              className="px-3 py-1.5 bg-muted text-xs rounded hover:bg-accent text-muted-foreground transition-colors"
            >
              Demo Staff Token
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
