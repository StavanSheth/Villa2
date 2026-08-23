import { NextResponse } from 'next/server';
import { prisma, calculateBookingPrice, processLedgerTransaction } from '@villa-platform/database';
import { requireAuth } from '../../../../lib/auth';
import crypto from 'node:crypto';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      mode,
      bookingType,
      bookingSource,
      villaId,
      checkIn,
      checkOut,
      selectedDates,
      dailyGuestsCount,
      numGuests,
      paymentType,
      paymentRequired,
      selectedServices,
      promoCode,
      bookingReason,
      internalNotes,
      guestIdProofs,
    } = body;

    let villa = await prisma.villa.findFirst({
      where: villaId ? { id: villaId } : undefined,
      include: { pricingRules: true },
    });

    if (!villa) {
      villa = await prisma.villa.findFirst({ include: { pricingRules: true } });
    }

    const auth = await requireAuth();
    let user = null;

    if (auth && auth.userId) {
      user = await prisma.user.findUnique({ where: { id: auth.userId } });
    }

    if (!user) {
      // Fallback if somehow not authenticated or testing without cookies
      user = await prisma.user.findFirst({ where: { email: 'superadmin@mavon.online' } })
        || await prisma.user.findFirst();
        
      if (!user) {
        user = await prisma.user.create({
          data: {
            email: 'demo@mavon.online',
            firstName: 'Demo',
            lastName: 'Guest',
            firebaseUid: 'demo-uid',
          }
        });
      }
    }

    if (!villa) {
      return NextResponse.json({ error: 'No villa available in database. Please run db:seed.' }, { status: 400 });
    }

    // Resolve Services
    const allServices = await prisma.serviceDef.findMany({ where: { isActive: true } });
    const requestedServices = (selectedServices || []).map((s: { serviceDefId: string; quantity?: number }) => {
      const def = allServices.find((d) => d.id === s.serviceDefId);
      if (!def) return null;
      return {
        name: def.name,
        price: Number(def.price),
        chargeType: def.chargeType,
        quantity: s.quantity || 1,
      };
    }).filter(Boolean);

    // Resolve Promo
    let resolvedPromo = null;
    if (promoCode) {
      resolvedPromo = await prisma.promoCode.findUnique({
        where: { code: String(promoCode).toUpperCase() },
      });
      if (resolvedPromo?.status !== 'ACTIVE') resolvedPromo = null;
    }

    const start = new Date(checkIn || Date.now() + 86400000 * 7);
    const end = new Date(checkOut || Date.now() + 86400000 * 10);

    const pricing = calculateBookingPrice({
      checkIn: start,
      checkOut: end,
      selectedDates: selectedDates || [],
      pricingRules: villa.pricingRules,
      services: requestedServices,
      guests: numGuests || 2,
      dailyGuestsCount,
      promoCode: resolvedPromo,
    });

    if (paymentRequired === false) {
      pricing.total = 0;
      pricing.subtotal = 0;
      pricing.gst = 0;
      pricing.platformFee = 0;
      pricing.cleaningFee = 0;
      pricing.nightlyBreakdown.forEach((n: any) => n.price = 0);
      pricing.serviceBreakdown.forEach((s: any) => { s.unitPrice = 0; s.total = 0; });
    }

    const bookingCode = `MVN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const initialStatus = paymentRequired ? (paymentType === 'ADVANCE' ? 'ADVANCE_PAID' : 'AWAITING_PAYMENT') : 'CONFIRMED';
    const targetPaidAmount = paymentRequired 
      ? (paymentType === 'ADVANCE' ? Math.round(pricing.total * 0.33) : pricing.total) 
      : 0;

    // Wallet Deductions
    const userWithWallet = await prisma.user.findUnique({ where: { id: user.id } });
    const walletBalance = Number(userWithWallet?.walletBalance || 0);
    
    let walletUsed = 0;
    if (targetPaidAmount > 0 && walletBalance > 0) {
      walletUsed = Math.min(walletBalance, targetPaidAmount);
    }
    
    const finalPaidAmount = targetPaidAmount;

    const booking = await prisma.$transaction(async (tx) => {
      if (walletUsed > 0) {
        await tx.user.update({
          where: { id: user.id },
          data: { walletBalance: { decrement: walletUsed } }
        });
        console.log(`[WALLET]: Deducted ₹${walletUsed} from user ${user.id} for booking ${bookingCode}`);
      }

      const newBooking = await tx.booking.create({
        data: {
          bookingCode,
          userId: user.id,
          villaId: villa.id,
          checkIn: start,
          checkOut: end,
          totalGuests: numGuests || 2,
          currentTotal: pricing.total,
          totalPaid: finalPaidAmount,
          status: initialStatus,
          paymentType: paymentType || 'FULL',
          bookingType: bookingType || 'REGULAR',
          bookingSource: bookingSource || 'OWNER',
          paymentRequired: paymentRequired ?? true,
          bookingReason: bookingReason || null,
          internalNotes: internalNotes || null,
          nightlyBreakdown: pricing.nightlyBreakdown as any,
          servicesSnapshot: pricing.serviceBreakdown as any,
          cleaningFee: pricing.cleaningFee,
          platformFee: pricing.platformFee,
          gstAmount: pricing.gst,
          discountAmount: pricing.discount,
          promoCodeId: resolvedPromo?.id || null,
          idempotencyKey: `idemp-engine-${crypto.randomUUID()}`,
        },
      });

      // Insert Guest ID Proofs if provided
      if (guestIdProofs && Array.isArray(guestIdProofs) && guestIdProofs.length > 0) {
        await tx.guestIdProof.createMany({
          data: guestIdProofs.map((proof: any) => ({
            bookingId: newBooking.id,
            guestName: proof.name,
            fileUrl: proof.url,
            fileType: proof.type,
          }))
        });
      }

      let snapshotStaySegments = [{ 
        checkIn: start.toISOString().split('T')[0], 
        checkOut: end.toISOString().split('T')[0] 
      }];
      let snapshotGuests: Record<string, any> = {};
      pricing.nightlyBreakdown.forEach((n: any) => {
        snapshotGuests[n.date] = { adults: numGuests || 2, children: 0 };
      });
      let snapshotServices: Record<string, any> = {};
      if (requestedServices.length > 0) {
        const startDateStr = start.toISOString().split('T')[0];
        snapshotServices[startDateStr] = requestedServices.map((s: any) => `${s.name} ×${s.quantity || 1}`);
      }

      await processLedgerTransaction(tx as any, newBooking.id, {
        actionType: 'CREATE',
        actorRole: mode === 'CUSTOMER' ? 'CUSTOMER' : 'OWNER',
        orderValueDelta: pricing.total,
        advancePaymentDelta: paymentType === 'ADVANCE' || paymentType === 'FULL' ? finalPaidAmount : 0,
        balancePaymentDelta: 0,
        paymentType: finalPaidAmount > 0 ? (paymentType || 'FULL') : 'N/A',
        snapshotStaySegments,
        snapshotGuests,
        snapshotServices,
      });

      return newBooking;
    });

    return NextResponse.json({
      success: true,
      booking,
      pricing,
      walletUsed,
    });
  } catch (error: any) {
    console.error('Failed to execute booking engine create:', error);
    return NextResponse.json({ error: error.message || 'Booking engine creation failed' }, { status: 500 });
  }
}
