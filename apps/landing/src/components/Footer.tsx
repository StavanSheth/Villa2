import { Sparkles, MapPin, Phone, Mail, Instagram, Facebook } from 'lucide-react';
import { motion } from 'framer-motion';

interface FooterProps {
  isDark?: boolean;
  onOpenBooking: () => void;
}

export default function Footer({ isDark = true, onOpenBooking }: FooterProps) {
  return (
    <footer
      id="location"
      className={`relative pt-16 sm:pt-20 pb-10 sm:pb-12 border-t overflow-hidden transition-colors duration-500 ${
        isDark
          ? 'bg-black/90 text-white/80 border-white/10'
          : 'bg-[#EFECE6] text-black/85 border-black/10'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-12">
        <div
          className={`grid grid-cols-1 sm:grid-cols-2 md:grid-cols-12 gap-10 sm:gap-12 pb-12 sm:pb-16 border-b ${
            isDark ? 'border-white/10' : 'border-black/10'
          }`}
        >
          {/* Brand Info */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.85, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            className="sm:col-span-2 md:col-span-5"
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-full bg-gold/20 border border-gold/40 flex items-center justify-center text-gold">
                <Sparkles className="w-5 h-5" />
              </div>
              <div className="flex flex-col">
                <span
                  className={`text-2xl font-serif tracking-wide ${
                    isDark ? 'text-white' : 'text-black'
                  }`}
                >
                  Chunawala&apos;s
                </span>
                <span className="text-[11px] uppercase tracking-[0.25em] text-gold font-medium -mt-1">
                  Seven C Villa
                </span>
              </div>
            </div>

            <p
              className={`text-sm font-light leading-relaxed max-w-sm mb-8 ${
                isDark ? 'text-white/70' : 'text-black/75'
              }`}
            >
              An exclusive private luxury villa sanctuary designed for serene getaways, pool
              lounging, and memorable architectural living day and night.
            </p>

            <div className="flex items-center gap-4">
              <a
                href="#home"
                aria-label="Instagram"
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  isDark
                    ? 'bg-white/5 border border-white/15 text-white/70 hover:text-gold hover:border-gold'
                    : 'bg-black/5 border border-black/15 text-black/70 hover:text-gold hover:border-gold'
                }`}
              >
                <Instagram className="w-4 h-4" />
              </a>
              <a
                href="#home"
                aria-label="Facebook"
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                  isDark
                    ? 'bg-white/5 border border-white/15 text-white/70 hover:text-gold hover:border-gold'
                    : 'bg-black/5 border border-black/15 text-black/70 hover:text-gold hover:border-gold'
                }`}
              >
                <Facebook className="w-4 h-4" />
              </a>
            </div>
          </motion.div>

          {/* Sanctuary Navigation */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.85, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="sm:col-span-1 md:col-span-3"
          >
            <h4 className="text-xs uppercase tracking-widest text-gold font-semibold mb-6">
              The Sanctuary
            </h4>
            <ul className="space-y-3 text-sm font-light">
              <li>
                <a href="#home" className="hover:text-gold transition-colors">
                  Home Overview
                </a>
              </li>
              <li>
                <a href="#interiors" className="hover:text-gold transition-colors">
                  Villa Interiors &amp; Suites
                </a>
              </li>
              <li>
                <a href="#outdoors" className="hover:text-gold transition-colors">
                  Infinity Pool &amp; Grounds
                </a>
              </li>
              <li>
                <a href="#atmosphere" className="hover:text-gold transition-colors">
                  The Atmosphere &amp; Video
                </a>
              </li>
              <li>
                <button
                  type="button"
                  onClick={onOpenBooking}
                  className="hover:text-gold transition-colors text-left"
                >
                  Reserve Your Stay
                </button>
              </li>
            </ul>
          </motion.div>

          {/* Contact & Location */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.1 }}
            transition={{ duration: 0.85, delay: 0.75, ease: [0.16, 1, 0.3, 1] }}
            className="sm:col-span-1 md:col-span-4"
          >
            <h4 className="text-xs uppercase tracking-widest text-gold font-semibold mb-6">
              Private Concierge &amp; Address
            </h4>
            <ul className="space-y-4 text-sm font-light">
              <li className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-gold flex-shrink-0 mt-1" />
                <span>
                  Chunawala&apos;s Seven C Villa — Private Estate Road, Lonavala / Khandala Valley,
                  Maharashtra, India
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-gold flex-shrink-0" />
                <span>+91 98200 00000 (Concierge Direct)</span>
              </li>
              <li className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-gold flex-shrink-0" />
                <span>reservations@chunawalas-sevenc.com</span>
              </li>
            </ul>
          </motion.div>
        </div>

        {/* Bottom Bar */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.1 }}
          transition={{ duration: 0.85, delay: 1.05, ease: [0.16, 1, 0.3, 1] }}
          className={`pt-8 flex flex-col md:flex-row items-center justify-between text-xs font-light gap-4 ${
            isDark ? 'text-white/50' : 'text-black/60'
          }`}
        >
          <div>
            &copy; {new Date().getFullYear()} Chunawala&apos;s Seven C Villa. All rights reserved.
          </div>
          <div className="flex gap-6">
            <a href="#home" className="hover:text-gold transition-colors">
              Privacy Policy
            </a>
            <a href="#home" className="hover:text-gold transition-colors">
              Terms of Residency
            </a>
            <a href="#home" className="hover:text-gold transition-colors">
              Concierge Charter
            </a>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
