import { useEffect, useRef } from 'react';
import { ArrowDown } from 'lucide-react';
import { motion } from 'framer-motion';
import { MEDIA } from '../constants/media';
import { TextGenerateEffect } from './TextGenerateEffect';

interface HeroSectionProps {
  isDark: boolean;
  onToggleTheme: (toDark: boolean) => void;
  onOpenBooking?: () => void;
}

export default function HeroSection({ isDark }: HeroSectionProps) {
  const dayVideoRef = useRef<HTMLVideoElement>(null);
  const nightVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const activeRef = isDark ? nightVideoRef : dayVideoRef;
    const inactiveRef = isDark ? dayVideoRef : nightVideoRef;

    if (activeRef.current) {
      activeRef.current.play().catch(() => {});
    }
    if (inactiveRef.current) {
      inactiveRef.current.pause();
    }
  }, [isDark]);

  return (
    <section id="home" className="relative w-full h-[100dvh] sm:h-screen overflow-hidden">
      {/* Day Video Background */}
      <video
        ref={dayVideoRef}
        src={MEDIA.hero.dayVideo}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
          isDark ? 'opacity-0 z-0' : 'opacity-100 z-0'
        }`}
        autoPlay
        loop
        muted
        playsInline
      />

      {/* Night Video Background */}
      <video
        ref={nightVideoRef}
        src={MEDIA.hero.nightSkyLoop}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${
          isDark ? 'opacity-100 z-0' : 'opacity-0 z-0'
        }`}
        autoPlay
        loop
        muted
        playsInline
      />

      {/* Overlay (Day mode only; Night mode video is completely original without any layer) */}
      <div
        className={`absolute inset-0 transition-colors duration-1000 pointer-events-none ${
          isDark
            ? 'bg-transparent'
            : 'bg-gradient-to-b from-black/20 via-transparent to-black/50'
        } z-1`}
      />

      {/* Hero Content */}
      <div className="hero-content relative z-10 flex flex-col items-center justify-center min-h-[100dvh] sm:min-h-screen w-full px-4 sm:px-6 md:px-8 text-center max-w-5xl mx-auto py-16 sm:py-24 md:py-28 overflow-hidden">
        {/* Hero Title */}
        <div className="flex flex-col items-center justify-center">
          <h1 className="animate-fade-in animate-title-shimmer text-3xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-serif font-normal tracking-tight mb-8 sm:mb-12 leading-[1.08] sm:leading-[1.05] drop-shadow-2xl px-2">
            <TextGenerateEffect
              words="Chunawala's"
              className="block font-serif font-normal"
              duration={1.4}
              staggerDelay={0.12}
              splitBy="character"
              delay={0.2}
            />
            <TextGenerateEffect
              words="Seven C Villa"
              className="italic font-light text-gold font-serif block"
              duration={1.4}
              staggerDelay={0.11}
              splitBy="character"
              delay={2.9}
            />
          </h1>
        </div>

        {/* Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 6.0, ease: [0.16, 1, 0.3, 1] }}
          className="absolute bottom-6 sm:bottom-10 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2 pointer-events-none"
        >
          <span className="text-[10px] sm:text-xs uppercase tracking-widest font-light text-white/60">
            Scroll to Discover
          </span>
          <ArrowDown className="w-4 h-4 text-gold animate-bounce" />
        </motion.div>
      </div>
    </section>
  );
}
