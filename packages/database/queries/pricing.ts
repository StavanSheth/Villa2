// packages/database/queries/pricing.ts
// Ponytail: Single source of truth for all booking price calculations.
// Used by: BookingWizard (via API), POST /api/bookings, Owner Ledger, Admin Dashboard.

import type { PricingRule, PromoCode } from "@prisma/client";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export interface NightlyPrice {
  date: string;       // ISO date string (YYYY-MM-DD)
  dayOfWeek: string;  // Mon, Tue, etc.
  price: number;
  ruleApplied: string; // WEEKDAY | WEEKEND | HOLIDAY | CUSTOM
  guests?: { adults: number, children: number };
}

export interface ServiceLineItem {
  name: string;
  chargeType: string;  // PER_BOOKING | PER_DAY | PER_GUEST
  unitPrice: number;
  quantity: number;
  total: number;
  chefGuests?: number;
}

export interface BookingPriceSummary {
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

export interface CalculatePriceParams {
  checkIn: Date;
  checkOut: Date;
  selectedDates?: string[];
  pricingRules: Pick<PricingRule, "type" | "startDate" | "endDate" | "price" | "minNights">[];
  services?: {
    name: string;
    price: number;
    chargeType: string; // PER_BOOKING | PER_DAY | PER_GUEST
    quantity?: number;
    dates?: string[];
    chefGuests?: number;
  }[];
  guests?: number;
  dailyGuestsCount?: Record<string, { adults: number, children: number }>;
  promoCode?: Pick<PromoCode, "code" | "type" | "value" | "minBookingAmt" | "maxDiscount" | "minNights" | "maxNights"> | null;
  cleaningFee?: number;
  platformFeePercent?: number;
  gstPercent?: number;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function isWeekend(d: Date): boolean {
  const day = d.getDay();
  return day === 0 || day === 6; // Sun or Sat
}

/**
 * Find the best matching PricingRule for a given date.
 * Priority: CUSTOM > HOLIDAY > WEEKEND > WEEKDAY
 */
function findRuleForDate(
  date: Date,
  rules: CalculatePriceParams["pricingRules"]
): { price: number; ruleType: string } {
  // 1. Try CUSTOM rules that cover this exact date range
  const customRule = rules.find(
    (r) =>
      r.type === "CUSTOM" &&
      r.startDate &&
      r.endDate &&
      date >= new Date(r.startDate) &&
      date <= new Date(r.endDate)
  );
  if (customRule) return { price: Number(customRule.price), ruleType: "CUSTOM" };

  // 2. Try HOLIDAY rules
  const holidayRule = rules.find(
    (r) =>
      r.type === "HOLIDAY" &&
      r.startDate &&
      r.endDate &&
      date >= new Date(r.startDate) &&
      date <= new Date(r.endDate)
  );
  if (holidayRule) return { price: Number(holidayRule.price), ruleType: "HOLIDAY" };

  // 3. Weekend
  if (isWeekend(date)) {
    const weekendRule = rules.find((r) => r.type === "WEEKEND");
    if (weekendRule) return { price: Number(weekendRule.price), ruleType: "WEEKEND" };
    // Fallback: 1.5x weekday
    const weekdayRule = rules.find((r) => r.type === "WEEKDAY");
    if (weekdayRule) return { price: Number(weekdayRule.price) * 1.5, ruleType: "WEEKEND" };
  }

  // 4. Weekday (default)
  const weekdayRule = rules.find((r) => r.type === "WEEKDAY");
  if (weekdayRule) return { price: Number(weekdayRule.price), ruleType: "WEEKDAY" };

  // Ultimate fallback (should never reach if DB is seeded)
  return { price: 10000, ruleType: "WEEKDAY" };
}

// ---------------------------------------------------------------------------
// Main Calculation
// ---------------------------------------------------------------------------

export function calculateBookingPrice(params: CalculatePriceParams): BookingPriceSummary {
  const {
    checkIn,
    checkOut,
    selectedDates = [],
    pricingRules,
    services = [],
    guests = 1,
    promoCode = null,
    cleaningFee = 1500,
    platformFeePercent = 0,
    gstPercent = 18,
  } = params;

  // --- Nightly Breakdown ---
  const nightlyBreakdown: NightlyPrice[] = [];
  let baseAccommodation = 0;

  const startDate = new Date(checkIn);
  startDate.setHours(0, 0, 0, 0);
  const endDate = new Date(checkOut);
  endDate.setHours(0, 0, 0, 0);

  if (selectedDates && selectedDates.length > 0) {
    selectedDates.forEach((d) => {
      let dt: Date;
      if (typeof d === 'string' && d.includes('-')) {
        const [y, m, day] = d.split('-');
        dt = new Date(Number(y), Number(m) - 1, Number(day));
      } else {
        dt = new Date(d);
      }
      dt.setHours(0, 0, 0, 0);
      const { price, ruleType } = findRuleForDate(dt, pricingRules);
      const dtStr = toDateStr(dt);
      const dayGuests = params.dailyGuestsCount?.[dtStr];

      nightlyBreakdown.push({
        date: dtStr,
        dayOfWeek: DAY_NAMES[dt.getDay()],
        price: price,
        ruleApplied: ruleType,
        ...(dayGuests ? { guests: dayGuests } : {}),
      });
      baseAccommodation += price;
    });
  } else {
    const currentDate = new Date(startDate);
    while (currentDate < endDate) {
      const { price, ruleType } = findRuleForDate(currentDate, pricingRules);
      nightlyBreakdown.push({
        date: toDateStr(currentDate),
        dayOfWeek: DAY_NAMES[currentDate.getDay()],
        price,
        ruleApplied: ruleType,
      });
      baseAccommodation += price;
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  const nights = nightlyBreakdown.length;

  // --- Services ---
  const serviceBreakdown: ServiceLineItem[] = services.map((svc) => {
    const qty = svc.quantity ?? 1;
    const isChef = svc.name.toLowerCase().includes('chef');
    const datesCount = svc.dates && svc.dates.length > 0 ? svc.dates.length : nights;
    const chefGuests = isChef && svc.chefGuests ? svc.chefGuests : guests;
    const isQuantityService = svc.chargeType === 'PER_GUEST' || svc.name.toLowerCase().includes('bed') || svc.name.toLowerCase().includes('mattress');

    let total = 0;
    let finalQty = qty;

    if (isQuantityService) {
      total = svc.price * qty;
      finalQty = qty;
    } else {
      total = svc.price * datesCount;
      finalQty = datesCount;
    }

    return {
      name: svc.name,
      chargeType: svc.chargeType,
      unitPrice: svc.price,
      quantity: finalQty,
      total,
      ...(isChef && chefGuests ? { chefGuests } : {}),
    };
  });
  const servicesTotal = serviceBreakdown.reduce((sum, s) => sum + s.total, 0);

  // --- Promo Discount ---
  let discount = 0;
  let discountLabel: string | null = null;

  if (promoCode) {
    const bookingSubtotal = baseAccommodation + cleaningFee + servicesTotal;

    // Validate min amount
    if (promoCode.minBookingAmt && bookingSubtotal < Number(promoCode.minBookingAmt)) {
      // Promo not applicable — skip
    }
    // Validate min/max nights
    else if (promoCode.minNights && nights < promoCode.minNights) {
      // Not enough nights
    }
    else if (promoCode.maxNights && nights > promoCode.maxNights) {
      // Too many nights
    }
    else {
      if (promoCode.type === "PERCENTAGE") {
        discount = bookingSubtotal * (Number(promoCode.value) / 100);
        if (promoCode.maxDiscount && discount > Number(promoCode.maxDiscount)) {
          discount = Number(promoCode.maxDiscount);
        }
        discountLabel = `${promoCode.code} (${Number(promoCode.value)}% off)`;
      } else {
        // FIXED
        discount = Math.min(Number(promoCode.value), bookingSubtotal);
        discountLabel = `${promoCode.code} (Flat ₹${Number(promoCode.value)})`;
      }
    }
  }

  // --- Totals ---
  const subtotal = baseAccommodation + cleaningFee + servicesTotal - discount;
  const platformFee = subtotal > 0 ? Math.round(subtotal * (platformFeePercent / 100)) : 0;
  const taxableAmount = subtotal + platformFee;
  const gst = taxableAmount > 0 ? Math.round(taxableAmount * (gstPercent / 100)) : 0;
  const total = taxableAmount + gst;

  return {
    nights,
    nightlyBreakdown,
    baseAccommodation,
    cleaningFee,
    platformFee,
    serviceBreakdown,
    servicesTotal,
    discount,
    discountLabel,
    subtotal,
    gst,
    total,
  };
}
