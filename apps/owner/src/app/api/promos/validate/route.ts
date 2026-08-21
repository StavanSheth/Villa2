// apps/booking/src/app/api/promos/validate/route.ts
// Validate a promo code against booking parameters

import { NextResponse } from 'next/server';
import { prisma } from '@villa-platform/database';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { code, nights, bookingAmount } = body;

    if (!code) {
      return NextResponse.json({ valid: false, error: 'Promo code is required' }, { status: 400 });
    }

    const promo = await prisma.promoCode.findUnique({
      where: { code: code.toUpperCase() },
    });

    if (!promo) {
      return NextResponse.json({ valid: false, error: 'Promo code not found' });
    }

    if (promo.status !== 'ACTIVE') {
      return NextResponse.json({ valid: false, error: 'Promo code is no longer active' });
    }

    if (promo.expiryDate && new Date() > promo.expiryDate) {
      return NextResponse.json({ valid: false, error: 'Promo code has expired' });
    }

    if (promo.usageLimit && promo.usageCount >= promo.usageLimit) {
      return NextResponse.json({ valid: false, error: 'Promo code usage limit reached' });
    }

    if (promo.minNights && nights && nights < promo.minNights) {
      return NextResponse.json({ valid: false, error: `Minimum ${promo.minNights} nights required` });
    }

    if (promo.maxNights && nights && nights > promo.maxNights) {
      return NextResponse.json({ valid: false, error: `Maximum ${promo.maxNights} nights allowed` });
    }

    if (promo.minBookingAmt && bookingAmount && bookingAmount < Number(promo.minBookingAmt)) {
      return NextResponse.json({ valid: false, error: `Minimum booking amount ₹${Number(promo.minBookingAmt).toLocaleString()} required` });
    }

    // Calculate discount preview
    let discountPreview = 0;
    if (promo.type === 'PERCENTAGE') {
      discountPreview = (bookingAmount || 0) * (Number(promo.value) / 100);
      if (promo.maxDiscount && discountPreview > Number(promo.maxDiscount)) {
        discountPreview = Number(promo.maxDiscount);
      }
    } else {
      discountPreview = Number(promo.value);
    }

    return NextResponse.json({
      valid: true,
      promo: {
        code: promo.code,
        type: promo.type,
        value: Number(promo.value),
        maxDiscount: promo.maxDiscount ? Number(promo.maxDiscount) : null,
        discountPreview: Math.round(discountPreview),
        description: promo.description,
      },
    });
  } catch (error) {
    console.error('Promo validation error:', error);
    return NextResponse.json({ valid: false, error: 'Validation failed' }, { status: 500 });
  }
}
