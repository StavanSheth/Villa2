// apps/booking/src/app/api/pricing/route.ts
// Server-side price preview — used by BookingWizard to get accurate pricing
// Uses the SAME calculateBookingPrice function as POST /api/bookings

import { NextResponse } from 'next/server';
import { prisma, calculateBookingPrice } from '@villa-platform/database';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { checkIn, checkOut, selectedDates, guests, dailyGuestsCount, selectedServices, promoCode } = body;

    if (!checkIn || !checkOut) {
      return NextResponse.json({ error: 'checkIn and checkOut are required' }, { status: 400 });
    }

    // Get villa + pricing rules
    const villa = await prisma.villa.findFirst({
      include: { pricingRules: true },
    });

    if (!villa) {
      return NextResponse.json({ error: 'No villa found' }, { status: 500 });
    }

    // Resolve services
    const allServices = await prisma.serviceDef.findMany({ where: { isActive: true } });
    const requestedServices = (selectedServices || []).map((s: { serviceDefId: string; quantity?: number; dates?: string[]; chefGuests?: number }) => {
      const def = allServices.find((d) => d.id === s.serviceDefId);
      if (!def) return null;
      return {
        name: def.name,
        price: Number(def.price),
        chargeType: def.chargeType,
        quantity: s.quantity || 1,
        dates: s.dates,
        chefGuests: s.chefGuests,
      };
    }).filter(Boolean);

    // Resolve promo
    let resolvedPromo = null;
    if (promoCode) {
      const promo = await prisma.promoCode.findUnique({
        where: { code: promoCode.toUpperCase() },
      });
      if (promo && promo.status === 'ACTIVE') {
        if (!promo.expiryDate || new Date() <= promo.expiryDate) {
          if (!promo.usageLimit || promo.usageCount < promo.usageLimit) {
            resolvedPromo = promo;
          }
        }
      }
    }

    const pricing = await calculateBookingPrice({
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      selectedDates: selectedDates || [],
      pricingRules: villa.pricingRules,
      services: requestedServices,
      guests: guests || 2,
      dailyGuestsCount,
      promoCode: resolvedPromo,
    });

    return NextResponse.json(pricing);
  } catch (error) {
    console.error('Pricing calculation error:', error);
    return NextResponse.json({ error: 'Failed to calculate pricing' }, { status: 500 });
  }
}
