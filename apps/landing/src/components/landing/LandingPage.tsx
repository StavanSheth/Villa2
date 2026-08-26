"use client";

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Navbar from './Navbar';
import HeroSection from './HeroSection';
import ExperienceSection from './ExperienceSection';
import PoolAndOutdoorsSection from './PoolAndOutdoorsSection';
import AtmosphereVideoSection from './AtmosphereVideoSection';
import Footer from './Footer';
import BookingModal from './BookingModal';
import Preloader from './Preloader';

export default function LandingPage() {
  // Start in Night mode by default as requested
  const [isDark, setIsDark] = useState(true);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const router = useRouter();

  useEffect(() => {
    document.body.classList.toggle('light-theme', !isDark);
  }, [isDark]);

  const openBooking = () => {
    window.location.href = 'http://localhost:3001/login';
  };
  const closeBooking = () => setIsBookingOpen(false);

  return (
    <div className={`min-h-screen flex flex-col selection:bg-gold selection:text-black transition-colors duration-700 ${isDark ? 'bg-[#0A0A09] text-white' : 'bg-[#F7F5F1] text-black'}`}>
      {isLoading && <Preloader onComplete={() => setIsLoading(false)} />}

      <Navbar
        isDark={isDark}
        onToggleTheme={setIsDark}
        onOpenBooking={openBooking}
        startAnimation={!isLoading}
      />

      <main className="flex-grow">
        <HeroSection
          isDark={isDark}
          onToggleTheme={setIsDark}
          onOpenBooking={openBooking}
          startAnimation={!isLoading}
        />
        <ExperienceSection isDark={isDark} onOpenBooking={openBooking} />
        <PoolAndOutdoorsSection isDark={isDark} onOpenBooking={openBooking} />
        <AtmosphereVideoSection isDark={isDark} />
      </main>

      <Footer isDark={isDark} onOpenBooking={openBooking} />

      <BookingModal isDark={isDark} isOpen={isBookingOpen} onClose={closeBooking} />
    </div>
  );
}

