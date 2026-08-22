"use client";
import { useState, useMemo } from 'react';
import {
  X,
  Sparkles,
  Calendar,
  Users,
  Phone,
  Mail,
  CheckCircle2,
  ShieldCheck,
  CreditCard,
  Lock,
  ArrowRight,
  Receipt,
  AlertCircle,
} from 'lucide-react';

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  isDark?: boolean;
}

const BASE_PRICE_PER_NIGHT = 45000; // ₹45,000 INR per night
const CLEANING_FEE = 3500;          // ₹3,500 INR
const SECURITY_DEPOSIT = 10000;     // ₹10,000 INR refundable
const GST_RATE = 0.18;              // 18% GST

export default function BookingModal({
  isOpen,
  onClose,
  isDark = true,
}: BookingModalProps) {
  const [bookingMode, setBookingMode] = useState<'instant' | 'enquiry'>('instant');
  const [submitted, setSubmitted] = useState(false);
  const [bookingCode, setBookingCode] = useState('');
  const [paymentId, setPaymentId] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    checkIn: '',
    checkOut: '',
    guests: 2,
    notes: '',
  });

  // Calculate live pricing breakdown whenever dates change
  const pricing = useMemo(() => {
    if (!formData.checkIn || !formData.checkOut) {
      return null;
    }

    const start = new Date(formData.checkIn);
    const end = new Date(formData.checkOut);
    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return null;
    }

    const numNights = Math.max(
      1,
      Math.round((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24))
    );
    const baseAmount = numNights * BASE_PRICE_PER_NIGHT;
    const taxableAmount = baseAmount + CLEANING_FEE;
    const taxAmount = Math.round(taxableAmount * GST_RATE);
    const currentTotal = taxableAmount + taxAmount + SECURITY_DEPOSIT;

    return {
      numNights,
      baseAmount,
      cleaningFee: CLEANING_FEE,
      taxAmount,
      securityDeposit: SECURITY_DEPOSIT,
      currentTotal,
    };
  }, [formData.checkIn, formData.checkOut]);

  if (!isOpen) return null;

  const handleInstantCheckout = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pricing) return;

    setIsProcessing(true);
    // Simulate Razorpay signature & order confirmation
    setTimeout(() => {
      const randomCode = Math.floor(100000 + Math.random() * 900000);
      const randomPayId = Math.random().toString(36).substring(2, 10).toUpperCase();
      setBookingCode(`MVN-${randomCode}`);
      setPaymentId(`pay_${randomPayId}`);
      setIsProcessing(false);
      setSubmitted(true);
    }, 1200);
  };

  const handleEnquirySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const randomCode = Math.floor(100000 + Math.random() * 900000);
    setBookingCode(`MVN-${randomCode}`);
    setSubmitted(true);
  };

  return (
    <div
      className={`fixed inset-0 z-50 backdrop-blur-2xl flex items-center justify-center p-3 sm:p-6 animate-fade-in ${
        isDark ? 'bg-black/90' : 'bg-[#F7F5F1]/85'
      }`}
      onClick={onClose}
    >
      <div
        className={`relative max-w-3xl w-full rounded-3xl p-5 sm:p-8 md:p-10 border shadow-2xl max-h-[92vh] overflow-y-auto transition-colors duration-300 ${
          isDark
            ? 'bg-black/95 border-gold/40 text-white'
            : 'bg-[#FDFCF9] border-gold/60 text-black'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className={`absolute top-4 right-4 sm:top-6 sm:right-6 w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
            isDark
              ? 'bg-white/10 text-white hover:bg-gold hover:text-black'
              : 'bg-black/10 text-black hover:bg-gold hover:text-black'
          }`}
          aria-label="Close booking modal"
        >
          <X className="w-5 h-5" />
        </button>

        {submitted ? (
          <div className="py-8 sm:py-10 text-center animate-fade-in">
            <div className="w-16 h-16 rounded-full bg-gold/20 border border-gold text-gold flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(212,175,55,0.3)]">
              <CheckCircle2 className="w-8 h-8" />
            </div>
            <div className="inline-block px-3 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-xs font-mono mb-3">
              REF: {bookingCode}
            </div>
            <h3 className="text-2xl sm:text-3xl font-serif mb-2">
              {bookingMode === 'instant'
                ? 'Reservation Confirmed & Paid'
                : 'Enquiry Received'}
            </h3>
            <p
              className={`text-sm max-w-md mx-auto mb-6 font-light leading-relaxed ${
                isDark ? 'text-white/80' : 'text-black/80'
              }`}
            >
              Thank you, <span className="text-gold font-medium">{formData.name || 'Valued Guest'}</span>.
              {bookingMode === 'instant'
                ? ` Your payment via Razorpay (${paymentId}) has been verified. Your dates are instantly locked in our system.`
                : ' Our Private Concierge will review your preferred dates and contact you within 2 hours.'}
            </p>

            {pricing && bookingMode === 'instant' && (
              <div
                className={`max-w-md mx-auto rounded-2xl p-4 mb-6 border text-left text-xs space-y-2 ${
                  isDark ? 'bg-white/5 border-white/10' : 'bg-black/5 border-black/10'
                }`}
              >
                <div className="flex justify-between font-medium border-b border-white/10 pb-2">
                  <span>Booking Code</span>
                  <span className="text-gold font-mono">{bookingCode}</span>
                </div>
                <div className="flex justify-between">
                  <span>Stay Duration</span>
                  <span>{pricing.numNights} Nights</span>
                </div>
                <div className="flex justify-between">
                  <span>Total Paid (incl. GST @ 18%)</span>
                  <span className="font-semibold text-gold">
                    ₹{pricing.currentTotal.toLocaleString('en-IN')}
                  </span>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={() => {
                setSubmitted(false);
                onClose();
              }}
              className="cta-button uppercase tracking-wider text-xs px-8 py-3.5"
            >
              Return to Villa
            </button>
          </div>
        ) : (
          <div>
            <div className="flex flex-wrap items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2 text-gold text-xs uppercase tracking-widest font-semibold">
                <Sparkles className="w-3.5 h-3.5" />
                <span>Chunawala&apos;s Seven C Villa</span>
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-gold/10 border border-gold/30 text-gold text-[11px]">
                <ShieldCheck className="w-3.5 h-3.5" />
                <span>Protected by Mavon RBAC • Cloudflare R2 CDN</span>
              </div>
            </div>

            <h3 className="text-2xl sm:text-3xl md:text-4xl font-serif mb-2">
              Reserve Your Private Stay
            </h3>
            <p
              className={`text-xs md:text-sm font-light mb-6 ${
                isDark ? 'text-white/70' : 'text-black/70'
              }`}
            >
              Choose instant Razorpay confirmation to lock in your dates immediately, or request a bespoke concierge enquiry.
            </p>

            {/* Mode Selector Tabs */}
            <div className="flex rounded-xl p-1 mb-6 bg-white/5 border border-white/10">
              <button
                type="button"
                onClick={() => setBookingMode('instant')}
                className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                  bookingMode === 'instant'
                    ? 'bg-gold text-black shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <CreditCard className="w-3.5 h-3.5" />
                <span>Instant Booking (Razorpay)</span>
              </button>
              <button
                type="button"
                onClick={() => setBookingMode('enquiry')}
                className={`flex-1 py-2.5 px-4 rounded-lg text-xs font-semibold uppercase tracking-wider flex items-center justify-center gap-2 transition-all ${
                  bookingMode === 'enquiry'
                    ? 'bg-gold text-black shadow-md'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <Receipt className="w-3.5 h-3.5" />
                <span>Concierge Enquiry</span>
              </button>
            </div>

            <form
              onSubmit={bookingMode === 'instant' ? handleInstantCheckout : handleEnquirySubmit}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-xs uppercase tracking-widest mb-1.5 ${
                      isDark ? 'text-white/60' : 'text-black/60'
                    }`}
                  >
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mr. Chunawala"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className={`w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold transition-colors ${
                      isDark
                        ? 'bg-white/5 border border-white/15 text-white placeholder-white/30'
                        : 'bg-black/5 border border-black/15 text-black placeholder-black/40'
                    }`}
                  />
                </div>
                <div>
                  <label
                    className={`block text-xs uppercase tracking-widest mb-1.5 ${
                      isDark ? 'text-white/60' : 'text-black/60'
                    }`}
                  >
                    Email Address
                  </label>
                  <div className="relative">
                    <Mail
                      className={`w-4 h-4 absolute left-3.5 top-3.5 ${
                        isDark ? 'text-white/40' : 'text-black/40'
                      }`}
                    />
                    <input
                      type="email"
                      required
                      placeholder="guest@luxury.com"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      className={`w-full rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-gold transition-colors ${
                        isDark
                          ? 'bg-white/5 border border-white/15 text-white placeholder-white/30'
                          : 'bg-black/5 border border-black/15 text-black placeholder-black/40'
                      }`}
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-xs uppercase tracking-widest mb-1.5 ${
                      isDark ? 'text-white/60' : 'text-black/60'
                    }`}
                  >
                    Contact Phone
                  </label>
                  <div className="relative">
                    <Phone
                      className={`w-4 h-4 absolute left-3.5 top-3.5 ${
                        isDark ? 'text-white/40' : 'text-black/40'
                      }`}
                    />
                    <input
                      type="tel"
                      required
                      placeholder="+91 98200 00000"
                      value={formData.phone}
                      onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                      className={`w-full rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-gold transition-colors ${
                        isDark
                          ? 'bg-white/5 border border-white/15 text-white placeholder-white/30'
                          : 'bg-black/5 border border-black/15 text-black placeholder-black/40'
                      }`}
                    />
                  </div>
                </div>
                <div>
                  <label
                    className={`block text-xs uppercase tracking-widest mb-1.5 ${
                      isDark ? 'text-white/60' : 'text-black/60'
                    }`}
                  >
                    Party Size (Max 12)
                  </label>
                  <div className="relative">
                    <Users
                      className={`w-4 h-4 absolute left-3.5 top-3.5 ${
                        isDark ? 'text-white/40' : 'text-black/40'
                      }`}
                    />
                    <select
                      value={formData.guests}
                      onChange={(e) => setFormData({ ...formData, guests: Number(e.target.value) })}
                      className={`w-full rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-gold transition-colors ${
                        isDark
                          ? 'bg-white/5 border border-white/15 text-white'
                          : 'bg-black/5 border border-black/15 text-black'
                      }`}
                    >
                      {[2, 4, 6, 8, 10, 12].map((num) => (
                        <option key={num} value={num}>
                          {num} Guests {num === 12 ? '(Max Capacity)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label
                    className={`block text-xs uppercase tracking-widest mb-1.5 ${
                      isDark ? 'text-white/60' : 'text-black/60'
                    }`}
                  >
                    Check-in Date
                  </label>
                  <div className="relative">
                    <Calendar
                      className={`w-4 h-4 absolute left-3.5 top-3.5 pointer-events-none ${
                        isDark ? 'text-white/40' : 'text-black/40'
                      }`}
                    />
                    <input
                      type="date"
                      required
                      value={formData.checkIn}
                      onChange={(e) => setFormData({ ...formData, checkIn: e.target.value })}
                      className={`w-full rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-gold transition-colors ${
                        isDark
                          ? 'bg-white/5 border border-white/15 text-white'
                          : 'bg-black/5 border border-black/15 text-black'
                      }`}
                    />
                  </div>
                </div>
                <div>
                  <label
                    className={`block text-xs uppercase tracking-widest mb-1.5 ${
                      isDark ? 'text-white/60' : 'text-black/60'
                    }`}
                  >
                    Check-out Date
                  </label>
                  <div className="relative">
                    <Calendar
                      className={`w-4 h-4 absolute left-3.5 top-3.5 pointer-events-none ${
                        isDark ? 'text-white/40' : 'text-black/40'
                      }`}
                    />
                    <input
                      type="date"
                      required
                      value={formData.checkOut}
                      onChange={(e) => setFormData({ ...formData, checkOut: e.target.value })}
                      className={`w-full rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-gold transition-colors ${
                        isDark
                          ? 'bg-white/5 border border-white/15 text-white'
                          : 'bg-black/5 border border-black/15 text-black'
                      }`}
                    />
                  </div>
                </div>
              </div>

              {/* Dynamic Pricing Math Display */}
              {pricing ? (
                <div
                  className={`rounded-2xl p-4 border transition-all ${
                    isDark
                      ? 'bg-white/5 border-gold/30 text-white'
                      : 'bg-black/5 border-gold/40 text-black'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3 border-b border-white/10 pb-2">
                    <span className="text-xs uppercase tracking-wider text-gold font-semibold">
                      Live Pricing Breakdown ({pricing.numNights} Nights)
                    </span>
                    <span className="text-xs font-mono text-white/60">
                      ₹45,000 / night
                    </span>
                  </div>
                  <div className="space-y-1.5 text-xs font-light">
                    <div className="flex justify-between">
                      <span>Base Stay ({pricing.numNights} × ₹45,000)</span>
                      <span>₹{pricing.baseAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Cleaning &amp; Concierge Fee</span>
                      <span>₹{pricing.cleaningFee.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>GST (18% Indian Tax)</span>
                      <span>₹{pricing.taxAmount.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between text-white/70">
                      <span>Refundable Security Deposit</span>
                      <span>₹{pricing.securityDeposit.toLocaleString('en-IN')}</span>
                    </div>
                    <div className="flex justify-between pt-2 border-t border-white/10 font-semibold text-sm text-gold">
                      <span>Total Amount Payable (INR)</span>
                      <span>₹{pricing.currentTotal.toLocaleString('en-IN')}</span>
                    </div>
                  </div>
                </div>
              ) : formData.checkIn && formData.checkOut ? (
                <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-300 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Please select a Check-out date that is after Check-in.</span>
                </div>
              ) : null}

              <div>
                <label
                  className={`block text-xs uppercase tracking-widest mb-1.5 ${
                    isDark ? 'text-white/60' : 'text-black/60'
                  }`}
                >
                  Special Requirements / Custom Requests
                </label>
                <textarea
                  rows={2}
                  placeholder="Private chef menus, anniversary decorations, airport chauffeur transfers..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className={`w-full rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-gold transition-colors ${
                    isDark
                      ? 'bg-white/5 border border-white/15 text-white placeholder-white/30'
                      : 'bg-black/5 border border-black/15 text-black placeholder-black/40'
                  }`}
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={isProcessing || (bookingMode === 'instant' && !pricing)}
                  className="w-full bg-gold text-black font-semibold uppercase tracking-wider text-xs py-4 rounded-xl hover:bg-gold/90 disabled:opacity-50 transition-all shadow-lg flex items-center justify-center gap-2"
                >
                  {isProcessing ? (
                    <span>Verifying Razorpay Order...</span>
                  ) : bookingMode === 'instant' ? (
                    <>
                      <Lock className="w-4 h-4" />
                      <span>
                        {pricing
                          ? `Pay ₹${pricing.currentTotal.toLocaleString('en-IN')} via Razorpay`
                          : 'Select Dates to View Price'}
                      </span>
                    </>
                  ) : (
                    <>
                      <span>Request Concierge Contact</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}


