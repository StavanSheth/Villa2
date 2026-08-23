'use client';
import React, { useState, useEffect, useCallback } from 'react';
import { ReservationGrid } from './ReservationGrid';
import { BookingTypeSelector } from './BookingTypeSelector';
import { PaymentRequiredToggle } from './PaymentRequiredToggle';
import { BookingDetailsDrawer } from './BookingDetailsDrawer';
import { Home, Users, Calendar, Sparkles, CreditCard, CheckCircle2, Tag, ClipboardList, Upload, FileText } from 'lucide-react';
import {
  BOOKING_TYPE_RULES,
  type BookingMode,
  type BookingType,
  type BookingTypeRules,
  type CalendarBookingEntry,
} from '@villa-platform/types';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NightlyPrice {
  date: string;
  dayOfWeek: string;
  price: number;
  ruleApplied: string;
}

interface ServiceLineItem {
  name: string;
  chargeType: string;
  unitPrice: number;
  quantity: number;
  total: number;
}

interface PricingSummary {
  nights: number;
  nightlyBreakdown: NightlyPrice[];
  baseAccommodation: number;
  cleaningFee: number;
  platformFee: number;
  serviceBreakdown: ServiceLineItem[];
  servicesTotal: number;
  discount: number;
  discountLabel: string | null;
  subtotal: number;
  gst: number;
  total: number;
}

