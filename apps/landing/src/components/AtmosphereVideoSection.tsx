import { Sparkles, ShieldCheck, Utensils, HeartHandshake } from 'lucide-react';
import { motion } from 'framer-motion';
import { MEDIA } from '../constants/media';

interface AtmosphereVideoSectionProps {
  isDark?: boolean;
}

export default function AtmosphereVideoSection({
  isDark = true,
}: AtmosphereVideoSectionProps) {
  return (
    <section
      id="atmosphere"
      className="relative min-h-[70vh] sm:min-h-[85vh] flex items-center justify-center py-20 sm:py-28 px-4 sm:px-6 md:px-12 overflow-hidden w-full max-w-full"
    >
      {/* Background Video Asset from mindloop */}
      <video
        src={MEDIA.videos.heroAtmosphere}
        className="absolute inset-0 w-full h-full object-cover opacity-35 pointer-events-none transform-gpu select-none filter saturate-[1.2]"
        style={{
          willChange: 'opacity',
          transform: 'translate3d(0, 0, 0)',
        }}
        autoPlay
        loop
        muted
        playsInline
      />
      <div
        className={`absolute inset-0 pointer-events-none transition-colors duration-500 ${
          isDark
            ? 'bg-gradient-to-t from-black via-black/60 to-black/80'
            : 'bg-gradient-to-t from-[#F7F5F1] via-[#F7F5F1]/65 to-[#F7F5F1]/85'
        }`}
      />

      <div className="relative z-10 max-w-6xl mx-auto text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.85, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="section-badge mb-6 inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs uppercase tracking-wider"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>The Mindloop of Luxury</span>
        </motion.div>

        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.85, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className={`text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-serif mb-6 sm:mb-8 leading-tight max-w-4xl mx-auto transition-colors ${
            isDark ? 'text-white' : 'text-black'
          }`}
        >
          Immersive Serenity at{' '}
          <span className="italic font-normal text-gold">Chunawala&apos;s Seven C Villa</span>
        </motion.h2>

        <motion.p
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.85, delay: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className={`text-sm sm:text-base md:text-lg max-w-2xl mx-auto mb-12 sm:mb-16 font-light leading-relaxed px-2 transition-colors ${
            isDark ? 'text-white/85' : 'text-black/80'
          }`}
        >
          Where modern architectural precision meets the calm of nature. Every moment is crafted
          for total relaxation, privacy, and unforgettable hospitality.
        </motion.p>

        {/* Glassmorphic Luxury Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 sm:gap-8 text-left">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.85, delay: 1.05, ease: [0.16, 1, 0.3, 1] }}
            className={`p-7 sm:p-8 rounded-3xl border transition-all ${
              isDark
                ? 'liquid-glass border-white/15 hover:border-gold/50 text-white'
                : 'bg-white/80 border-black/15 hover:border-gold text-black shadow-xl'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-gold/20 border border-gold/40 flex items-center justify-center text-gold mb-6">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-xl sm:text-2xl font-serif mb-3">Absolute Seclusion</h3>
            <p
              className={`text-sm font-light leading-relaxed ${
                isDark ? 'text-white/75' : 'text-black/75'
              }`}
            >
              Gated sanctuary ensuring complete privacy for your family, celebrations, and peaceful
              weekend escapes.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.85, delay: 1.35, ease: [0.16, 1, 0.3, 1] }}
            className={`p-7 sm:p-8 rounded-3xl border transition-all ${
              isDark
                ? 'liquid-glass border-white/15 hover:border-gold/50 text-white'
                : 'bg-white/80 border-black/15 hover:border-gold text-black shadow-xl'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-gold/20 border border-gold/40 flex items-center justify-center text-gold mb-6">
              <Utensils className="w-6 h-6" />
            </div>
            <h3 className="text-xl sm:text-2xl font-serif mb-3">Bespoke Dining &amp; BBQ</h3>
            <p
              className={`text-sm font-light leading-relaxed ${
                isDark ? 'text-white/75' : 'text-black/75'
              }`}
            >
              Custom culinary experiences from private chefs to poolside evening barbecues prepared to
              perfection.
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.85, delay: 1.65, ease: [0.16, 1, 0.3, 1] }}
            className={`p-7 sm:p-8 rounded-3xl border transition-all sm:col-span-2 md:col-span-1 ${
              isDark
                ? 'liquid-glass border-white/15 hover:border-gold/50 text-white'
                : 'bg-white/80 border-black/15 hover:border-gold text-black shadow-xl'
            }`}
          >
            <div className="w-12 h-12 rounded-2xl bg-gold/20 border border-gold/40 flex items-center justify-center text-gold mb-6">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <h3 className="text-xl sm:text-2xl font-serif mb-3">Dedicated Concierge</h3>
            <p
              className={`text-sm font-light leading-relaxed ${
                isDark ? 'text-white/75' : 'text-black/75'
              }`}
            >
              24/7 personalized service catering to excursions, wellness treatments, and seamless
              in-villa requests.
            </p>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
