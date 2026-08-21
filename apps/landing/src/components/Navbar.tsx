import { useState, useEffect } from 'react';
import { Sparkles, Menu, X, Sun, Moon, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface NavbarProps {
  isDark?: boolean;
  onToggleTheme?: (toDark: boolean) => void;
  onOpenBooking: () => void;
}

const NAV_LINKS = [
  { label: 'Overview', href: '#home' },
  { label: 'Interiors', href: '#interiors' },
  { label: 'Pool & Grounds', href: '#outdoors' },
  { label: 'The Atmosphere', href: '#atmosphere' },
  { label: 'Location', href: '#location' },
] as const;

type UserRole = 'GUEST' | 'OWNER' | 'STAFF' | 'ADMIN';

export default function Navbar({
  isDark = true,
  onToggleTheme,
  onOpenBooking,
}: NavbarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [activeRole, setActiveRole] = useState<UserRole>('GUEST');

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  const cycleRole = () => {
    const roles: UserRole[] = ['GUEST', 'OWNER', 'STAFF', 'ADMIN'];
    const nextIndex = (roles.indexOf(activeRole) + 1) % roles.length;
    setActiveRole(roles[nextIndex]);
  };

  const renderThemeToggle = (className = '') => {
    if (!onToggleTheme) return null;
    return (
      <button
        type="button"
        onClick={() => onToggleTheme(!isDark)}
        aria-label={isDark ? 'Switch to Morning mode' : 'Switch to Night mode'}
        className={`pointer-events-auto relative flex items-center rounded-full cursor-pointer select-none transition-all duration-500 shadow-inner ${
          isDark
            ? 'bg-white/15 border border-white/25 hover:border-white/40 shadow-[inset_0_2px_8px_rgba(0,0,0,0.5)]'
            : 'bg-black/10 border border-black/20 hover:border-black/30 shadow-[inset_0_2px_8px_rgba(0,0,0,0.15)]'
        } ${className}`}
        style={{
          width: '60px',
          height: '32px',
          padding: '3px',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
        }}
      >
        <div
          className={`flex items-center justify-center rounded-full shadow-md transition-all duration-500 transform-gpu ${
            isDark
              ? 'bg-gradient-to-br from-amber-400 to-amber-600 text-black'
              : 'bg-gradient-to-br from-amber-200 to-amber-500 text-black'
          }`}
          style={{
            width: '24px',
            height: '24px',
            transform: isDark ? 'translateX(0px)' : 'translateX(28px)',
          }}
        >
          {isDark ? (
            <Moon className="w-3.5 h-3.5 text-black fill-black" />
          ) : (
            <Sun className="w-3.5 h-3.5 text-black fill-black" />
          )}
        </div>
      </button>
    );
  };

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 pointer-events-none bg-transparent ${
          scrolled ? 'py-3 sm:py-3.5 px-4 sm:px-6 md:px-12' : 'py-4 sm:py-5 px-4 sm:px-6 md:px-12'
        }`}
      >
        <div className="max-w-7xl mx-auto w-full flex items-center justify-between">
          {/* Brand Logo */}
          <motion.a
            href="#home"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className={`pointer-events-auto group text-decoration-none z-50 flex items-center gap-2 sm:gap-3 px-3.5 py-2 sm:px-4 sm:py-2.5 rounded-full transition-all duration-300 shadow-lg ${
              isDark
                ? 'bg-white/[0.08] backdrop-blur-xl border border-white/20 hover:border-gold/50 shadow-[0_4px_20px_rgba(0,0,0,0.4)]'
                : 'bg-white/[0.70] backdrop-blur-xl border border-black/15 hover:border-gold/50 shadow-[0_4px_20px_rgba(31,38,135,0.12)]'
            }`}
          >
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center text-gold group-hover:scale-105 transition-transform flex-shrink-0">
              <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
            </div>
            <div className="flex flex-col">
              <span
                className={`font-serif text-sm sm:text-base md:text-lg tracking-wide transition-colors ${
                  isDark ? 'text-white' : 'text-black'
                }`}
              >
                Chunawala&apos;s
              </span>
              <span className="text-[8px] sm:text-[10px] uppercase tracking-[0.22em] text-gold font-medium -mt-1">
                Seven C Villa
              </span>
            </div>
          </motion.a>

          {/* Desktop Navigation Links */}
          <div className="hidden lg:flex items-center gap-2.5">
            {NAV_LINKS.map((link, idx) => (
              <motion.a
                key={link.label}
                href={link.href}
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.85, delay: 0.5 + idx * 0.15, ease: [0.16, 1, 0.3, 1] }}
                className={`pointer-events-auto px-4 py-2 rounded-full text-xs font-medium tracking-wider uppercase transition-all duration-300 shadow-md ${
                  isDark
                    ? 'bg-white/[0.08] backdrop-blur-xl border border-white/15 text-white/90 hover:border-gold hover:text-white shadow-[0_4px_15px_rgba(0,0,0,0.35)]'
                    : 'bg-white/[0.65] backdrop-blur-xl border border-black/15 text-black/90 hover:border-gold hover:text-black shadow-[0_4px_15px_rgba(31,38,135,0.12)]'
                }`}
              >
                {link.label}
              </motion.a>
            ))}
          </div>

          {/* Desktop Action Buttons on Right */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 1.3, ease: [0.16, 1, 0.3, 1] }}
            className="hidden lg:flex items-center gap-3"
          >
            {/* Interactive RBAC Role Simulator Pill */}
            <button
              type="button"
              onClick={cycleRole}
              title="Click to simulate switching RBAC role (Guest / Owner / Staff / Admin)"
              className={`pointer-events-auto flex items-center gap-1.5 px-3 py-2 rounded-full text-[11px] font-mono tracking-wider transition-all border ${
                isDark
                  ? 'bg-white/[0.08] border-gold/40 text-gold hover:bg-gold/20'
                  : 'bg-black/5 border-gold/60 text-gold hover:bg-gold/10'
              }`}
            >
              <ShieldCheck className="w-3.5 h-3.5 shrink-0" />
              <span>RBAC: {activeRole}</span>
            </button>

            {renderThemeToggle()}

            <button
              type="button"
              onClick={onOpenBooking}
              className="pointer-events-auto cta-button uppercase tracking-wider text-xs px-5 py-2.5 sm:px-6 sm:py-3 shadow-xl"
            >
              Reserve Your Stay
            </button>
          </motion.div>

          {/* Tablet & Phone Controls on Right (< lg) */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.85, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="flex lg:hidden items-center gap-2"
          >
            {/* Mobile RBAC Switcher Pill */}
            <button
              type="button"
              onClick={cycleRole}
              className="pointer-events-auto flex items-center gap-1 px-2.5 py-1.5 rounded-full text-[10px] font-mono border border-gold/40 text-gold bg-white/5"
            >
              <ShieldCheck className="w-3 h-3" />
              <span>{activeRole}</span>
            </button>

            {renderThemeToggle()}

            <button
              type="button"
              className={`pointer-events-auto p-2.5 sm:p-3 rounded-full transition-all duration-300 shadow-lg ${
                isDark
                  ? 'bg-white/[0.12] backdrop-blur-xl border border-white/20 text-white shadow-[0_4px_15px_rgba(0,0,0,0.4)] hover:border-gold'
                  : 'bg-white/[0.75] backdrop-blur-xl border border-black/15 text-black shadow-[0_4px_15px_rgba(31,38,135,0.15)] hover:border-gold'
              }`}
              onClick={() => setMenuOpen(true)}
              aria-label="Open Navigation Sidebar"
            >
              <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          </motion.div>
        </div>
      </nav>

      {/* Slide-In Sidebar (< lg) */}
      {menuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden pointer-events-auto">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setMenuOpen(false)}
          />

          <aside
            className={`absolute top-0 right-0 h-full w-80 max-w-[85vw] flex flex-col justify-between p-6 sm:p-8 backdrop-blur-3xl border-l shadow-2xl transition-transform duration-500 ease-[cubic-bezier(0.19,1,0.22,1)] ${
              isDark
                ? 'bg-black/95 border-white/15 text-white'
                : 'bg-[#FDFCF9]/98 border-black/15 text-black'
            }`}
          >
            <div>
              <div className="flex items-center justify-between pb-6 border-b border-white/10 dark:border-white/10 mb-6">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center text-gold">
                    <Sparkles className="w-4 h-4" />
                  </div>
                  <div className="flex flex-col">
                    <span
                      className={`font-serif text-lg tracking-wide ${
                        isDark ? 'text-white' : 'text-black'
                      }`}
                    >
                      Chunawala&apos;s
                    </span>
                    <span className="text-[9px] uppercase tracking-[0.22em] text-gold font-medium -mt-1">
                      Seven C Villa
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setMenuOpen(false)}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${
                    isDark
                      ? 'bg-white/10 text-white hover:bg-gold hover:text-black'
                      : 'bg-black/10 text-black hover:bg-gold hover:text-black'
                  }`}
                  aria-label="Close Sidebar"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-2">
                {NAV_LINKS.map((link) => (
                  <a
                    key={link.label}
                    href={link.href}
                    onClick={() => setMenuOpen(false)}
                    className={`group flex items-center justify-between font-serif text-lg sm:text-xl py-3 px-4 rounded-2xl transition-all ${
                      isDark
                        ? 'text-white/90 hover:bg-white/10 hover:text-gold'
                        : 'text-black/90 hover:bg-black/5 hover:text-gold'
                    }`}
                  >
                    <span>{link.label}</span>
                    <ArrowRight className="w-4 h-4 text-gold opacity-0 group-hover:opacity-100 transform -translate-x-2 group-hover:translate-x-0 transition-all" />
                  </a>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-white/10 dark:border-white/10">
              <p
                className={`text-xs uppercase tracking-widest text-center mb-4 ${
                  isDark ? 'text-white/60' : 'text-black/60'
                }`}
              >
                Private Luxury Estate • RBAC: {activeRole}
              </p>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onOpenBooking();
                }}
                className="cta-button uppercase tracking-wider text-xs py-4 w-full shadow-2xl"
              >
                Reserve Your Stay
              </button>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
