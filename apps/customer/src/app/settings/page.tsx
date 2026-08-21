import React from 'react';
import { Shield, Bell, Moon, CreditCard, Globe } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-8 animate-fade-in pb-20 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-serif text-[var(--text-dark)]">Settings</h1>
          <p className="text-[var(--text-sec-dark)] mt-1">Configure your account security and preferences.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
        <div className="liquid-glass rounded-2xl p-6 flex flex-col items-center text-center hover:bg-white/5 transition cursor-pointer">
          <div className="w-12 h-12 rounded-full bg-blue-500/10 text-blue-400 flex items-center justify-center mb-4">
            <Shield className="w-6 h-6" />
          </div>
          <h3 className="text-[var(--text-dark)] font-medium">Security</h3>
          <p className="text-xs text-[var(--text-sec-dark)] mt-2">Update password and 2FA</p>
        </div>

        <div className="liquid-glass rounded-2xl p-6 flex flex-col items-center text-center hover:bg-white/5 transition cursor-pointer">
          <div className="w-12 h-12 rounded-full bg-purple-500/10 text-purple-400 flex items-center justify-center mb-4">
            <Bell className="w-6 h-6" />
          </div>
          <h3 className="text-[var(--text-dark)] font-medium">Notifications</h3>
          <p className="text-xs text-[var(--text-sec-dark)] mt-2">Manage email & SMS alerts</p>
        </div>

        <div className="liquid-glass rounded-2xl p-6 flex flex-col items-center text-center hover:bg-white/5 transition cursor-pointer">
          <div className="w-12 h-12 rounded-full bg-gold/10 text-gold flex items-center justify-center mb-4">
            <Moon className="w-6 h-6" />
          </div>
          <h3 className="text-[var(--text-dark)] font-medium">Appearance</h3>
          <p className="text-xs text-[var(--text-sec-dark)] mt-2">Dark mode & display</p>
        </div>
      </div>
    </div>
  );
}
