// packages/payment/calculations/index.ts
// Financial Calculations for Villa Bookings (INR)
// Ponytail: Full breakdown with GST @ 18%, Razorpay gateway fee (2% + 18% GST on fee),
//           advance/balance split, and add-on totals

export interface PricingInput {
  basePricePerNight: number;
  numNights: number;
  addonsTotal?: number;
  cleaningFee?: number;
  securityDeposit?: number;
  discountAmount?: number;
  gstRate?: number;           // default 0.18 (18%)
  gatewayFeeRate?: number;    // default 0.02 (2%)
  gatewayFeeTaxRate?: number; // default 0.18 (18% GST on gateway fee)
  advancePercent?: number;    // default 25 (25% advance)
}

export interface PricingBreakdown {
  numNights: number;
  baseAmount: number;
  addonsAmount: number;
  cleaningFee: number;
  discountAmount: number;
  subtotal: number;         // base + addons + cleaning - discount
  taxAmount: number;        // GST @ 18% on subtotal
  gatewayFee: number;       // Razorpay 2% on (subtotal + tax)
  gatewayFeeTax: number;    // 18% GST on gateway fee
  securityDeposit: number;
  totalAmount: number;      // Final payable by customer
  advanceAmount: number;    // Partial payment: advance due now
  balanceAmount: number;    // Remaining to pay at check-in/out
}

/**
 * Calculates complete pricing breakdown for a booking including
 * gateway fees passed to customer and advance/balance split.
 */
export function calculateBookingPrice(input: PricingInput): PricingBreakdown {
  const numNights = Math.max(1, input.numNights);
  const baseAmount = round(input.basePricePerNight * numNights);
  const addonsAmount = round(input.addonsTotal || 0);
  const cleaningFee = round(input.cleaningFee || 0);
  const discountAmount = round(input.discountAmount || 0);
  const securityDeposit = round(input.securityDeposit || 0);
  const gstRate = input.gstRate ?? 0.18;
  const gatewayFeeRate = input.gatewayFeeRate ?? 0.02;
  const gatewayFeeTaxRate = input.gatewayFeeTaxRate ?? 0.18;
  const advancePercent = input.advancePercent ?? 25;

  const subtotal = Math.max(0, baseAmount + addonsAmount + cleaningFee - discountAmount);
  const taxAmount = round(subtotal * gstRate);

  // Razorpay gateway fee applied on (subtotal + tax)
  const chargeableAmount = subtotal + taxAmount;
  const gatewayFee = round(chargeableAmount * gatewayFeeRate);
  const gatewayFeeTax = round(gatewayFee * gatewayFeeTaxRate);

  const totalAmount = round(subtotal + taxAmount + gatewayFee + gatewayFeeTax + securityDeposit);

  // Advance/balance split
  const advanceAmount = round(totalAmount * (advancePercent / 100));
  const balanceAmount = round(totalAmount - advanceAmount);

  return {
    numNights,
    baseAmount,
    addonsAmount,
    cleaningFee,
    discountAmount,
    subtotal,
    taxAmount,
    gatewayFee,
    gatewayFeeTax,
    securityDeposit,
    totalAmount,
    advanceAmount,
    balanceAmount,
  };
}

/** Converts INR rupees to paise (Razorpay expects integer paise) */
export function toPaise(inrAmount: number): number {
  return Math.round(inrAmount * 100);
}

/** Converts paise back to INR rupees */
export function fromPaise(paiseAmount: number): number {
  return round(paiseAmount / 100);
}

/** Round to 2 decimal places */
function round(n: number): number {
  return Math.round(n * 100) / 100;
}
