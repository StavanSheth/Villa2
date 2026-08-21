"use client";

import { Sparkles, Shield, User, Star } from "lucide-react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  const handleMockLogin = (role: string) => {
    // Set a mock JWT cookie to bypass Edge auth for testing Phase 4/5
    document.cookie = `access_token=demo-${role.toLowerCase()}-jwt; path=/; domain=localhost;`;
    
    // Redirect to the appropriate subdomain
    switch (role) {
      case 'ADMIN':
        window.location.href = "http://localhost:3002/";
        break;
      case 'STAFF':
        window.location.href = "http://localhost:3003/";
        break;
      case 'OWNER':
        window.location.href = "http://localhost:3004/";
        break;
      case 'CUSTOMER':
      default:
        window.location.href = "http://localhost:3001/";
        break;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden bg-black">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#0A0A0A] via-[#0D0D0D] to-[#141414]" />
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-[#D4AF37]/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-[#D4AF37]/3 rounded-full blur-[100px]" />

      <div className="relative z-10 w-full max-w-md mx-auto px-4 animate-fade-in">
        {/* Branding Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2.5 mb-4">
            <div className="w-10 h-10 rounded-full bg-[#D4AF37]/20 border border-[#D4AF37]/40 flex items-center justify-center text-[#D4AF37]">
              <Sparkles className="w-5 h-5" />
            </div>
            <div className="flex flex-col text-left">
              <span className="font-serif text-xl tracking-wide text-white">
                Chunawala&apos;s
              </span>
              <span className="text-[10px] uppercase tracking-[0.22em] text-[#D4AF37] font-medium -mt-0.5">
                Seven C Villa
              </span>
            </div>
          </div>
          <h1 className="text-2xl font-serif text-white mb-1">Mavon Access</h1>
          <p className="text-sm text-white/60">
            Select a role to bypass Edge auth for local testing
          </p>
        </div>

        <div className="space-y-4">
          <button onClick={() => handleMockLogin('ADMIN')} className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-3 text-white">
              <Shield className="w-5 h-5 text-[#D4AF37]" />
              <span className="font-medium">Administrator</span>
            </div>
            <span className="text-xs text-white/40">admin.localhost</span>
          </button>
          
          <button onClick={() => handleMockLogin('STAFF')} className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-3 text-white">
              <User className="w-5 h-5 text-blue-400" />
              <span className="font-medium">Staff Member</span>
            </div>
            <span className="text-xs text-white/40">staff.localhost</span>
          </button>

          <button onClick={() => handleMockLogin('OWNER')} className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-3 text-white">
              <Star className="w-5 h-5 text-purple-400" />
              <span className="font-medium">Villa Owner</span>
            </div>
            <span className="text-xs text-white/40">owner.localhost</span>
          </button>

          <button onClick={() => handleMockLogin('CUSTOMER')} className="w-full flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors">
            <div className="flex items-center gap-3 text-white">
              <User className="w-5 h-5 text-green-400" />
              <span className="font-medium">Customer</span>
            </div>
            <span className="text-xs text-white/40">booking.localhost</span>
          </button>
        </div>
      </div>
    </div>
  );
}
