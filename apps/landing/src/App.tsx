import { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import HeroSection from './components/HeroSection';
import ExperienceSection from './components/ExperienceSection';
import PoolAndOutdoorsSection from './components/PoolAndOutdoorsSection';
import AtmosphereVideoSection from './components/AtmosphereVideoSection';
import Footer from './components/Footer';
import BookingModal from './components/BookingModal';
import Preloader from './components/Preloader';

export default function App() {
  // Start in Night mode by default as requested
  const [isDark, setIsDark] = useState(true);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    document.body.classList.toggle('light-theme', !isDark);
  }, [isDark]);

  const openBooking = () => setIsBookingOpen(true);
  const closeBooking = () => setIsBookingOpen(false);

  return (
    <div className="min-h-screen flex flex-col selection:bg-gold selection:text-black">
      {isLoading && <Preloader onComplete={() => setIsLoading(false)} />}

      <Navbar
        isDark={isDark}
        onToggleTheme={setIsDark}
        onOpenBooking={openBooking}
      />

      <main className="flex-grow">
        <HeroSection
          isDark={isDark}
          onToggleTheme={setIsDark}
          onOpenBooking={openBooking}
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
