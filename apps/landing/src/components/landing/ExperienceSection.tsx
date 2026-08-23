"use client";
import { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Sparkles,
  X,
  ArrowLeft,
  Share2,
  Heart,
  MapPin,
  Bed,
  Waves,
  Car,
  Shield,
  Eye,
} from 'lucide-react';
import { MEDIA } from '../../constants/media';

interface ExperienceSectionProps {
  isDark?: boolean;
  onOpenBooking?: () => void;
}

export interface InteriorItem {
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

export default function ExperienceSection({
  isDark = true,
  onOpenBooking,
}: ExperienceSectionProps) {
  const [activeCategory, setActiveCategory] = useState<string>('All');
  const [activeIndex, setActiveIndex] = useState<number>(0);
  const [selectedItem, setSelectedItem] = useState<InteriorItem | null>(null);
  const [isLiked, setIsLiked] = useState<boolean>(false);

  // Drag / swipe state
  const dragStartXRef = useRef<number | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const categories = [
    'All',
    'Living Hall',
    'Master Suite',
    'Chef Kitchen',
    'Spa Bath',
    'Outdoor Lounge',
  ];

  const items: InteriorItem[] = [
    {
      id: 'grand-living-hall',
      title: 'Grand Living Hall & Double-Height Atrium',
      category: 'Living Hall',
      location: 'Lonavala, Maharashtra',
      description:
        'An expansive royal gathering lounge featuring 24-foot vaulted ceilings, bespoke Italian marble flooring, and uninterrupted panoramic views of the Khandala valley through floor-to-ceiling acoustic glass.',
      animatedSrc: MEDIA.animated.hall,
      actualSrc: MEDIA.interior[0].src,
      price: '$3,200 / night',
      specs: [
        { icon: 'bed', label: 'Area Size', value: '2,400 sq. ft.' },
        { icon: 'shield', label: 'Acoustics', value: 'Soundproof Glass' },
        { icon: 'car', label: 'Seating', value: '18+ Guests' },
        { icon: 'pool', label: 'Ceiling', value: '24-ft Vaulted' },
      ],
    },
    {
      id: 'master-bedroom-suite',
      title: 'Master Bedroom Sanctuary & Valley Balcony',
      category: 'Master Suite',
      location: 'Lonavala, Maharashtra',
      description:
        'A tranquil private haven equipped with a bespoke king bed, organic silk linens, automated blackout drapery, and a private wraparound stone terrace overlooking serene misty mountains.',
      animatedSrc: MEDIA.animated.bedroom,
      actualSrc: MEDIA.interior[1].src,
      price: '$3,200 / night',
      specs: [
        { icon: 'bed', label: 'Bed Type', value: 'California King' },
        { icon: 'shield', label: 'Privacy', value: 'Private Terrace' },
        { icon: 'car', label: 'Automation', value: 'Smart Mood Lighting' },
        { icon: 'pool', label: 'View', value: 'Valley Panorama' },
      ],
    },
    {
      id: 'modern-chef-kitchen',
      title: 'State-of-the-Art Chef Kitchen & Breakfast Island',
      category: 'Chef Kitchen',
      location: 'Lonavala, Maharashtra',
      description:
        'A master culinary theater equipped with professional-grade Gaggenau appliances, custom quartzite stone countertops, and an integrated wine cellaring wall for private chef dining experiences.',
      animatedSrc: MEDIA.animated.kitchen,
      actualSrc: MEDIA.interior[5].src,
      price: '$3,200 / night',
      specs: [
        { icon: 'bed', label: 'Appliances', value: 'Gaggenau Professional' },
        { icon: 'shield', label: 'Service', value: 'Private Chef Ready' },
        { icon: 'car', label: 'Wine Wall', value: '120-Bottle Cellar' },
        { icon: 'pool', label: 'Countertop', value: 'Natural Quartzite' },
      ],
    },
    {
      id: 'spa-bathroom-suite',
      title: 'Spa-Inspired En-Suite Bathroom & Rain Shower',
      category: 'Spa Bath',
      location: 'Lonavala, Maharashtra',
      description:
        'An indulgent wellness sanctuary lined with hand-selected travertine stone, featuring a monolithic freestanding soaking tub, dual rainfall showers, and heated organic towel warming walls.',
      animatedSrc: MEDIA.animated.bathroom,
      actualSrc: MEDIA.interior[6].src,
      price: '$3,200 / night',
      specs: [
        { icon: 'pool', label: 'Soaking Tub', value: 'Monolithic Stone' },
        { icon: 'shield', label: 'Shower Type', value: 'Dual Rain Shower' },
        { icon: 'bed', label: 'Surfaces', value: 'Italian Travertine' },
        { icon: 'car', label: 'Amenities', value: 'Artisanal Organic' },
      ],
    },
    {
      id: 'outdoor-barbeque-lounge',
      title: 'Alfresco Barbeque Terrace & Sunset Dining Deck',
      category: 'Outdoor Lounge',
      location: 'Lonavala, Maharashtra',
      description:
        'An open-air evening dining terrace crafted with seasoned teakwood decking, a built-in stone charbroiler station, and ambient fire bowls for unforgettable sunset celebrations.',
      animatedSrc: MEDIA.animated.barbeque,
      actualSrc: MEDIA.interior[4].src,
      price: '$4,500 / night',
      specs: [
        { icon: 'pool', label: 'Grill Station', value: 'Stone Charbroiler' },
        { icon: 'bed', label: 'Decking', value: 'Burmese Teakwood' },
        { icon: 'shield', label: 'Capacity', value: '16 Dining Guests' },
        { icon: 'car', label: 'Ambiance', value: 'Warm Fire Bowls' },
      ],
    },
    {
      id: 'panoramic-sunset-lounge',
      title: 'Panoramic Sunset Lounge & Bar Terrace',
      category: 'Outdoor Lounge',
      location: 'Lonavala, Maharashtra',
      description:
        'An open-air stone terrace engineered to capture dramatic Sahyadri sunset hues with custom bronze fire pits.',
      animatedSrc: MEDIA.animated.barbeque,
      actualSrc: isDark ? MEDIA.barbeque.night : MEDIA.barbeque.day,
      price: '$3,400 / night',
      specs: [
        { icon: 'shield', label: 'Elevation', value: 'Top Floor Summit' },
        { icon: 'bed', label: 'Seating', value: 'Hand-Woven Loungers' },
        { icon: 'pool', label: 'Ambiance', value: 'Custom Bronze Fire Pits' },
        { icon: 'car', label: 'Bar Service', value: 'Private Mixologist Station' },
      ],
    },
  ];

  const filteredItems =
    activeCategory === 'All' ? items : items.filter((item) => item.category === activeCategory);

  const count = filteredItems.length || 1;
  const safeActiveIndex = ((activeIndex % count) + count) % count;

  const handleNext = () => setActiveIndex((prev) => (prev + 1) % count);
  const handlePrev = () => setActiveIndex((prev) => (prev - 1 + count) % count);

  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartXRef.current = e.clientX;
    setIsDragging(false);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (dragStartXRef.current === null) return;
    if (Math.abs(e.clientX - dragStartXRef.current) > 10) setIsDragging(true);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (dragStartXRef.current !== null) {
      const diff = e.clientX - dragStartXRef.current;
      if (Math.abs(diff) > 50) diff > 0 ? handlePrev() : handleNext();
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
    <section id="interiors" className="relative py-24 px-4 sm:px-6 md:px-12 w-full overflow-hidden">
      <div className="text-center max-w-3xl mx-auto mb-10 z-30 relative">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.85, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
          className="section-badge inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs uppercase tracking-wider mb-3"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Architectural Mastery</span>
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
          The Villa Interiors &amp; Suites
        </motion.h2>
        <motion.p
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.85, delay: 0.75, ease: [0.16, 1, 0.3, 1] }}
          className={`text-xs sm:text-sm font-light max-w-lg mx-auto mb-6 ${
            isDark ? 'text-white/70' : 'text-black/70'
          }`}
        >
          Swipe right or use controls to rotate 360° through our sanctuary spaces.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.85, delay: 1.05, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-wrap items-center justify-center gap-2 max-w-2xl mx-auto"
        >
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => { setActiveCategory(cat); setActiveIndex(0); }}
              className={`px-4 py-1.5 rounded-full text-xs uppercase tracking-wider font-semibold transition-all ${
                activeCategory === cat
                  ? 'bg-gold text-black'
                  : isDark ? 'bg-white/10 text-white/80' : 'bg-black/5 text-black/80'
              }`}
            >
              {cat}
            </button>
          ))}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0, scale: 0.94 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{ duration: 0.9, delay: 1.35, ease: [0.16, 1, 0.3, 1] }}
        className="relative w-full max-w-5xl mx-auto h-[440px] flex items-center justify-center select-none"
        style={{ touchAction: 'pan-y' }}
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
      >
        {/* 3D Carousel Cards */}
        <div className="relative w-full h-full flex items-center justify-center">
          {filteredItems.map((item, idx) => {
            let diff = idx - safeActiveIndex;
            if (diff > Math.floor(count / 2)) diff -= count;
            if (diff < -Math.floor(count / 2)) diff += count;

            const isActive = diff === 0;

            let translateX = '0%';
            let translateZ = '0px';
            let rotateY = '0deg';
            let opacity = 0.35;
            let zIndex = 1;
            let scale = 0.8;

            if (isActive) {
              translateX = '0%';
              translateZ = '0px';
              rotateY = '0deg';
              opacity = 1;
              zIndex = 30;
              scale = 1;
            } else if (diff === -1 || diff === count - 1) {
              translateX = '-48%';
              translateZ = '-160px';
              rotateY = '24deg';
              opacity = 0.55;
              zIndex = 20;
              scale = 0.8;
            } else if (diff === 1 || diff === -(count - 1)) {
              translateX = '48%';
              translateZ = '-160px';
              rotateY = '-24deg';
              opacity = 0.55;
              zIndex = 20;
              scale = 0.8;
            }

            return (
              <div
                key={item.id}
                className={`absolute w-[86%] max-w-[350px] sm:w-[68%] sm:max-w-[500px] md:w-[58%] md:max-w-[620px] h-[390px] sm:h-[460px] md:h-[500px] rounded-[30px] border backdrop-blur-2xl shadow-2xl transition-all duration-700 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col justify-between p-5 sm:p-7 md:p-8 overflow-hidden group ${
                  isDark
                    ? isActive
                      ? 'border-gold/50 bg-[#141B24] text-white shadow-black/90'
                      : 'border-white/15 bg-gradient-to-b from-white/15 via-black/85 to-black/95 text-white'
                    : isActive
                    ? 'border-gold/60 bg-[#FFFFFF] text-black shadow-black/15'
                    : 'border-black/15 bg-gradient-to-b from-[#EDE9E0]/95 to-[#E2DDD3]/95 text-black'
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
                    className="w-full max-h-[190px] sm:max-h-[250px] object-contain floating-anim drop-shadow-2xl opacity-90 group-hover:opacity-100 transition-all duration-700 group-hover:scale-105"
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
                    <p
                      className={`text-xs sm:text-sm line-clamp-2 font-light max-w-sm ${
                        isDark ? 'text-white/70' : 'text-black/70'
                      }`}
                    >
                      {item.description}
                    </p>
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
          {filteredItems.map((_, idx) => (
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
        <span
          className={`text-[11px] uppercase tracking-wider font-light ${
            isDark ? 'text-white/55' : 'text-black/55'
          }`}
        >
          Scroll horizontally, drag slider, or swipe to rotate 360°
        </span>
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
                      className="w-full h-full object-contain floating-anim drop-shadow-2xl"
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


