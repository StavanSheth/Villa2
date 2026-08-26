"use client";

import { motion } from 'framer-motion';
import { User, Briefcase, Key, ShieldCheck, ArrowLeft } from 'lucide-react';
import Link from 'next/link';

const ROLES = [
  {
    id: 'guest',
    label: 'Guest Login',
    description: 'Manage your villa bookings and stay details.',
    icon: User,
    href: 'http://localhost:3001/login',
    color: 'from-amber-400 to-amber-600',
  },
  {
    id: 'staff',
    label: 'Staff Portal',
    description: 'Access staff operations, tasks, and schedules.',
    icon: Briefcase,
    href: 'http://localhost:3003/login',
    color: 'from-blue-400 to-blue-600',
  },
  {
    id: 'owner',
    label: 'Owner Dashboard',
    description: 'View property analytics, revenue, and reports.',
    icon: Key,
    href: 'http://localhost:3004/login',
    color: 'from-purple-400 to-purple-600',
  },
];

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-background text-foreground relative overflow-hidden flex flex-col">
      {/* Background elements */}
      <div className="absolute inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-gold/10 via-black to-black"></div>
        <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent"></div>
      </div>

      {/* Navigation Bar */}
      <nav className="relative z-10 py-6 px-6 md:px-12 w-full flex items-center justify-between">
        <Link 
          href="/" 
          className="flex items-center gap-2 text-muted-foreground hover:text-foreground hover:text-gold transition-colors text-sm font-medium uppercase tracking-wider"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Home
        </Link>
      </nav>

      {/* Main Content */}
      <main className="relative z-10 flex-grow flex items-center justify-center p-6">
        <div className="max-w-5xl w-full">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center mb-16"
          >
            <h1 className="font-serif text-4xl md:text-5xl lg:text-6xl mb-4">
              Select Your <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold to-amber-300">Portal</span>
            </h1>
            <p className="text-muted-foreground font-light text-lg md:text-xl max-w-2xl mx-auto">
              Please choose the appropriate login portal to access your account for the Seven C Villa platform.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ROLES.map((role, index) => {
              const Icon = role.icon;
              return (
                <motion.a
                  key={role.id}
                  href={role.href}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: 0.2 + index * 0.1 }}
                  className="group relative block bg-white/[0.03] border border-border rounded-2xl p-8 hover:bg-white/[0.05] hover:border-border transition-all duration-300 backdrop-blur-sm overflow-hidden"
                >
                  <div className="absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-10 transition-opacity duration-500 rounded-2xl" />
                  
                  <div className={`w-14 h-14 mb-6 rounded-full flex items-center justify-center bg-gradient-to-br ${role.color} bg-opacity-20 relative z-10 group-hover:scale-110 transition-transform duration-500 shadow-lg`}>
                    <div className="absolute inset-0 bg-black/40 rounded-full"></div>
                    <Icon className="w-7 h-7 text-foreground relative z-10" />
                  </div>
                  
                  <h3 className="font-serif text-2xl mb-3 relative z-10 group-hover:text-gold transition-colors duration-300">
                    {role.label}
                  </h3>
                  
                  <p className="text-muted-foreground text-sm leading-relaxed relative z-10 group-hover:text-muted-foreground transition-colors duration-300">
                    {role.description}
                  </p>

                  <div className="mt-8 flex items-center text-sm text-gold font-medium opacity-0 group-hover:opacity-100 transform translate-x-[-10px] group-hover:translate-x-0 transition-all duration-300">
                    Login securely <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                  </div>
                </motion.a>
              );
            })}
          </div>
        </div>
      </main>
    </div>
  );
}
