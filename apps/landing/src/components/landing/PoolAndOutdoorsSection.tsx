"use client";
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Waves,
  X,
  ArrowLeft,
  Share2,
  Heart,
  MapPin,
  Bed,
  Car,
  Shield,
  Eye,
} from 'lucide-react';
import { MEDIA } from '../../constants/media';

interface PoolAndOutdoorsProps {
  isDark?: boolean;
  onOpenBooking?: () => void;
}

export interface OutdoorItem {
  id: string;
  title: string;
  category: string;
  location: string;
  description: string;
  animatedSrc: string;
  actualSrc: string;
  price: string;
  specs: Array<{
    icon: string;
    label: string;
    value: string;
  }>;
}

export default function PoolAndOutdoorsSection({
  isDark = true,
  onOpenBooking,
}: PoolAndOutdoorsProps) {
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [selectedItem, setSelectedItem] = useState<OutdoorItem | null>(null);
  const [isLiked, setIsLiked] = useState<boolean>(false);

  // Drag / swipe state
  const dragStartXRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const items: OutdoorItem[] = [
    {
      id: 'infinity-pool',
      title: 'Infinity Pool',
      category: 'Private Infinity Pool',
      location: 'Lonavala, Maharashtra',
      description: isDark
        ? 'Immerse yourself in crystal-clear evening waters illuminated by ambient luxury pool lighting under a canopy of starlight.'
        : 'Wake up to sunlit turquoise waters surrounded by lush tropical greenery and private teak loungers.',
      animatedSrc: MEDIA.animated.pool,
      actualSrc: isDark ? MEDIA.pool.night[0] : MEDIA.pool.day[0],
      price: '$3,200 / night',
      specs: [
        { icon: 'pool', label: 'Pool Type', value: 'Infinity Edge' },
        { icon: 'bed', label: 'Deck Area', value: 'Teak Loungers' },
        { icon: 'shield', label: 'Lighting', value: 'Ambient Glow' },
        { icon: 'car', label: 'Privacy', value: '100% Private' },
      ],
    },
    {
      id: 'grand-entrance',
      title: 'Villa Entrance',
      category: 'Grand Architecture',
      location: 'Lonavala, Maharashtra',
      description: isDark
        ? 'A dramatic royal entrance path featuring warm architectural uplighting, bespoke masonry, and serene stone pathways.'
        : 'An inviting daytime approach showcasing natural stone architecture, private courtyards, and tranquil garden acoustics.',
      animatedSrc: '/entrance-custom.png',
      actualSrc: isDark ? MEDIA.entrance.night : MEDIA.entrance.day,
      price: '$3,200 / night',
      specs: [
        { icon: 'car', label: 'Driveway', value: 'Private Approach' },
        { icon: 'shield', label: 'Security', value: '24/7 Gated' },
        { icon: 'bed', label: 'Landscaping', value: 'Lush Gardens' },
        { icon: 'pool', label: 'Architecture', value: 'Bespoke Stone' },
      ],
    },
    {
      id: 'balcony-view',
      title: 'Valley Balcony',
      category: 'Balcony View',
      location: 'Lonavala, Maharashtra',
      description: isDark
        ? 'An intimate private stone terrace overlooking the serene misty valley, illuminated by soft starlight and evening ambient glow.'
        : 'A sunlit morning terrace offering panoramic 180° views of the lush Khandala valley and refreshing mountain breezes.',
      animatedSrc: isDark ? '/balcony-night.png' : '/balcony-day.png',
      actualSrc: isDark ? MEDIA.balcony.night : MEDIA.balcony.day,
      price: '$3,200 / night',
      specs: [
        { icon: 'shield', label: 'View', value: '180° Valley Panorama' },
        { icon: 'bed', label: 'Seating', value: 'Teakwood Lounge' },
        { icon: 'pool', label: 'Elevation', value: 'Upper Estate Level' },
        { icon: 'car', label: 'Ambiance', value: 'Mountain Breeze' },
      ],
    },
  ];

  const count = items.length;
  const safeActiveIndex = ((activeIndex % count) + count) % count;

  const handleNext = () => {
    setActiveIndex((prev) => (prev + 1) % count);
  };

  const handlePrev = () => {
    setActiveIndex((prev) => (prev - 1 + count) % count);
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartXRef.current = e.clientX;
    setIsDragging(false);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragStartXRef.current === null) return;
    const diff = e.clientX - dragStartXRef.current;
    if (Math.abs(diff) > 10) {
      setIsDragging(true);
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragStartXRef.current !== null) {
      const diff = e.clientX - dragStartXRef.current;
      if (diff > 50) {
        handlePrev();
      } else if (diff < -50) {
        handleNext();
      }
    }
    dragStartXRef.current = null;
  };

  const wheelTimeoutRef = useRef<boolean>(false);

  const handleWheel = (e: React.WheelEvent) => {
    if (wheelTimeoutRef.current) return;
    if (Math.abs(e.deltaX) > Math.abs(e.deltaY) && Math.abs(e.deltaX) > 25) {
      if (e.deltaX > 0) {
        handleNext();
      } else {
        handlePrev();
      }
      wheelTimeoutRef.current = true;
      setTimeout(() => {
        wheelTimeoutRef.current = false;
      }, 380);
    }
  };

  const renderIcon = (iconName: string) => {
    switch (iconName) {
      case 'bed':
        return <Bed className="w-5 h-5 text-gold" />;
      case 'pool':
        return <Waves className="w-5 h-5 text-gold" />;
      case 'car':
        return <Car className="w-5 h-5 text-gold" />;
      case 'shield':
      default:
        return <Shield className="w-5 h-5 text-gold" />;
    }
  };

  return (
    <section id="outdoors" className="relative py-24 px-4 sm:px-6 md:px-12 w-full overflow-hidden">
      {/* Section Header */}
      <div className="text-center max-w-3xl mx-auto mb-10 z-30 relative">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.85, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="section-badge inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs uppercase tracking-wider mb-3"
        >
          <Waves className="w-3.5 h-3.5" />
          <span>Infinity Pool &amp; Grounds</span>
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.85, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className={`text-3xl sm:text-4xl md:text-5xl font-serif mb-3 leading-tight ${
            isDark ? 'text-white' : 'text-black'
          }`}
        >
          The Luxury Experience
        </motion.h2>
        {/* Removed instruction paragraph as requested */}
      </div>

      {/* 360° 3D Rotating Carousel Container */}
      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.9, delay: 1.05, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-5xl mx-auto h-[440px] sm:h-[520px] md:h-[600px] flex items-center justify-center select-none cursor-grab active:cursor-grabbing carousel-3d-container"
        style={{ touchAction: 'pan-y' }}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* 3D Carousel Cards */}
        <div className="relative w-full h-full flex items-center justify-center">
          {items.map((item, idx) => {
            let diff = idx - safeActiveIndex;
            if (diff > Math.floor(count / 2)) diff -= count;
            if (diff < -Math.floor(count / 2)) diff += count;

            const isActive = diff === 0;

            let translateX = '0%';
            let translateZ = '-300px';
            let rotateY = '0deg';
            let opacity = 0;
            let zIndex = 1;
            let scale = 0.6;

            if (isActive) {
              translateX = '0%';
              translateZ = '0px';
              rotateY = '0deg';
              opacity = 1;
              zIndex = 30;
              scale = 1;
            } else if (diff === -1 || diff === count - 1) {
              translateX = '-55%';
              translateZ = '-200px';
              rotateY = '24deg';
              opacity = 0.15;
              zIndex = 20;
              scale = 0.8;
            } else if (diff === 1 || diff === -(count - 1)) {
              translateX = '55%';
              translateZ = '-200px';
              rotateY = '-24deg';
              opacity = 0.15;
              zIndex = 20;
              scale = 0.8;
            }

            return (
              <div
                key={item.id}
                className={`absolute w-[86%] max-w-[350px] sm:w-[68%] sm:max-w-[500px] md:w-[58%] md:max-w-[620px] h-[390px] sm:h-[460px] md:h-[500px] rounded-[30px] flex flex-col justify-between p-5 sm:p-7 md:p-8 overflow-hidden group transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] ${
                  isDark ? 'glass-card text-foreground' : 'bg-white/80 backdrop-blur-2xl border border-black/10 shadow-2xl text-black'
                } ${
                  isActive ? (isDark ? 'glass-gold shadow-2xl' : 'glass-gold shadow-[0_20px_50px_rgba(0,0,0,0.2)]') : ''
                }`}
                style={{
                  transform: `translate3d(${translateX}, 0, ${translateZ}) rotateY(${rotateY}) scale(${scale})`,
                  opacity,
                  zIndex,
                  pointerEvents: isActive ? 'auto' : 'none',
                }}
              >
                {/* Top Bar inside Card */}
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs uppercase tracking-widest text-gold font-semibold">
                    {item.category}
                  </span>
                  <span
                    className={`text-xs font-mono ${
                      isDark ? 'text-white/50' : 'text-black/50'
                    }`}
                  >
                    {String(safeActiveIndex + 1).padStart(2, '0')} / {String(count).padStart(2, '0')}
                  </span>
                </div>

                {/* Animated Architectural Silhouette PNG in Center */}
                <div
                  className="w-full flex-grow flex items-center justify-center my-3 sm:my-4 cursor-pointer"
                  onClick={() => {
                    if (!isDragging) {
                      setSelectedItem(item);
                    }
                  }}
                >
                  <img
                    src={item.animatedSrc}
                    alt={`${item.title} Silhouette`}
                    className={`w-full max-h-[190px] sm:max-h-[250px] object-contain floating-anim drop-shadow-2xl opacity-90 group-hover:opacity-100 transition-all duration-700 ${
                      item.id === 'grand-entrance'
                        ? 'scale-[1.5] group-hover:scale-[1.55]'
                        : 'group-hover:scale-105'
                    }`}
                  />
                </div>

                {/* Bottom Metadata & View Button */}
                <div className="flex flex-col sm:flex-row items-start sm:items-end justify-between gap-3 sm:gap-4 mt-auto">
                  <div>
                    <h3
                      className={`text-xl sm:text-2xl md:text-3xl font-serif font-medium mb-1 transition-colors ${
                        isDark ? 'text-white group-hover:text-gold' : 'text-black group-hover:text-gold'
                      }`}
                    >
                      {item.title}
                    </h3>
                  </div>

                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (!isDragging) {
                        setSelectedItem(item);
                      }
                    }}
                    className="group/btn relative inline-flex items-center justify-center px-5 py-2 sm:px-6 sm:py-2.5 rounded-full bg-gold text-black font-semibold uppercase tracking-wider text-xs hover:bg-gold/90 transition-all shadow-lg hover:-translate-y-0.5 flex-shrink-0"
                  >
                    <span>View</span>
                    <Eye className="w-3.5 h-3.5 ml-1.5 group-hover/btn:scale-110 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </motion.div>

      {/* Interactive Left-Right Scroll Slider & Progress Track for 360 Rotation */}
      <div className="flex flex-col items-center justify-center gap-3 mt-8 sm:mt-10 z-30 relative max-w-md mx-auto px-4">
        <div className="w-full flex items-center gap-4">
          <span className="text-[11px] font-mono uppercase tracking-widest font-semibold text-gold">
            {String(safeActiveIndex + 1).padStart(2, '0')}
          </span>
          <div className="relative flex-grow flex items-center">
            <input
              type="range"
              min={0}
              max={count - 1}
              value={safeActiveIndex}
              onChange={(e) => setActiveIndex(Number(e.target.value))}
              className="w-full h-1.5 bg-gold/20 rounded-lg appearance-none cursor-pointer accent-gold focus:outline-none transition-all"
              aria-label="360 Rotation Horizontal Scroll Bar"
            />
          </div>
          <span className="text-[11px] font-mono uppercase tracking-widest font-semibold text-gold">
            {String(count).padStart(2, '0')}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {items.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setActiveIndex(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === safeActiveIndex
                  ? 'w-6 bg-gold shadow-md'
                  : isDark
                  ? 'w-1.5 bg-white/30 hover:bg-white/60'
                  : 'w-1.5 bg-black/20 hover:bg-black/50'
              }`}
              aria-label={`Jump to 360 view ${idx + 1}`}
            />
          ))}
        </div>
        {/* Removed instruction text as requested */}
      </div>

      {/* Detail View Modal (Actual Photo + Animated Icon + Specs) */}
      {selectedItem && (
        <div
          className={`fixed inset-0 z-50 backdrop-blur-2xl flex flex-col overflow-y-auto animate-fade-in ${
            isDark ? 'bg-black/95 text-white' : 'bg-[#F7F5F1]/95 text-black'
          }`}
          onClick={() => setSelectedItem(null)}
          role="dialog"
          aria-modal="true"
        >
          {/* Fixed Top Navigation inside Modal */}
          <nav
            className={`sticky top-0 w-full z-50 backdrop-blur-xl border-b h-16 sm:h-20 flex justify-between items-center px-4 sm:px-6 md:px-12 ${
              isDark
                ? 'bg-black/70 border-white/10 text-white'
                : 'bg-[#F7F5F1]/90 border-black/10 text-black'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setSelectedItem(null)}
              className="flex items-center gap-2 hover:text-gold transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
              <span className="text-xs font-semibold tracking-widest uppercase hidden sm:inline">
                BACK
              </span>
            </button>

            <div
              className="font-serif text-lg sm:text-2xl font-medium tracking-tight cursor-pointer truncate max-w-[200px] sm:max-w-none"
              onClick={() => setSelectedItem(null)}
            >
              Aura • Seven C Villa
            </div>

            <div className="flex items-center gap-4 sm:gap-6">
              <button
                type="button"
                className="hover:text-gold transition-colors"
                aria-label="Share space"
              >
                <Share2 className="w-5 h-5" />
              </button>
              <button
                type="button"
                onClick={() => setIsLiked(!isLiked)}
                className={`transition-colors ${
                  isLiked ? 'text-red-500' : 'hover:text-gold'
                }`}
                aria-label="Favorite space"
              >
                <Heart
                  className="w-5 h-5"
                  fill={isLiked ? 'currentColor' : 'none'}
                />
              </button>
              <button
                type="button"
                onClick={() => setSelectedItem(null)}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full flex items-center justify-center transition-colors ml-1 sm:ml-2 ${
                  isDark
                    ? 'bg-white/10 text-white hover:bg-gold hover:text-black'
                    : 'bg-black/10 text-black hover:bg-gold hover:text-black'
                }`}
                aria-label="Close modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </nav>

          {/* Main 50/50 Detail Content (Responsive 16:9 Photo on Mobile) */}
          <main
            className="flex-grow flex flex-col md:flex-row w-full max-w-[1440px] mx-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left Side: Environmental / Actual Image (16:9 aspect ratio on mobile so specs appear above fold) */}
            <section
              className={`w-full md:w-1/2 h-64 sm:h-80 md:h-[calc(100vh-80px)] relative overflow-hidden border-r ${
                isDark ? 'border-white/10' : 'border-black/10'
              }`}
            >
              <div
                className="w-full h-full bg-cover bg-center absolute inset-0 transition-all duration-1000 scale-105"
                style={{ backgroundImage: `url('${selectedItem.actualSrc}')` }}
              />
              <div
                className={`absolute inset-0 ${
                  isDark
                    ? 'bg-gradient-to-t from-black/80 via-transparent to-black/30 md:bg-gradient-to-r md:from-transparent md:to-black/50'
                    : 'bg-gradient-to-t from-black/50 via-transparent to-transparent md:bg-gradient-to-r md:from-transparent md:to-black/25'
                }`}
              />
            </section>

            {/* Right Side: Animated Icon + Specifications + Pricing */}
            <section
              className={`w-full md:w-1/2 min-h-[calc(100vh-80px)] md:overflow-y-auto relative flex flex-col justify-between py-8 sm:py-10 px-5 sm:px-12 ${
                isDark ? 'bg-black/90 text-white' : 'bg-[#FDFCF9] text-black'
              }`}
            >
              <div>
                {/* Floating Animated Silhouette Icon at Top */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full flex flex-col items-center max-w-lg mx-auto mb-6 sm:mb-8"
                >
                  <div className="w-full max-w-[240px] sm:max-w-xs h-36 sm:h-48 mb-4 sm:mb-6 relative flex items-center justify-center">
                    <img
                      src={selectedItem.animatedSrc}
                      alt={`${selectedItem.title} Animated Silhouette`}
                      className={`w-full h-full object-contain floating-anim drop-shadow-2xl ${
                        selectedItem.id === 'grand-entrance' ? 'scale-[1.5]' : ''
                      }`}
                    />
                  </div>

                  <h1 className="font-serif text-2xl sm:text-4xl md:text-5xl text-center mb-2">
                    {selectedItem.title}
                  </h1>
                  <p className="text-xs uppercase tracking-widest text-gold flex items-center justify-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> {selectedItem.location}
                  </p>
                </motion.div>

                {/* Description */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full max-w-lg mx-auto mb-8 sm:mb-10"
                >
                  <p
                    className={`text-sm sm:text-base text-center md:text-left leading-relaxed font-light ${
                      isDark ? 'text-white/80' : 'text-black/80'
                    }`}
                  >
                    {selectedItem.description}
                  </p>
                </motion.div>

                {/* Specifications List */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.65, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
                  className="w-full max-w-lg mx-auto mb-10 sm:mb-12 space-y-3 sm:space-y-4"
                >
                  {selectedItem.specs.map((spec, i) => (
                    <div
                      key={i}
                      className={`flex items-center justify-between py-3 border-b ${
                        isDark ? 'border-white/10' : 'border-black/10'
                      }`}
                    >
                      <span
                        className={`text-sm flex items-center gap-3 ${
                          isDark ? 'text-white/70' : 'text-black/70'
                        }`}
                      >
                        {renderIcon(spec.icon)}
                        <span>{spec.label}</span>
                      </span>
                      <span className="font-serif text-base sm:text-lg font-medium">
                        {spec.value}
                      </span>
                    </div>
                  ))}
                </motion.div>
              </div>
            </section>
          </main>
        </div>
      )}
    </section>
  );
}


