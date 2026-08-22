import { NextResponse } from 'next/server';
import { prisma, calculateBookingPrice } from '@villa-platform/database';
import { processLedgerTransaction } from '../../../../../../../packages/database/queries/ledger';
import { calcOrderTotal, FinancialState, buildSnapshotStaySegments, buildSnapshotGuests, buildSnapshotServices } from '../../../../../../../packages/database/queries/financial-engine';
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
      numGuests,
      dailyGuestsCount,
      paymentType,
      paymentRequired,
      selectedServices,
      promoCode,
      bookingReason,
      internalNotes,
      segments, // Support for complex segmented payload
    } = body;

    let villa = await prisma.villa.findFirst({
      where: villaId ? { id: villaId } : undefined,
      include: { pricingRules: true },
    });

    if (!villa) {
      villa = await prisma.villa.findFirst({ include: { pricingRules: true } });
    }

    let user = await prisma.user.findFirst();

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

    if (!villa) {
      return NextResponse.json({ error: 'No villa available in database. Please run db:seed.' }, { status: 400 });
    }

    // Resolve Services
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

    // Resolve Promo
    let resolvedPromo = null;
    if (promoCode) {
      resolvedPromo = await prisma.promoCode.findUnique({
        where: { code: String(promoCode).toUpperCase() },
      });
      if (resolvedPromo?.status !== 'ACTIVE') resolvedPromo = null;
    }

    let start = new Date(checkIn || (segments ? segments[0].checkIn : Date.now() + 86400000 * 7));
    let end = new Date(checkOut || (segments ? segments[segments.length-1].checkOut : Date.now() + 86400000 * 10));

    // Check for overlapping bookings to prevent double-booking
    const overlappingBookings = await prisma.booking.findMany({
      where: {
        villaId: villa.id,
        status: { notIn: ['CANCELLED', 'ARCHIVED', 'DRAFT'] },
        OR: [
          {
            checkIn: { lt: end },
            checkOut: { gt: start }
          }
        ]
      }
    });

    if (overlappingBookings.length > 0) {
      return NextResponse.json({ error: 'The selected dates overlap with an existing booking.' }, { status: 409 });
    }

    let orderTotal = 0;
    let cleaningFee = 1500;
    let discount = 0;
    let finalNightlyBreakdown = [];
    let finalServiceBreakdown = [];
    let stateForEngine: FinancialState | null = null;
    let gstAmount = 0;

    // Use Advanced Financial Engine if segments are provided
    if (segments && Array.isArray(segments)) {
      stateForEngine = {
        segments,
        cleaningFee,
        discount,
        totalPaid: 0, advancePaid: 0, balancePaid: 0, totalRefunded: 0, pendingRefund: 0, status: 'DRAFT'
      };
      orderTotal = calcOrderTotal(stateForEngine);
      // Flat values for legacy compatibility
      gstAmount = Math.round(orderTotal - (orderTotal / 1.18)); // Reverse engineer GST for now
    } else {
      // Legacy basic pricing calculation
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
      orderTotal = pricing.total;
      cleaningFee = pricing.cleaningFee;
      discount = pricing.discount;
      gstAmount = pricing.gst;
      finalNightlyBreakdown = pricing.nightlyBreakdown as any;
      finalServiceBreakdown = pricing.serviceBreakdown as any;
    }

    const bookingCode = `MVN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;
    const initialStatus = paymentRequired ? (paymentType === 'ADVANCE' ? 'ADVANCE_PAID' : 'AWAITING_PAYMENT') : 'CONFIRMED';
    const targetPaidAmount = paymentRequired 
      ? (paymentType === 'ADVANCE' ? Math.round(orderTotal * 0.33) : orderTotal) 
      : 0;

    // Wallet Deductions
    const userWithWallet = await prisma.user.findUnique({ where: { id: user.id } });
    const walletBalance = Number(userWithWallet?.walletBalance || 0);
    
    // We want to deduct from wallet based on what they are trying to pay right now.
    // If targetPaidAmount is > 0, we can use wallet for it.
    let walletUsed = 0;
    if (targetPaidAmount > 0 && walletBalance > 0) {
      walletUsed = Math.min(walletBalance, targetPaidAmount);
    }
    
    const finalPaidAmount = targetPaidAmount; // They 'paid' this much (partially from wallet, partially out of pocket/mock)

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
          currentTotal: 0,
          totalPaid: 0,
          totalAdvancePaid: 0,
          amountToBePaid: 0,
          status: initialStatus,
          paymentType: paymentType || 'FULL',
          bookingType: bookingType || 'REGULAR',
          bookingSource: bookingSource || 'WEBSITE',
          paymentRequired: paymentRequired ?? true,
          bookingReason: bookingReason || null,
          internalNotes: internalNotes || null,
          nightlyBreakdown: finalNightlyBreakdown,
          servicesSnapshot: finalServiceBreakdown,
          cleaningFee,
          platformFee: 0,
          gstAmount,
          discountAmount: discount,
          promoCodeId: resolvedPromo?.id || null,
          idempotencyKey: `idemp-engine-${crypto.randomUUID()}`,
        }
      });

      let snapshotStaySegments = [];
      let snapshotGuests: Record<string, any> = {};
      let snapshotServices: Record<string, any> = {};

      if (stateForEngine) {
        snapshotStaySegments = buildSnapshotStaySegments(stateForEngine);
        snapshotGuests = buildSnapshotGuests(stateForEngine);
        snapshotServices = buildSnapshotServices(stateForEngine);

        // Also physically save segments to DB if using advanced engine
        await tx.staySegment.createMany({
          data: stateForEngine.segments.map((s: any) => ({
            bookingId: newBooking.id,
            checkIn: new Date(s.checkIn),
            checkOut: new Date(s.checkOut),
            status: s.status,
            adults: s.guests[0]?.adults || 2,
            children: s.guests[0]?.children || 0,
            staySubtotal: s.accommodation
          }))
        });

      } else {
        snapshotStaySegments = [{ 
          checkIn: start.toISOString().split('T')[0], 
          checkOut: end.toISOString().split('T')[0] 
        }];
        finalNightlyBreakdown.forEach((n: any) => {
          snapshotGuests[n.date] = { adults: numGuests || 2, children: 0 };
        });
        if (requestedServices.length > 0) {
          const startDateStr = start.toISOString().split('T')[0];
          snapshotServices[startDateStr] = requestedServices.map((s: any) => `${s.name} ×${s.quantity || 1}`);
        }
      }

      await processLedgerTransaction(tx as any, newBooking.id, {
        actionType: 'CREATE',
        actorRole: mode === 'OWNER' ? 'OWNER' : 'CUSTOMER',
        orderValueDelta: orderTotal,
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
      walletUsed,
    });
  } catch (error: any) {
    console.error('Failed to execute booking engine create:', error);
    return NextResponse.json({ error: error.message || 'Booking engine creation failed' }, { status: 500 });
  }
}
