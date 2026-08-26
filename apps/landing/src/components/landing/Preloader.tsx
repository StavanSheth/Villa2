"use client";
import { useState, useEffect, useRef } from 'react';
import './Preloader.css';

interface PreloaderProps {
  onComplete?: () => void;
}

export default function Preloader({ onComplete }: PreloaderProps) {
  const [progress, setProgress] = useState(0);
  const [isFading, setIsFading] = useState(false);
  const assetsLoadedRef = useRef(false);

  useEffect(() => {
    const handleLoad = () => {
      assetsLoadedRef.current = true;
    };
    
    if (document.readyState === 'complete') {
      assetsLoadedRef.current = true;
    } else {
      window.addEventListener('load', handleLoad);
      return () => window.removeEventListener('load', handleLoad);
    }
  }, []);

  useEffect(() => {
    const startTime = Date.now();
    const duration = 4500; // Minimum 4.5 seconds loading duration

    const interval = window.setInterval(() => {
      const elapsed = Date.now() - startTime;
      let nextProgress = Math.floor((elapsed / duration) * 100);

      // Hold at 99% if 4.5s has elapsed but assets haven't finished loading
      if (nextProgress >= 99 && !assetsLoadedRef.current) {
        nextProgress = 99;
      } else if (nextProgress >= 100 && assetsLoadedRef.current) {
        nextProgress = 100;
        window.clearInterval(interval);
        window.setTimeout(() => {
          setIsFading(true);
          window.setTimeout(() => {
            if (onComplete) onComplete();
          }, 700);
        }, 300);
      }

      setProgress(Math.min(100, Math.max(0, nextProgress)));
    }, 30);

    return () => window.clearInterval(interval);
  }, [onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-white flex flex-col items-center justify-center p-4 transition-opacity duration-700 select-none overflow-hidden ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      {/* Centered Car Preloader above the loading line */}
      <div className="relative flex items-center justify-center w-[380px] h-[360px] scale-[0.8] sm:scale-95 md:scale-100 flex-shrink-0 -mt-10">
        <Loader />
      </div>

      {/* Loading line from 0-100% and branding neatly positioned below the preloader */}
      <div className="w-full max-w-xs sm:max-w-md px-6 mt-4 flex flex-col items-center gap-3 z-10">
        {/* Progress Line and Text Row */}
        <div className="flex items-center w-full gap-4">
          {/* Loading Line 0-100% */}
          <div className="flex-grow h-1.5 bg-accent rounded-full overflow-hidden shadow-inner border border-border">
            <div
              className="h-full bg-gradient-to-r from-[#911717] via-[#ba1c1c] to-[#d4af37] transition-all duration-75 ease-out rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          
          {/* Loading Progress Text */}
          <span className="text-[20px] font-mono text-[#ba1c1c] font-bold min-w-[3rem] text-right">
            {progress}%
          </span>
        </div>

        <span className="text-xs uppercase tracking-[0.3em] text-black/60 font-light mt-1 text-center">
          Preparing your experience
        </span>
      </div>
    </div>
  );
}

const Loader = () => {
  return (
    <div className="preloader-wrapper">
      <div className="container">
        <div className="car-container">
          <div className="car" />
          <div className="front-part" />
          <div className="front-part2" />
          <div className="front-part3" />
          <div className="bottom-part" />
          <div className="wheel-container wheel-container1" />
          <div className="wheel-container wheel-container2" />
          <div className="wheel-back" />
          <div className="window" />
          <div className="window2" />
          <div className="window3" />
          <div className="details" />
          <div className="details2" />
          <div className="details3" />
          <div className="details4" />
          <div className="details5" />
          <div className="bumper" />
          <div className="bumper2" />
          <div className="head-lights" />
          <div className="tail-lights" />
          <div className="extra-lighting-details" />
          <div className="extra-lighting-details2" />
          <div className="extra-lighting-details3" />
        </div>
        <div className="container-wheel1">
          <div className="wheel-break" />
          <div className="wheel-ring wheel-ring1">
            <div className="wheel-center" />
            <div className="wheel-center2" />
            <div className="wheel-ring-stick" />
            <div className="wheel-ring-stick wheel-ring-stick2" />
            <div className="wheel-ring-stick wheel-ring-stick3" />
            <div className="wheel-ring-stick wheel-ring-stick4" />
            <div className="wheel-ring-stick wheel-ring-stick5" />
            <div className="wheel-logo" />
          </div>
        </div>
        <div className="container-wheel2">
          <div className="wheel-break2" />
          <div className="wheel-ring2 wheel-ring">
            <div className="wheel-center" />
            <div className="wheel-center2" />
            <div className="wheel-ring-stick" />
            <div className="wheel-ring-stick wheel-ring-stick2" />
            <div className="wheel-ring-stick wheel-ring-stick3" />
            <div className="wheel-ring-stick wheel-ring-stick4" />
            <div className="wheel-ring-stick wheel-ring-stick5" />
            <div className="wheel-logo" />
          </div>
        </div>
        <div className="street">
          <div className="line" />
          <div className="obstacles" />
        </div>
      </div>
    </div>
  );
};
