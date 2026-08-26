'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@villa-platform/hooks'; // assuming this resolves properly, else we might need relative

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const token = await userCredential.user.getIdToken();
      
      // Set access token (45 minutes = 2700 seconds)
      document.cookie = `access_token=${token}; path=/; max-age=2700; SameSite=Strict`;
      // Set session start timestamp for 45-minute session tracking
      document.cookie = `session_start=${Date.now()}; path=/; max-age=2700; SameSite=Strict`;
      
      router.push('/');
      router.refresh();
    } catch (err: any) {
      console.error('Firebase Auth Error:', err);
      setError(err.message || 'Failed to sign in. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background text-foreground p-4">
      <div className="max-w-md w-full bg-card border border-border rounded-xl p-8 backdrop-blur-md">
        <h2 className="text-3xl font-serif text-primary mb-2 text-center">Villa Owner Portal</h2>
        <p className="text-sm text-muted-foreground text-center mb-4">Sign in to manage your properties and bookings</p>

        {reason === 'expired' && (
          <div className="mb-6 p-3 bg-yellow-500/10 border border-yellow-500/30 rounded-lg text-center">
            <p className="text-sm text-yellow-600 dark:text-yellow-400 font-medium">Your session has expired. Please sign in again.</p>
          </div>
        )}
        {reason === 'unauthenticated' && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">Please sign in to access this page.</p>
          </div>
        )}
        {reason === 'invalid' && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">Invalid session. Please sign in again.</p>
          </div>
        )}
        
        {error && (
          <div className="mb-6 p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-center">
            <p className="text-sm text-red-600 dark:text-red-400 font-medium">{error}</p>
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-xs text-muted-foreground uppercase font-semibold mb-1">Email</label>
            <input 
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="owner@mavon.online"
              required
              className="w-full px-4 py-2 bg-card border border-border rounded text-foreground focus:outline-none focus:border-primary"
            />
          </div>
          <div>
            <label className="block text-xs text-muted-foreground uppercase font-semibold mb-1">Password</label>
            <input 
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••" 
              required
              className="w-full px-4 py-2 bg-card border border-border rounded text-foreground focus:outline-none focus:border-primary"
            />
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-3 bg-primary text-primary-foreground font-semibold rounded hover:brightness-110 transition-colors mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