interface ServiceDef {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  type: string;
  chargeType: string;
  price: number;
  taxable: boolean;
}

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface BookingWizardProps {
  mode?: BookingMode;
  villaId?: string;             // Pre-selected villa (owner mode)
  calendarEntries?: CalendarBookingEntry[];
  onComplete?: (booking: any) => void;
  editBookingData?: any;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDateLocal(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ---------------------------------------------------------------------------
// Step Definitions — dynamic based on mode and booking type
// ---------------------------------------------------------------------------

function getSteps(mode: BookingMode, rules: BookingTypeRules, bookingType: BookingType) {
  const steps = [
    { id: 'villa', title: 'Villa', icon: Home },
    { id: 'dates', title: 'Dates', icon: Calendar },
  ];

  // Booking Type step (owner/staff only) - PRIOR TO GUESTS
  if (mode !== 'CUSTOMER') {
    steps.push({ id: 'type', title: 'Type', icon: Tag });
  }

  if (bookingType !== 'MAINTENANCE' && bookingType !== 'BLOCKED') {
    steps.push({ id: 'guests', title: 'Guests', icon: Users });
    steps.push({ id: 'services', title: 'Services', icon: Sparkles });

    // Payment step — only when visible
    if (rules.paymentStepVisible) {
      steps.push({ id: 'payment', title: 'Payment', icon: CreditCard });
    }
  }

  steps.push({ id: 'done', title: 'Done', icon: CheckCircle2 });

  return steps.map((s, i) => ({ ...s, num: i + 1 }));
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export const BookingWizard: React.FC<BookingWizardProps> = ({
  mode = 'CUSTOMER',
  villaId: preselectedVillaId,
  calendarEntries: propCalendarEntries = [],
  onComplete,
  editBookingData,
}) => {
  // --- Step State ---
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [selectedVilla, setSelectedVilla] = useState<string | null>(editBookingData?.villaId || preselectedVillaId || null);
  const [dateRange, setDateRange] = useState<{start: Date | null, end: Date | null}>(() => {
    if (editBookingData?.nightlyBreakdown && editBookingData.nightlyBreakdown.length > 0) {
      const dates = editBookingData.nightlyBreakdown;
      const startStr = dates[0].date;
      const endStr = dates[dates.length - 1].date;
      const endDate = new Date(`${endStr}T00:00:00`);
      endDate.setDate(endDate.getDate() + 1); // Checkout is day after last night
      return { start: new Date(`${startStr}T00:00:00`), end: endDate };
    }
    return editBookingData ? { start: new Date(editBookingData.checkIn), end: new Date(editBookingData.checkOut) } : { start: null, end: null };
  });
  const [selectedDatesList, setSelectedDatesList] = useState<Date[]>(() => {
    if (editBookingData?.nightlyBreakdown && editBookingData.nightlyBreakdown.length > 0) {
      return editBookingData.nightlyBreakdown.map((n: any) => new Date(`${n.date}T00:00:00`));
    }
    if (editBookingData?.checkIn && editBookingData?.checkOut) {
      const dates: Date[] = [];
      const current = new Date(editBookingData.checkIn);
      current.setHours(0, 0, 0, 0);
      const end = new Date(editBookingData.checkOut);
      end.setHours(0, 0, 0, 0);
      while (current < end) {
        dates.push(new Date(current));
        current.setDate(current.getDate() + 1);
      }
      return dates;
    }
    return [];
  });

  // --- Booking Type (Owner/Staff mode) ---
  const [bookingType, setBookingType] = useState<BookingType>(editBookingData?.bookingType || (mode === 'CUSTOMER' ? 'NORMAL' : 'NORMAL'));
  const [bookingReason, setBookingReason] = useState(editBookingData?.bookingReason || '');
  const [internalNotes, setInternalNotes] = useState(editBookingData?.internalNotes || '');

  // --- Payment Override (Owner toggle) ---
  const [paymentOverride, setPaymentOverride] = useState<boolean | null>(editBookingData ? editBookingData.paymentRequired : null);

  // --- Services State ---
  const [allServices, setAllServices] = useState<ServiceDef[]>([]);
  const [selectedServiceIds, setSelectedServiceIds] = useState<Set<string>>(() => {
    const ids = new Set<string>();
    if (editBookingData?.servicesSnapshot) {
      editBookingData.servicesSnapshot.forEach((s: any) => ids.add(s.serviceDefId || s.id || s.name));
    }
    return ids;
  });
  const [serviceQuantities, setServiceQuantities] = useState<Map<string, number>>(new Map());
  const [serviceSelectedDates, setServiceSelectedDates] = useState<Map<string, Set<string>>>(new Map());
  const [chefMembersCount, setChefMembersCount] = useState<Map<string, number>>(new Map());
  const [dailyGuestsCount, setDailyGuestsCount] = useState<Map<string, {adults: number, children: number}>>(() => {
    const m = new Map<string, {adults: number, children: number}>();
    if (editBookingData?.nightlyBreakdown) {
      editBookingData.nightlyBreakdown.forEach((n: any) => {
        if (n.guests) {
          m.set(n.date, { adults: n.guests.adults, children: n.guests.children });
        }
      });
    }
    return m;
  });

  const totalGuests = dailyGuestsCount.size > 0 
    ? Math.max(...Array.from(dailyGuestsCount.values()).map(g => g.adults + g.children))
    : (editBookingData?.totalGuests || 2);

  const [guestIdProofs, setGuestIdProofs] = useState<{name: string, url: string, type: string}[]>(() => {
    if (editBookingData?.guestIdProofs) {
      return editBookingData.guestIdProofs.map((p: any) => ({
        name: p.guestName || 'Guest',
        url: p.fileUrl,
        type: p.fileType,
      }));
    }
    return [];
  });

  // --- Promo State ---
  const [promoCodeInput, setPromoCodeInput] = useState(editBookingData?.promoCode?.code || '');
  const [appliedPromoCode, setAppliedPromoCode] = useState<string | null>(editBookingData?.promoCode?.code || null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [promoSuccess, setPromoSuccess] = useState<string | null>(null);

  // --- Pricing (from server) ---
  const [pricing, setPricing] = useState<PricingSummary | null>(null);
  const [isPricingLoading, setIsPricingLoading] = useState(false);

  const [paymentType, setPaymentType] = useState<'FULL' | 'ADVANCE'>(
    editBookingData?.paymentType === 'ADVANCE' ? 'ADVANCE' : 'FULL'
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [bookingResult, setBookingResult] = useState<any>(null);
  const [walletBalance, setWalletBalance] = useState<number>(0);

  React.useEffect(() => {
    if (mode === 'CUSTOMER') {
      fetch('/api/wallet')
        .then(res => res.json())
        .then(data => {
          if (data && typeof data.walletBalance === 'number') {
            setWalletBalance(data.walletBalance);
          }
        })
        .catch(console.error);
    }
  }, [mode]);

  // --- Drawer State (for calendar entry clicks) ---
  const [drawerBooking, setDrawerBooking] = useState<any>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);

  // --- Derived Rules ---
  const rules = BOOKING_TYPE_RULES[bookingType];
  const steps = getSteps(mode, rules, bookingType);
  const safeStepIndex = Math.min(currentStepIndex, steps.length - 1);
  
  useEffect(() => {
    if (currentStepIndex > steps.length - 1) {
      setCurrentStepIndex(steps.length - 1);
    }
  }, [currentStepIndex, steps.length]);

  const currentStep = steps[safeStepIndex];

  // --- Navigation ---
  const handleNext = () => setCurrentStepIndex(prev => Math.min(prev + 1, steps.length - 1));
  const handlePrev = () => setCurrentStepIndex(prev => Math.max(prev - 1, 0));

  // If villa is preselected (owner mode), skip villa step
  useEffect(() => {
    if (preselectedVillaId && currentStepIndex === 0) {
      setSelectedVilla(preselectedVillaId);
      setCurrentStepIndex(1); // Skip to dates
    }
  }, [preselectedVillaId, currentStepIndex]);

  const [dbBookings, setDbBookings] = useState<any[]>([]);

  // --- Fetch services & live database bookings on mount ---
  useEffect(() => {
    fetch('/api/services')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setAllServices(data);
          
          // Hydrate services state if editing
          if (editBookingData?.servicesSnapshot) {
            const ids = new Set<string>();
            const qtys = new Map<string, number>();
            const dates = new Map<string, Set<string>>();
            const chef = new Map<string, number>();
            
            editBookingData.servicesSnapshot.forEach((snap: any) => {
              const def = data.find((d: any) => d.name === snap.name);
              if (def) {
                ids.add(def.id);
                if (snap.quantity) qtys.set(def.id, snap.quantity);
                if (snap.dates) dates.set(def.id, new Set(snap.dates));
                if (snap.chefGuests) chef.set(def.id, snap.chefGuests);
              }
            });
            
            setSelectedServiceIds(ids);
            setServiceQuantities(qtys);
            setServiceSelectedDates(dates);
            setChefMembersCount(chef);
          }
        }
      })
      .catch(console.error);

    fetch('/api/bookings')
      .then(res => res.json())
      .then(data => { if (Array.isArray(data)) setDbBookings(data); })
      .catch(console.error);
  }, [editBookingData]);

  const calendarEntries = propCalendarEntries.length > 0 
    ? propCalendarEntries 
    : dbBookings
        .filter((b: any) => {
          if (editBookingData && (b.id === editBookingData.id || b.bookingCode === editBookingData.bookingCode)) {
            return false;
          }
          return b.status !== 'CANCELLED' && b.status !== 'ARCHIVED';
        })
        .map((b: any) => {
          let parsedDates: string[] = [];
          if (b.orderTransactions && b.orderTransactions.length > 0) {
            const tx = b.orderTransactions[0];
            if (tx.snapshotStaySegments) {
              const segments = tx.snapshotStaySegments as { checkIn: string, checkOut: string }[];
              segments.forEach(seg => {
                const start = new Date(seg.checkIn);
                start.setHours(0, 0, 0, 0);
                const end = new Date(seg.checkOut);
                end.setHours(0, 0, 0, 0);
                let current = new Date(start);
                while (current < end) {
                  const y = current.getFullYear();
                  const m = String(current.getMonth() + 1).padStart(2, '0');
                  const d = String(current.getDate()).padStart(2, '0');
                  parsedDates.push(`${y}-${m}-${d}`);
                  current.setDate(current.getDate() + 1);
                }
              });
            }
          }
          
          return {
            bookingId: b.id,
            bookingCode: b.bookingCode,
            type: (b.bookingSource === 'OWNER' ? 'OWNER' : 'CUSTOMER') as any,
            bookingType: (b.bookingType || 'NORMAL') as any,
            status: b.status,
            checkIn: b.checkIn,
            checkOut: b.checkOut,
            label: b.bookingCode,
            selectedDates: parsedDates.length > 0 ? parsedDates : (b.nightlyBreakdown ? b.nightlyBreakdown.map((n: any) => n.date) : []),
          };
        });

  // --- Fetch server-side pricing whenever inputs change ---
  const fetchPricing = useCallback(async () => {
    if (!dateRange.start || !dateRange.end || selectedDatesList.length === 0) {
      setPricing(null);
      return;
    }
    setIsPricingLoading(true);
    try {
      const selectedSvcs = Array.from(selectedServiceIds).map(id => ({
        serviceDefId: id,
        quantity: serviceQuantities.get(id) || 1,
        dates: Array.from(serviceSelectedDates.get(id) || []),
        chefGuests: chefMembersCount.get(id) || totalGuests
      }));
      const res = await fetch('/api/pricing', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          checkIn: dateRange.start,
          checkOut: dateRange.end,
          selectedDates: selectedDatesList.map(formatDateLocal),
          guests: totalGuests,
          dailyGuestsCount: Object.fromEntries(dailyGuestsCount),
          selectedServices: selectedSvcs,
          promoCode: rules.promoEnabled ? appliedPromoCode : null,
        }),
      });
      const data = await res.json();
      if (res.ok) setPricing(data);
    } catch (err) {
      console.error('Pricing fetch error:', err);
    } finally {
      setIsPricingLoading(false);
    }
  }, [dateRange, selectedDatesList, totalGuests, selectedServiceIds, serviceQuantities, serviceSelectedDates, chefMembersCount, appliedPromoCode, rules.promoEnabled]);

  useEffect(() => {
    fetchPricing();
  }, [fetchPricing]);

  // --- Promo Validation ---
  const validatePromo = async () => {
    setPromoError(null);
    setPromoSuccess(null);
    if (!promoCodeInput.trim()) return;

    try {
      const res = await fetch('/api/promos/validate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: promoCodeInput,
          nights: pricing?.nights || 0,
          bookingAmount: pricing?.subtotal || 0,
        }),
      });
      const data = await res.json();
      if (data.valid) {
        setAppliedPromoCode(data.promo.code);
        setPromoSuccess(`${data.promo.code} applied! Save ₹${data.promo.discountPreview.toLocaleString()}`);
      } else {
        setPromoError(data.error);
      }
    } catch {
      setPromoError('Failed to validate promo code');
    }
  };

  // --- Complete Booking (unified for all modes) ---
  const handleCompleteBooking = async () => {
    setIsProcessing(true);
    try {
      const selectedSvcs = Array.from(selectedServiceIds).map(id => ({ 
        serviceDefId: id,
        quantity: serviceQuantities.get(id) || 1,
        dates: Array.from(serviceSelectedDates.get(id) || []),
        chefGuests: chefMembersCount.get(id) || totalGuests
      }));
      const effectivePaymentRequired = paymentOverride !== null ? paymentOverride : rules.paymentRequired;

      let res: Response;
      
      if (editBookingData) {
        res = await fetch(`/api/bookings/${editBookingData.bookingCode}`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'EDIT_BOOKING',
            actorRole: mode,
            metadata: {
              villaId: selectedVilla || (mode === 'CUSTOMER' ? 'cm0v3x01v000008ky38p62f3b' : ''),
              checkIn: dateRange.start ? formatDateLocal(dateRange.start) : null,
              checkOut: dateRange.end ? formatDateLocal(dateRange.end) : null,
              selectedDates: selectedDatesList.map(formatDateLocal),
              totalGuests: totalGuests,
              dailyGuestsCount: Object.fromEntries(dailyGuestsCount),
              selectedServices: selectedSvcs,
              paymentType: effectivePaymentRequired ? paymentType : undefined,
              guestIdProofs: guestIdProofs,
            }
          }),
        });
      } else {
        res = await fetch('/api/booking-engine/create', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mode,
            bookingType,
            bookingSource: mode === 'CUSTOMER' ? 'WEBSITE' : 'OWNER',
            villaId: selectedVilla,
            checkIn: dateRange.start ? formatDateLocal(dateRange.start) : null,
            checkOut: dateRange.end ? formatDateLocal(dateRange.end) : null,
            selectedDates: selectedDatesList.map(formatDateLocal),
            numGuests: totalGuests,
            dailyGuestsCount: Object.fromEntries(dailyGuestsCount),
            paymentType: effectivePaymentRequired ? paymentType : undefined,
            paymentRequired: effectivePaymentRequired,
            selectedServices: selectedSvcs,
            promoCode: rules.promoEnabled ? appliedPromoCode : undefined,
            bookingReason: bookingReason || undefined,
            internalNotes: internalNotes || undefined,
            guestIdProofs: guestIdProofs,
          }),
        });
      }

      const contentType = res.headers.get('content-type');
      let data: any = {};
      if (contentType && contentType.includes('application/json')) {
        data = await res.json();
      } else {
        const text = await res.text();
        data = { error: `Server error (${res.status}): ${res.statusText || 'Unexpected HTML response'}` };
      }

      if (res.ok && (data.booking || data.success || data.bookingCode || data.id)) {
        setBookingResult(data);
        handleNext(); // Move to confirmation
        onComplete?.(data);
      } else {
        alert(data.error || 'Failed to complete booking');
      }
    } catch (error) {
      console.error(error);
      alert('An error occurred while confirming booking.');
    } finally {
      setIsProcessing(false);
    }
  };


  const updateServiceQuantity = (id: string, delta: number) => {
    setServiceQuantities(prev => {
      const next = new Map(prev);
      const current = next.get(id) || 1;
      const val = Math.max(1, current + delta);
      next.set(id, val);
      return next;
    });
  };

  // Generate array of available stay dates
  const availableStayDates: Date[] = [...selectedDatesList].sort((a, b) => a.getTime() - b.getTime());

  const toggleServiceDate = (serviceId: string, dateStr: string) => {
    setServiceSelectedDates((prev) => {
      const next = new Map(prev);
      const dates = new Set(next.get(serviceId) || availableStayDates.map(formatDateLocal));
      if (dates.has(dateStr)) {
        dates.delete(dateStr);
      } else {
        dates.add(dateStr);
      }
      next.set(serviceId, dates);
      return next;
    });
  };

  const updateChefMembers = (serviceId: string, delta: number) => {
    setChefMembersCount((prev) => {
      const next = new Map(prev);
      const current = next.get(serviceId) || totalGuests;
      const val = Math.max(1, current + delta);
      next.set(serviceId, val);
      return next;
    });
  };

  // --- Service toggle ---
  const toggleService = (id: string) => {
    setSelectedServiceIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else {
        next.add(id);
        if (!serviceQuantities.has(id)) {
          setServiceQuantities(q => new Map(q).set(id, 1));
        }
      }
      return next;
    });
  };

  // --- Calendar entry click (opens drawer) ---
  const handleEntryClick = (bookingId: string) => {
    // In a real app, fetch booking details from API
    const entry = calendarEntries.find(e => e.bookingId === bookingId);
    if (entry) {
      setDrawerBooking({
        id: entry.bookingId,
        bookingCode: entry.bookingCode,
        bookingType: entry.type as BookingType,
        status: entry.status,
        checkIn: entry.checkIn,
        checkOut: entry.checkOut,
        totalGuests: 0,
        totalAmount: 0,
        paidAmount: 0,
        paymentRequired: true,
        bookingSource: 'WEBSITE',
        createdAt: new Date().toISOString(),
        label: entry.label,
      });
      setIsDrawerOpen(true);
    }
  };

  const complimentaryServices = allServices.filter(s => s.type === 'COMPLIMENTARY');
  const paidServices = allServices.filter(s => s.type === 'PAID');
  const effectivePaymentRequired = paymentOverride !== null ? paymentOverride : rules.paymentRequired;

  // Determine if we need a reason field (maintenance, blocked)
  const needsReason = bookingType === 'MAINTENANCE' || bookingType === 'BLOCKED';

  return (
    <div className="max-w-6xl mx-auto animate-fade-in">
      {/* Stepper Header */}
      <div className="mb-8 overflow-x-auto pb-4">
        <div className="flex items-center justify-between relative min-w-max px-4">
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-full h-px bg-white/10 -z-10"></div>
          {steps.map((step, idx) => {
            const Icon = step.icon;
            const isActive = currentStepIndex === idx;
            const isPast = currentStepIndex > idx;
            const isClickable = isPast || isActive;
            return (
              <div 
                key={step.id} 
                className={`flex flex-col items-center gap-2 bg-[var(--bg-dark)] px-4 sm:px-6 transition ${isClickable ? 'cursor-pointer hover:opacity-80' : 'cursor-not-allowed opacity-50'}`}
                onClick={() => {
                  if (isClickable) {
                    setCurrentStepIndex(idx);
                  }
                }}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors duration-500 ${isActive ? 'border-gold bg-gold/10 text-gold' : isPast ? 'border-green-500 bg-green-500 text-white' : 'border-white/20 bg-white/5 text-[var(--text-sec-dark)]'}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className={`text-[10px] sm:text-xs font-medium uppercase tracking-widest ${isActive ? 'text-gold' : 'text-[var(--text-sec-dark)]'}`}>
                  {step.title}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Wizard Content */}
      <div className="min-h-[500px]">

        {/* ─── Villa Step ─── */}
        {currentStep?.id === 'villa' && (
          <div className="space-y-6 animate-fade-in text-center max-w-4xl mx-auto">
            <h2 className="text-3xl font-serif text-[var(--text-dark)]">Select a Villa</h2>
            <p className="text-[var(--text-sec-dark)] mt-2 mb-8">Choose the perfect luxury villa for your stay.</p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div
                onClick={() => setSelectedVilla('seven-c')}
                className={`liquid-glass rounded-2xl overflow-hidden cursor-pointer transition-all border-2 ${selectedVilla === 'seven-c' ? 'border-gold scale-105' : 'border-transparent hover:border-white/20'}`}
              >
                <div className="h-48 bg-gradient-to-br from-neutral-800 to-neutral-900 flex items-center justify-center">
                  <Home className="w-12 h-12 text-white/20" />
                </div>
                <div className="p-6 text-left">
                  <h3 className="text-xl font-serif text-[var(--text-dark)]">Chunawala's Seven C Villa</h3>
                  <p className="text-sm text-[var(--text-sec-dark)] mt-2">4 Bedrooms • Private Pool • Seaview</p>
                  <div className="mt-4 font-bold text-gold">From ₹10,000 / night</div>
                </div>
              </div>
            </div>
            <div className="flex justify-end mt-8">
              <button
                onClick={handleNext}
                disabled={!selectedVilla}
                className={`font-bold px-8 py-3 rounded-full transition shadow-lg ${selectedVilla ? 'bg-gold text-black hover:scale-105 shadow-[0_0_20px_rgba(212,175,55,0.4)]' : 'bg-white/5 text-white/30 cursor-not-allowed'}`}
              >
                Continue to Dates
              </button>
            </div>
          </div>
        )}

        {/* ─── Dates Step ─── */}
        {currentStep?.id === 'dates' && (
          <div className="space-y-6 animate-fade-in">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-serif text-[var(--text-dark)]">
                {mode === 'CUSTOMER' ? 'When would you like to stay?' : 'Select Dates'}
              </h2>
              <p className="text-[var(--text-sec-dark)] mt-2">
                {mode === 'CUSTOMER'
                  ? 'Select your check-in and check-out dates.'
                  : 'Choose dates for this reservation. Click existing entries to view details.'}
              </p>
            </div>
            <ReservationGrid
              onDateRangeSelect={(start, end, dates) => {
                setDateRange({ start, end });
                if (dates) setSelectedDatesList(dates);
              }}
              mode={mode}
              bookingEntries={calendarEntries.filter(e => e.bookingId !== editBookingData?.id && e.bookingCode !== editBookingData?.bookingCode)}
              onEntryClick={handleEntryClick}
              selectedDates={selectedDatesList}
            />

            {pricing && pricing.nights > 0 && (
              <div className="max-w-md mx-auto liquid-glass p-4 rounded-xl mt-6 text-center border border-gold/30">
                <div className="text-[var(--text-sec-dark)] text-sm">{pricing.nights} Nights Selected</div>
                <div className="text-xl font-bold text-gold mt-1">
                  {isPricingLoading ? 'Calculating...' : `Est. ₹${pricing.total.toLocaleString()}`}
                </div>
              </div>
            )}

            <div className="flex justify-between mt-8 max-w-4xl mx-auto">
              <button onClick={handlePrev} className="px-6 py-2 rounded-full border border-white/20 text-white hover:bg-white/5 transition">Back</button>
              {dateRange.start && dateRange.end && (
                <button onClick={handleNext} className="bg-gold text-black font-bold px-8 py-3 rounded-full hover:scale-105 transition shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                  {mode !== 'CUSTOMER' ? 'Continue to Type' : 'Continue to Guests'}
                </button>
              )}
            </div>
          </div>
        )}

        {/* ─── Guests Step ─── */}
        {currentStep?.id === 'guests' && (
          <div className="space-y-6 animate-fade-in text-center">
            <h2 className="text-3xl font-serif text-[var(--text-dark)]">Who is coming?</h2>
            <div className="liquid-glass rounded-2xl p-8 max-w-md mx-auto space-y-6 text-left">
              {/* Per-Segment Varying Guest Count */}
              {availableStayDates.length > 0 && (
                <div className="pt-2 space-y-4">
                  <div className="text-xs font-bold text-gold uppercase tracking-wider mb-4">
                    Guests Per Stay Segment:
                  </div>
                  <div className="space-y-4">
                    {(() => {
                      const segments: { dates: Date[]; start: Date; end: Date; key: string }[] = [];
                      if (availableStayDates.length > 0) {
                        let currentSegmentDates = [availableStayDates[0]];
                        for (let i = 1; i < availableStayDates.length; i++) {
                          const prev = availableStayDates[i - 1];
                          const curr = availableStayDates[i];
                          const diff = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
                          if (diff === 1) {
                            currentSegmentDates.push(curr);
                          } else {
                            segments.push({
                              dates: currentSegmentDates,
                              start: currentSegmentDates[0],
                              end: currentSegmentDates[currentSegmentDates.length - 1],
                              key: formatDateLocal(currentSegmentDates[0]),
                            });
                            currentSegmentDates = [curr];
                          }
                        }
                        segments.push({
                          dates: currentSegmentDates,
                          start: currentSegmentDates[0],
                          end: currentSegmentDates[currentSegmentDates.length - 1],
                          key: formatDateLocal(currentSegmentDates[0]),
                        });
                      }

                      return segments.map((seg) => {
                        const firstDateStr = formatDateLocal(seg.start);
                        const currentCount = dailyGuestsCount.get(firstDateStr) || { adults: 2, children: 0 };
                        
                        const checkoutDate = new Date(seg.end);
                        checkoutDate.setDate(checkoutDate.getDate() + 1);

                        return (
                          <div key={seg.key} className="bg-white/5 p-4 rounded-xl border border-white/10 text-sm space-y-3">
                            <div className="text-white font-medium border-b border-white/10 pb-2">
                              {seg.start.toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' })} - {checkoutDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric', weekday: 'short' })}
                            </div>
                            
                            {/* Adults per segment */}
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="text-white">Adults</div>
                              </div>
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDailyGuestsCount(prev => {
                                      const next = new Map(prev);
                                      const newAdults = Math.max(1, currentCount.adults - 1);
                                      seg.dates.forEach(d => {
                                        const dStr = formatDateLocal(d);
                                        const curr = next.get(dStr) || { adults: 2, children: 0 };
                                        next.set(dStr, { ...curr, adults: newAdults });
                                      });
                                      return next;
                                    });
                                  }}
                                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold cursor-pointer flex items-center justify-center"
                                >
                                  -
                                </button>
                                <span className="font-mono font-bold text-gold px-2 w-4 text-center">{currentCount.adults}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDailyGuestsCount(prev => {
                                      const next = new Map(prev);
                                      const newAdults = Math.min(10, currentCount.adults + 1);
                                      seg.dates.forEach(d => {
                                        const dStr = formatDateLocal(d);
                                        const curr = next.get(dStr) || { adults: 2, children: 0 };
                                        next.set(dStr, { ...curr, adults: newAdults });
                                      });
                                      return next;
                                    });
                                  }}
                                  className="w-7 h-7 rounded-full bg-gold text-black font-bold hover:brightness-110 cursor-pointer flex items-center justify-center"
                                >
                                  +
                                </button>
                              </div>
                            </div>

                            {/* Children per segment */}
                            <div className="flex justify-between items-center">
                              <div>
                                <div className="text-white">Children</div>
                              </div>
                              <div className="flex items-center gap-3">
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDailyGuestsCount(prev => {
                                      const next = new Map(prev);
                                      const newChildren = Math.max(0, currentCount.children - 1);
                                      seg.dates.forEach(d => {
                                        const dStr = formatDateLocal(d);
                                        const curr = next.get(dStr) || { adults: 2, children: 0 };
                                        next.set(dStr, { ...curr, children: newChildren });
                                      });
                                      return next;
                                    });
                                  }}
                                  className="w-7 h-7 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold cursor-pointer flex items-center justify-center"
                                >
                                  -
                                </button>
                                <span className="font-mono font-bold text-gold px-2 w-4 text-center">{currentCount.children}</span>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setDailyGuestsCount(prev => {
                                      const next = new Map(prev);
                                      const newChildren = Math.min(6, currentCount.children + 1);
                                      seg.dates.forEach(d => {
                                        const dStr = formatDateLocal(d);
                                        const curr = next.get(dStr) || { adults: 2, children: 0 };
                                        next.set(dStr, { ...curr, children: newChildren });
                                      });
                                      return next;
                                    });
                                  }}
                                  className="w-7 h-7 rounded-full bg-gold text-black font-bold hover:brightness-110 cursor-pointer flex items-center justify-center"
                                >
                                  +
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      });
                    })()}
                  </div>
                </div>
              )}

              <div className="flex justify-between mt-8">
                <button onClick={handlePrev} className="px-6 py-2 rounded-full border border-white/20 text-white hover:bg-white/5 transition">Back</button>
                <button onClick={handleNext} className="bg-gold text-black font-bold px-6 py-2 rounded-full hover:scale-105 transition">Continue to Services</button>
              </div>

              {/* ID Proofs Upload Section */}
              <div className="mt-8 pt-8 border-t border-white/10 text-left">
                <h3 className="text-lg font-medium text-white mb-2">Guest ID Proofs (Optional)</h3>
                <p className="text-sm text-white/50 mb-4">You can optionally upload ID proofs for the guests now or do it later.</p>
                <div className="space-y-4">
                  {guestIdProofs.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {guestIdProofs.map((proof, i) => (
                        <div key={i} className="border border-white/10 rounded-xl overflow-hidden bg-white/5 flex flex-col">
                          <div 
                            onClick={() => {
                              if (proof.type.startsWith('image/')) {
                                setSelectedImage(proof.url);
                              }
                            }}
                            className={`block h-32 bg-black/40 relative group overflow-hidden ${proof.type.startsWith('image/') ? 'cursor-pointer' : ''}`}
                          >
                            {proof.type.startsWith('image/') ? (
                              <img src={proof.url} alt={proof.name} className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <FileText className="w-12 h-12 text-white/20" />
                              </div>
                            )}
                            {proof.type.startsWith('image/') && (
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <span className="text-white font-semibold text-xs">View Full Size</span>
                              </div>
                            )}
                          </div>
                          <div className="p-3 flex justify-between items-center bg-black/20">
                            <div className="text-xs text-white truncate max-w-[150px]" title={proof.name}>
                              {proof.name}
                            </div>
                            <button 
                              onClick={() => setGuestIdProofs(prev => prev.filter((_, idx) => idx !== i))}
                              className="text-red-400 hover:text-red-300 transition text-xs font-medium"
                            >
                              Remove
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <label className="block w-full border-2 border-dashed border-white/20 rounded-xl p-6 text-center cursor-pointer hover:bg-white/5 transition hover:border-gold/50">
                    <input 
                      type="file" 
                      multiple
                      accept="image/*,application/pdf"
                      className="hidden" 
                      onChange={async (e) => {
                        const files = Array.from(e.target.files || []);
                        if (files.length === 0) return;
                        
                        const MAX_SIZE = 5 * 1024 * 1024; // 5MB
                        const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

                        for (const file of files) {
                          // Validation
                          if (file.size > MAX_SIZE) {
                            alert(`File error: ${file.name} exceeds 5MB limit.`);
                            continue;
                          }
                          if (!ALLOWED_TYPES.includes(file.type)) {
                            alert(`File error: ${file.name} has an invalid format. Only images and PDFs are allowed.`);
                            continue;
                          }

                          try {
                            const formData = new FormData();
                            formData.append('file', file);
                            
                            const uploadRes = await fetch('/api/upload-direct', {
                              method: 'POST',
                              body: formData
                            });
                            
                            if (!uploadRes.ok) {
                              const err = await uploadRes.json().catch(() => ({}));
                              throw new Error(err.error || 'Server error: Failed to upload file via proxy.');
                            }
                            
                            const { publicUrl } = await uploadRes.json();
                            setGuestIdProofs(prev => [...prev, { name: file.name, url: publicUrl, type: file.type }]);
                          } catch (err: any) {
                            console.error('Failed to upload file:', err);
                            const localUrl = URL.createObjectURL(file);
                            if (err.message.includes('Server error')) {
                                alert(`Server error: Could not contact upload service for ${file.name}.`);
                            } else {
                                alert(`Upload failed: Cloudflare not connected. File ${file.name} is not uploaded to the server, but it has been saved locally on your laptop for this session.`);
                            }
                            setGuestIdProofs(prev => [...prev, { name: file.name, url: localUrl, type: file.type }]);
                          }
                        }
                      }}
                    />
                    <Upload className="w-6 h-6 text-gold mx-auto mb-2" />
                    <div className="text-sm text-white/80">Click to browse or drag and drop</div>
                    <div className="text-xs text-white/40 mt-1">Images or PDF (max 5MB)</div>
                  </label>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── Booking Type Step (Owner/Staff only) ─── */}
        {currentStep?.id === 'type' && (
          <div className="space-y-6 animate-fade-in">
            <BookingTypeSelector
              value={bookingType}
              onChange={(type) => {
                setBookingType(type);
                // Reset payment override when type changes
                setPaymentOverride(null);
              }}
            />

            {/* Reason field for maintenance/blocked */}
            {needsReason && (
              <div className="max-w-2xl mx-auto">
                <div className="liquid-glass rounded-xl p-4">
                  <label className="text-sm font-medium text-[var(--text-dark)] block mb-2">
                    {bookingType === 'MAINTENANCE' ? 'Maintenance Reason' : 'Block Reason'}
                  </label>
                  <textarea
                    value={bookingReason}
                    onChange={(e) => setBookingReason(e.target.value)}
                    placeholder={bookingType === 'MAINTENANCE' ? 'e.g., Pool cleaning, Plumbing repair...' : 'e.g., Family event, Private use...'}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-[var(--text-dark)] focus:outline-none focus:border-gold transition resize-none h-20"
                  />
                </div>
              </div>
            )}

            {/* Internal notes */}
            <div className="max-w-2xl mx-auto">
              <div className="liquid-glass rounded-xl p-4">
                <label className="text-sm font-medium text-[var(--text-dark)] block mb-2">
                  Internal Notes (optional)
                </label>
                <textarea
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                  placeholder="Notes visible only to owner and staff..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-[var(--text-dark)] focus:outline-none focus:border-gold transition resize-none h-16"
                />
              </div>
            </div>

            {/* Payment override toggle (for types that show payment step) */}
            {rules.paymentStepVisible && (
              <div className="max-w-2xl mx-auto">
                <PaymentRequiredToggle
                  value={paymentOverride !== null ? paymentOverride : rules.paymentRequired}
                  onChange={(val) => setPaymentOverride(val)}
                />
              </div>
            )}

            <div className="flex justify-center gap-4 mt-8">
              <button onClick={handlePrev} className="px-6 py-2 rounded-full border border-white/20 text-white hover:bg-white/5 transition">Back</button>
              {bookingType === 'MAINTENANCE' ? (
                <button 
                  onClick={handleCompleteBooking} 
                  disabled={isProcessing}
                  className="bg-red-500 hover:bg-red-600 text-white font-bold px-8 py-3 rounded-full transition shadow-[0_0_20px_rgba(239,68,68,0.4)] cursor-pointer"
                >
                  {isProcessing ? 'Confirming Maintenance...' : 'Confirm Maintenance Booking'}
                </button>
              ) : (
                <button onClick={handleNext} className="bg-gold text-black font-bold px-8 py-3 rounded-full hover:scale-105 transition shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                  Continue to Guests
                </button>
              )}
            </div>
          </div>
        )}

        {/* ─── Services Step ─── */}
        {currentStep?.id === 'services' && (
          <div className="space-y-6 animate-fade-in max-w-4xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-serif text-[var(--text-dark)]">Enhance Your Stay</h2>
              <p className="text-[var(--text-sec-dark)] mt-2">Select from our premium paid add-ons or view complimentary inclusions.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Complimentary */}
              <div className="liquid-glass rounded-2xl p-6">
                <h3 className="text-lg font-medium text-[var(--text-dark)] mb-4">Complimentary Services</h3>
                {complimentaryServices.length === 0 ? (
                  <ul className="space-y-3">
                    <li className="flex items-center gap-2 text-sm text-[var(--text-sec-dark)]"><CheckCircle2 className="w-4 h-4 text-green-400" /> Daily Housekeeping</li>
                    <li className="flex items-center gap-2 text-sm text-[var(--text-sec-dark)]"><CheckCircle2 className="w-4 h-4 text-green-400" /> High-speed WiFi</li>
                    <li className="flex items-center gap-2 text-sm text-[var(--text-sec-dark)]"><CheckCircle2 className="w-4 h-4 text-green-400" /> Swimming Pool Access</li>
                    <li className="flex items-center gap-2 text-sm text-[var(--text-sec-dark)]"><CheckCircle2 className="w-4 h-4 text-green-400" /> Fresh Linen & Towels</li>
                  </ul>
                ) : (
                  <ul className="space-y-3">
                    {complimentaryServices.map(svc => (
                      <li key={svc.id} className="flex items-center gap-2 text-sm text-[var(--text-sec-dark)]">
                        <CheckCircle2 className="w-4 h-4 text-green-400" /> {svc.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {/* Paid Add-ons */}
              <div className="liquid-glass rounded-2xl p-6">
                <h3 className="text-lg font-medium text-[var(--text-dark)] mb-4">Paid Add-ons</h3>
                {paidServices.length === 0 ? (
                  <p className="text-sm text-[var(--text-sec-dark)]">No paid add-ons available at this time.</p>
                ) : (
                  <div className="space-y-3">
                    {paidServices.map(svc => {
                      const isSelected = selectedServiceIds.has(svc.id);
                      const qty = serviceQuantities.get(svc.id) || 1;
                      const unitPrice = Number(svc.price);
                      const isChef = svc.name.toLowerCase().includes('chef');
                      const isQuantityService = svc.chargeType === 'PER_GUEST' || svc.name.toLowerCase().includes('bed') || svc.name.toLowerCase().includes('mattress');
                      
                      const selectedDatesSet = serviceSelectedDates.get(svc.id) || new Set(availableStayDates.map(formatDateLocal));
                      const datesCount = selectedDatesSet.size || 1;
                      const chefGuests = chefMembersCount.get(svc.id) || totalGuests;
                      
                      const totalPrice = isQuantityService 
                        ? unitPrice * qty 
                        : unitPrice * datesCount;

                      return (
                        <div key={svc.id} className={`p-4 rounded-xl border transition space-y-3 ${isSelected ? 'border-gold/50 bg-gold/5' : 'border-white/10 hover:bg-white/5'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <input
                                type="checkbox"
                                checked={isSelected}
                                onChange={() => toggleService(svc.id)}
                                className="w-5 h-5 accent-gold cursor-pointer"
                              />
                              <div>
                                <div className="text-sm font-bold text-[var(--text-dark)]">{svc.name}</div>
                                {svc.description && <div className="text-xs text-[var(--text-sec-dark)]">{svc.description}</div>}
                                <div className="text-xs text-gold/80 mt-0.5">
                                  ₹{unitPrice.toLocaleString()}/{svc.chargeType === 'PER_DAY' ? 'day' : svc.chargeType === 'PER_GUEST' ? 'guest' : 'unit'}
                                </div>
                              </div>
                            </div>

                            {/* Quantity Controls only for Per-Guest / Bed add-ons */}
                            {isSelected && isQuantityService ? (
                              <div className="flex items-center gap-3 bg-black/40 border border-white/10 px-3 py-1.5 rounded-lg">
                                <button
                                  type="button"
                                  onClick={() => updateServiceQuantity(svc.id, -1)}
                                  className="w-7 h-7 flex items-center justify-center rounded-md bg-white/10 hover:bg-white/20 text-white font-bold transition cursor-pointer"
                                >
                                  -
                                </button>
                                <span className="text-sm font-bold text-white min-w-[20px] text-center font-mono">
                                  {qty}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => updateServiceQuantity(svc.id, 1)}
                                  className="w-7 h-7 flex items-center justify-center rounded-md bg-gold text-black font-bold transition cursor-pointer hover:brightness-110"
                                >
                                  +
                                </button>
                              </div>
                            ) : (
                              <div className="text-sm font-bold text-white/70">
                                ₹{totalPrice.toLocaleString()}
                              </div>
                            )}
                          </div>

                          {/* Expanded Per-Date Selection & Chef Members Controls when Selected */}
                          {isSelected && (
                            <div className="pt-3 border-t border-white/10 space-y-3">
                              {/* Date Selection Pills */}
                              {availableStayDates.length > 0 && (
                                <div>
                                  <label className="block text-[11px] uppercase tracking-wider text-white/60 font-semibold mb-1.5">
                                    Select Service Date(s):
                                  </label>
                                  <div className="flex flex-wrap gap-2">
                                    {availableStayDates.map((d) => {
                                      const dStr = formatDateLocal(d);
                                      const isDateChecked = selectedDatesSet.has(dStr);
                                      return (
                                        <button
                                          key={dStr}
                                          type="button"
                                          onClick={() => toggleServiceDate(svc.id, dStr)}
                                          className={`px-3 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                                            isDateChecked
                                              ? 'bg-gold/20 border-gold text-gold font-bold'
                                              : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                                          }`}
                                        >
                                          {isDateChecked ? '✓ ' : ''}{d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                                        </button>
                                      );
                                    })}
                                  </div>
                                </div>
                              )}

                              {/* Member Count specifically for Chef Service */}
                              {isChef && (
                                <div className="flex items-center justify-between bg-black/30 border border-gold/20 p-2.5 rounded-lg">
                                  <div>
                                    <div className="text-xs font-bold text-white">Chef Guests / Members</div>
                                    <div className="text-[10px] text-gold/80">Meals prepared for specified guest count</div>
                                  </div>
                                  <div className="flex items-center gap-2 bg-white/10 px-2 py-1 rounded-lg border border-white/10">
                                    <button
                                      type="button"
                                      onClick={() => updateChefMembers(svc.id, -1)}
                                      className="w-6 h-6 flex items-center justify-center rounded bg-white/10 hover:bg-white/20 text-white font-bold text-xs cursor-pointer"
                                    >
                                      -
                                    </button>
                                    <span className="text-xs font-mono font-bold text-gold px-1">{chefGuests} Members</span>
                                    <button
                                      type="button"
                                      onClick={() => updateChefMembers(svc.id, 1)}
                                      className="w-6 h-6 flex items-center justify-center rounded bg-gold text-black font-bold text-xs hover:brightness-110 cursor-pointer"
                                    >
                                      +
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-center gap-4 mt-8">
              <button onClick={handlePrev} className="px-6 py-2 rounded-full border border-white/20 text-white hover:bg-white/5 transition">Back</button>
              <button onClick={handleNext} className="bg-gold text-black font-bold px-8 py-3 rounded-full hover:scale-105 transition shadow-[0_0_20px_rgba(212,175,55,0.4)]">
                {rules.paymentStepVisible ? 'Continue to Payment' : 'Review & Confirm'}
              </button>
            </div>
          </div>
        )}

        {/* ─── Payment Step (when visible) ─── */}
        {currentStep?.id === 'payment' && (
          <div className="space-y-6 animate-fade-in max-w-2xl mx-auto">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-serif text-[var(--text-dark)]">
                {effectivePaymentRequired ? 'Complete Your Booking' : 'Review & Confirm'}
              </h2>
              <p className="text-[var(--text-sec-dark)] mt-2">
                {effectivePaymentRequired
                  ? 'Review your summary and enter a promo code if you have one.'
                  : 'Review the booking summary before confirming.'}
              </p>
            </div>
            <div className="liquid-glass rounded-2xl p-8">
              {/* Promo Code Engine — only for customer bookings with promos enabled */}
              {rules.promoEnabled && (
                <div className="mb-8 pb-8 border-b border-white/10">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={promoCodeInput}
                      onChange={(e) => { setPromoCodeInput(e.target.value); setPromoError(null); setPromoSuccess(null); }}
                      placeholder="Enter Promo Code (e.g. MONSOON25)"
                      className="flex-1 bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-[var(--text-dark)] focus:outline-none focus:border-gold transition"
                    />
                    <button onClick={validatePromo} className="bg-white/10 text-[var(--text-dark)] px-6 py-2 rounded-lg hover:bg-white/20 transition cursor-pointer">Apply</button>
                  </div>
                  {promoError && <p className="text-red-400 text-xs mt-2">{promoError}</p>}
                  {promoSuccess && <p className="text-green-400 text-xs mt-2">{promoSuccess}</p>}
                </div>
              )}

              {/* Owner Payment Override option for normal owner bookings */}
              {mode !== 'CUSTOMER' && (
                <div className="mb-6 pb-6 border-b border-white/10 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white/80 uppercase tracking-wider">Owner Payment Policy</span>
                    <span className="text-xs px-3 py-1 rounded-full bg-gold/20 text-gold border border-gold/30">
                      {rules.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPaymentOverride(true)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                        effectivePaymentRequired
                          ? 'bg-gold/20 text-gold border-gold'
                          : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      Collect Payment Now
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentOverride(false)}
                      className={`py-2 px-3 rounded-xl text-xs font-semibold border transition cursor-pointer ${
                        !effectivePaymentRequired
                          ? 'bg-green-500/20 text-green-400 border-green-500/40 font-bold'
                          : 'bg-white/5 text-white/60 border-white/10 hover:bg-white/10'
                      }`}
                    >
                      No Payment Required (Pay Later)
                    </button>
                  </div>
                  {!effectivePaymentRequired && (
                    <div className="p-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-xs font-medium">
                      Payment waived. This reservation will be confirmed immediately without taking payment upfront.
                    </div>
                  )}
                </div>
              )}

              {/* Price Breakdown — all from server */}
              {pricing ? (
                <div className="space-y-4 mb-8">
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-sec-dark)]">{pricing.nights} Nights Accommodation</span>
                    <span className="text-[var(--text-dark)] font-medium">₹{pricing.baseAccommodation.toLocaleString()}</span>
                  </div>
                  {pricing.serviceBreakdown.map((svc, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span className="text-[var(--text-sec-dark)]">{svc.name} ({svc.quantity} {svc.chargeType === 'PER_DAY' ? 'days' : svc.chargeType === 'PER_GUEST' ? 'guests' : ''})</span>
                      <span className="text-[var(--text-dark)] font-medium">₹{(svc.total || 0).toLocaleString()}</span>
                    </div>
                  ))}
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-sec-dark)]">Cleaning Fee</span>
                    <span className="text-[var(--text-dark)] font-medium">₹{pricing.cleaningFee.toLocaleString()}</span>
                  </div>
                  {pricing.discount > 0 && (
                    <div className="flex justify-between text-sm text-green-400 font-medium">
                      <span>{pricing.discountLabel}</span>
                      <span>-₹{pricing.discount.toLocaleString()}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-sm">
                    <span className="text-[var(--text-sec-dark)]">GST (18%)</span>
                    <span className="text-[var(--text-dark)] font-medium">₹{pricing.gst.toLocaleString()}</span>
                  </div>
                  
                  {(() => {
                    const total = pricing?.total || 0;
                    let targetPaidAmount = 0;
                    if (editBookingData) {
                      const oldPaid = Number(editBookingData.paidAmount || 0);
                      targetPaidAmount = paymentType === 'ADVANCE' ? Math.max(0, Math.round(total * 0.33) - oldPaid) : Math.max(0, total - oldPaid);
                    } else {
                      targetPaidAmount = paymentType === 'ADVANCE' ? Math.round(total * 0.33) : total;
                    }
                    const walletUsed = Math.min(walletBalance, targetPaidAmount);

                    if (walletUsed > 0) {
                      return (
                        <div className="flex justify-between text-sm text-green-400 font-medium pt-2">
                          <span>Wallet Refund Balance Applied</span>
                          <span>-₹{walletUsed.toLocaleString()}</span>
                        </div>
                      );
                    }
                    return null;
                  })()}

                  <div className="border-t border-white/10 pt-4 flex justify-between items-end">
                    <div>
                      <div className="text-xs text-[var(--text-sec-dark)] mb-1">
                        {effectivePaymentRequired ? 'Total Payable' : 'Estimated Value'}
                      </div>
                      <div className="text-[var(--text-dark)] text-2xl font-bold">₹{pricing.total.toLocaleString()}</div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-[var(--text-sec-dark)]">Loading pricing...</div>
              )}

              {/* Payment Type Selection — only when payment required */}
              {effectivePaymentRequired && (
                <div className="grid grid-cols-2 gap-4">
                  {(() => {
                    const total = pricing?.total || 0;
                    if (editBookingData) {
                      // Use totalAdvancePaid or totalPaid from the updated Prisma schema
                      const oldPaid = Number(
                        (editBookingData as any).totalAdvancePaid || 
                        (editBookingData as any).totalPaid || 
                        editBookingData.paidAmount || 
                        0
                      );
                      const newAdvance = Math.round(total * 0.33);
                      const advanceDiff = newAdvance - oldPaid;
                      const fullDiff = total - oldPaid;

                      if (fullDiff <= 0) {
                        return (
                          <div className="col-span-2 p-4 rounded-xl border border-green-500/30 bg-green-500/10 text-center">
                            <div className="text-green-400 font-bold mb-1">No Additional Payment Required</div>
                            <div className="text-sm text-green-400/80">
                              {fullDiff < 0 
                                ? `The new total is less than your original payment. You are owed a refund of ₹${Math.abs(fullDiff).toLocaleString()}.` 
                                : `Your original payment perfectly covers the new total.`}
                            </div>
                          </div>
                        );
                      }

                      return (
                        <>
                          <button
                            onClick={() => setPaymentType('ADVANCE')}
                            className={`p-4 rounded-xl text-center transition cursor-pointer ${paymentType === 'ADVANCE' ? 'border-2 border-gold bg-gold/10' : 'border border-white/10 bg-white/5 hover:bg-white/10'}`}
                          >
                            <div className="font-bold text-[var(--text-dark)] mb-2">Pay Advance</div>
                            <div className="text-sm space-y-1 mb-2">
                              <div className="flex justify-between text-[var(--text-sec-dark)]">
                                <span>Advance Amount Paid:</span>
                                <span>₹{oldPaid.toLocaleString()}</span>
                              </div>
                              <div className="flex justify-between text-[var(--text-sec-dark)]">
                                <span>Required Advance (33%):</span>
                                <span>₹{newAdvance.toLocaleString()}</span>
                              </div>
                              {advanceDiff > 0 ? (
                                <div className="flex justify-between text-gold font-bold pt-1 border-t border-white/10">
                                  <span>Remaining to be Paid:</span>
                                  <span>₹{Math.max(0, advanceDiff - walletBalance).toLocaleString()}</span>
                                </div>
                              ) : (
                                <div className="flex justify-between text-green-400 font-bold pt-1 border-t border-white/10">
                                  <span>Advance Status:</span>
                                  <span>Fully Covered</span>
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-[var(--text-sec-dark)] mt-2">
                              {advanceDiff <= 0 ? 'Advance covered. Pay remaining at check-in' : 'Pay remaining for advance'}
                            </div>
                          </button>
                          <button
                            onClick={() => setPaymentType('FULL')}
                            className={`p-4 rounded-xl text-center transition cursor-pointer ${paymentType === 'FULL' ? 'border-2 border-gold bg-gold/10' : 'border border-white/10 bg-white/5 hover:bg-white/10'}`}
                          >
                            <div className="font-bold text-[var(--text-dark)] mb-2">Pay Full</div>
                            <div className="text-sm space-y-1 mb-2">
                                <div className="flex justify-between text-[var(--text-sec-dark)]">
                                  <span>Amount Paid:</span>
                                  <span>₹{oldPaid.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-[var(--text-sec-dark)]">
                                  <span>New Total:</span>
                                  <span>₹{total.toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between text-white font-bold pt-1 border-t border-white/10">
                                  <span>Remaining to be Paid:</span>
                                  <span>₹{Math.max(0, fullDiff - walletBalance).toLocaleString()}</span>
                                </div>
                            </div>
                            <div className="text-xs text-[var(--text-sec-dark)] mt-2">Settle difference now</div>
                          </button>
                        </>
                      );
                    } else {
                      return (
                        <>
                          <button
                            onClick={() => setPaymentType('ADVANCE')}
                            className={`p-4 rounded-xl text-center transition cursor-pointer ${paymentType === 'ADVANCE' ? 'border-2 border-gold bg-gold/10' : 'border border-white/10 bg-white/5 hover:bg-white/10'}`}
                          >
                            <div className="font-bold text-[var(--text-dark)] mb-1">Pay Advance (33%)</div>
                            <div className="text-gold font-bold">₹{Math.max(0, Math.round(total * 0.33) - walletBalance).toLocaleString()}</div>
                            <div className="text-xs text-[var(--text-sec-dark)] mt-2">Pay remaining at check-in</div>
                          </button>
                          <button
                            onClick={() => setPaymentType('FULL')}
                            className={`p-4 rounded-xl text-center transition cursor-pointer ${paymentType === 'FULL' ? 'border-2 border-gold bg-gold/10' : 'border border-white/10 bg-white/5 hover:bg-white/10'}`}
                          >
                            <div className="font-bold text-[var(--text-dark)] mb-1">Pay Full</div>
                            <div className="text-white font-bold">₹{Math.max(0, total - walletBalance).toLocaleString()}</div>
                            <div className="text-xs text-[var(--text-sec-dark)] mt-2">Settle everything now</div>
                          </button>
                        </>
                      );
                    }
                  })()}
                </div>
              )}
            </div>
            <div className="flex justify-between mt-8">
              <button onClick={handlePrev} className="px-6 py-2 rounded-full border border-white/20 text-white hover:bg-white/5 transition">Back</button>
              <button
                onClick={handleCompleteBooking}
                disabled={isProcessing}
                className={`bg-gold text-black font-bold px-8 py-3 rounded-full transition shadow-[0_0_20px_rgba(212,175,55,0.4)] cursor-pointer ${isProcessing ? 'opacity-50' : 'hover:scale-105'}`}
              >
                {isProcessing ? 'Processing...' : effectivePaymentRequired ? 'Complete Payment' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        )}

        {/* ─── Services → Direct Confirm (when payment step is hidden) ─── */}
        {currentStep?.id === 'done' && !rules.paymentStepVisible && !bookingResult && (
          <div className="space-y-6 animate-fade-in max-w-2xl mx-auto text-center">
            <h2 className="text-3xl font-serif text-[var(--text-dark)]">Confirm Booking</h2>
            <p className="text-[var(--text-sec-dark)] mt-2">This booking will be confirmed immediately without payment.</p>

            <div className="liquid-glass rounded-2xl p-6 text-left max-w-md mx-auto space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-sec-dark)]">Type</span>
                <span className="text-gold font-medium">{rules.label}</span>
              </div>
              {dateRange.start && dateRange.end && (
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-sec-dark)]">Dates</span>
                  <span className="text-[var(--text-dark)]">
                    {dateRange.start.toLocaleDateString()} – {dateRange.end.toLocaleDateString()}
                  </span>
                </div>
              )}
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-sec-dark)]">Guests</span>
                <span className="text-[var(--text-dark)]">{totalGuests}</span>
              </div>
              {bookingReason && (
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-sec-dark)]">Reason</span>
                  <span className="text-[var(--text-dark)]">{bookingReason}</span>
                </div>
              )}
            </div>

            <div className="flex justify-center gap-4 mt-8">
              <button onClick={handlePrev} className="px-6 py-2 rounded-full border border-white/20 text-white hover:bg-white/5 transition">Back</button>
              <button
                onClick={handleCompleteBooking}
                disabled={isProcessing}
                className={`bg-gold text-black font-bold px-8 py-3 rounded-full transition shadow-[0_0_20px_rgba(212,175,55,0.4)] cursor-pointer ${isProcessing ? 'opacity-50' : 'hover:scale-105'}`}
              >
                {isProcessing ? 'Processing...' : 'Confirm Booking'}
              </button>
            </div>
          </div>
        )}

        {/* ─── Confirmation ─── */}
        {currentStep?.id === 'done' && bookingResult && (
          <div className="text-center py-20 animate-fade-in">
            <div className="w-20 h-20 bg-green-500/20 text-green-400 rounded-full flex items-center justify-center mx-auto mb-6">
              <CheckCircle2 className="w-10 h-10" />
            </div>
            <h2 className="text-3xl font-serif text-green-400 mb-4">
              {rules.autoConfirm ? 'Booking Confirmed!' : 'Booking Submitted!'}
            </h2>
            <p className="text-[var(--text-sec-dark)] mb-2">
              {mode === 'CUSTOMER'
                ? 'Your stay at Seven C Villa is confirmed.'
                : `${rules.label} has been ${rules.autoConfirm ? 'confirmed' : 'submitted'}.`}
            </p>
            <p className="text-[var(--text-sec-dark)] mb-8">
              Booking ID: <span className="font-mono text-white bg-white/10 px-2 py-1 rounded">{bookingResult?.booking?.bookingCode || 'MVN-XXXX'}</span>
            </p>

            {/* Quick stats */}
            <div className="max-w-md mx-auto liquid-glass p-6 rounded-xl text-left mb-8 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-sec-dark)]">Type</span>
                <span className="text-gold">{rules.label}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-[var(--text-sec-dark)]">Status</span>
                <span className="text-green-400">{bookingResult?.booking?.status || 'CONFIRMED'}</span>
              </div>
              {bookingResult?.requiresPayment && (
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-sec-dark)]">Payment</span>
                  <span className="text-[var(--text-dark)]">Required</span>
                </div>
              )}
              {!bookingResult?.requiresPayment && (
                <div className="flex justify-between text-sm">
                  <span className="text-[var(--text-sec-dark)]">Payment</span>
                  <span className="text-green-400">Not Required</span>
                </div>
              )}
            </div>

            <div className="flex justify-center gap-4">
              {bookingResult?.requiresPayment && (
                <button className="px-6 py-2 rounded-full border border-white/20 text-white hover:bg-white/5 transition cursor-pointer">Download Invoice</button>
              )}
              <button onClick={() => window.location.href = '/'} className="bg-gold text-black font-bold px-6 py-2 rounded-full hover:scale-105 transition cursor-pointer">
                {mode === 'CUSTOMER' ? 'View Dashboard' : 'Back to Bookings'}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Booking Details Drawer (for calendar entry clicks) */}
      <BookingDetailsDrawer
        booking={drawerBooking}
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        mode={mode}
      />

      {/* Lightbox Image Viewer Modal */}
      {selectedImage && (
        <div 
          className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 p-4" 
          onClick={() => setSelectedImage(null)}
        >
          <button 
            type="button" 
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors"
            onClick={(e) => {
              e.stopPropagation();
              setSelectedImage(null);
            }}
          >
            <span className="text-2xl">✕</span>
          </button>
          <img 
            src={selectedImage} 
            alt="Full Size ID Proof" 
            className="max-w-full max-h-full object-contain shadow-2xl rounded"
            onClick={(e) => e.stopPropagation()} 
          />
        </div>
      )}
    </div>
  );
};
