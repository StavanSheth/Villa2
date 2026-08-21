import React from 'react';
import { User, Shield, Key } from 'lucide-react';

export default function WebProfilePage() {
  return (
    <div className="min-h-screen bg-[#111111] text-white p-8 space-y-6">
      <h1 className="text-3xl font-serif text-[#D4AF37]">Profile & Settings</h1>
      <div className="bg-black/60 border border-white/10 p-6 rounded-xl space-y-4 max-w-xl">
        <p><strong>Name:</strong> Stavan Patel</p>
        <p><strong>Email:</strong> stavan@mavon.online</p>
        <p><strong>Role:</strong> Super Admin / Customer</p>
      </div>
    </div>
  );
}
