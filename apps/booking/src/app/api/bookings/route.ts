// apps/booking/src/app/api/bookings/route.ts
// Ponytail: Central booking API — single source of truth for all dashboards.
// All apps (Customer :3001, Owner :3004, Admin :3002) call these endpoints.

import { NextResponse } from 'next/server';
import { prisma, calculateBookingPrice } from '@villa-platform/database';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const {
      villaId,
      checkIn,
      checkOut,
      totalGuests,
      paymentType,    // "FULL" | "ADVANCE"
      specialReqs,
      selectedServices, // Array of { serviceDefId, quantity }
      promoCode,      // string code or null
      lockId,         // ID of the ReservationLock
      idempotencyKey, // Idempotency key to prevent duplicate booking
    } = body;
    
    if (!lockId || !idempotencyKey) {
      return NextResponse.json({ error: 'Missing lockId or idempotencyKey' }, { status: 400 });
    }

    // --- Resolve user from JWT header ---
    const cookieHeader = req.headers.get('cookie') || '';
    const matchAccess = cookieHeader.match(/access_token=([^;]+)/);
    
    let userId;
    if (matchAccess) {
      try {
        const token = matchAccess[1];
        const payloadBase64 = token.split('.')[1];
        const payload = JSON.parse(atob(payloadBase64));
        
        // Check expiration
        if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
          return NextResponse.json({ error: 'Token expired' }, { status: 401 });
        }
        
        userId = payload.id;
      } catch (e) {
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
      }
    }

    const user = await prisma.user.findFirst({ where: userId ? { id: userId } : undefined });
    const villa = await prisma.villa.findUnique({
      where: { id: villaId },
      include: { pricingRules: true },
    });

    if (!user || !villa) {
      return NextResponse.json({ error: 'Database not seeded with users/villas' }, { status: 500 });
    }

    // --- Resolve services ---
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

    // --- Resolve promo code ---
    let resolvedPromo = null;
    if (promoCode) {
      resolvedPromo = await prisma.promoCode.findUnique({
        where: { code: promoCode.toUpperCase() },
      });
      if (!resolvedPromo || resolvedPromo.status !== 'ACTIVE') {
        resolvedPromo = null;
      }
      if (resolvedPromo?.expiryDate && new Date() > resolvedPromo.expiryDate) {
        resolvedPromo = null;
      }
      if (resolvedPromo?.usageLimit && resolvedPromo.usageCount >= resolvedPromo.usageLimit) {
        resolvedPromo = null;
      }
    }

    // --- Calculate price using the SINGLE centralized function ---
    const pricing = calculateBookingPrice({
      checkIn: new Date(checkIn),
      checkOut: new Date(checkOut),
      pricingRules: villa.pricingRules,
      services: requestedServices,
      guests: totalGuests,
      promoCode: resolvedPromo,
    });

    // --- Determine paid amount ---
    const paidAmount = paymentType === 'ADVANCE' ? Math.round(pricing.total * 0.33) : pricing.total;
    const initialStatus = paymentType === 'ADVANCE' ? 'ADVANCE_PAID' : 'CONFIRMED';

    // --- Generate booking code ---
    const bookingCode = `MVN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    // --- Create booking + initial event in a transaction ---
    const booking = await prisma.$transaction(async (tx) => {
      // 1. Idempotency Check
      const existingBooking = await tx.booking.findUnique({
        where: { idempotencyKey },
      });
      if (existingBooking) {
        // Return existing booking to simulate idempotency success
        return existingBooking;
      }

      // 2. Lock Verification
      const lock = await tx.$queryRaw`
        SELECT * FROM "ReservationLock"
        WHERE id = ${lockId}
        FOR UPDATE
      ` as any[];

      if (lock.length === 0) {
        throw new Error('Reservation lock not found.');
      }
      if (lock[0].status !== 'LOCKED' || lock[0].expiresAt < new Date()) {
        throw new Error('Reservation lock has expired or is invalid.');
      }
      if (lock[0].customerId !== user.id) {
        throw new Error('Unauthorized to use this lock.');
      }

      // 3. Promo Usage Tracking & Row-level locking
      if (resolvedPromo) {
        const promoRows = await tx.$queryRaw`
          SELECT * FROM "PromoCode"
          WHERE id = ${resolvedPromo.id}
          FOR UPDATE
        ` as any[];
        
        if (promoRows.length === 0) throw new Error('Promo not found');
        const promoRecord = promoRows[0];

        if (promoRecord.usageLimit && promoRecord.usageCount >= promoRecord.usageLimit) {
          throw new Error('Promo code usage limit reached.');
        }

        const userUsages = await tx.promoUsage.count({
          where: { promoId: promoRecord.id, customerId: user.id }
        });

        if (userUsages >= promoRecord.usagePerUser) {
          throw new Error('You have already used this promo code.');
        }

        // Increment promo usage and create tracking record
        await tx.promoCode.update({
          where: { id: promoRecord.id },
          data: { usageCount: { increment: 1 } },
        });
      }

      const newBooking = await tx.booking.create({
        data: {
          bookingCode,
          userId: user.id,
          villaId: villa.id,
          checkIn: new Date(checkIn),
          checkOut: new Date(checkOut),
          totalGuests,
          currentTotal: pricing.total,
          totalPaid: paidAmount,
          totalAdvancePaid: paymentType === 'ADVANCE' || paymentType === 'FULL' ? paidAmount : 0,
          amountToBePaid: pricing.total - paidAmount,
          status: initialStatus,
          paymentType: paymentType || 'FULL',
          specialReqs: specialReqs || '',
          nightlyBreakdown: pricing.nightlyBreakdown as any,
          servicesSnapshot: pricing.serviceBreakdown as any,
          cleaningFee: pricing.cleaningFee,
          platformFee: pricing.platformFee,
          gstAmount: pricing.gst,
          discountAmount: pricing.discount,
          promoCodeId: resolvedPromo?.id || null,
          idempotencyKey,
        },
      });

      // Create BookingEvent audit record
      await tx.bookingEvent.create({
        data: {
          bookingId: newBooking.id,
          actorId: user.id,
          actorRole: 'CUSTOMER',
          action: 'CREATE',
          oldState: null,
          newState: initialStatus,
          metadata: {
            totalAmount: pricing.total,
            paidAmount,
            paymentType: paymentType || 'FULL',
            nights: pricing.nights,
            promoApplied: resolvedPromo?.code || null,
          },
        },
      });

      // Attach selected services as BookingService records
      if (requestedServices.length > 0) {
        for (const svc of requestedServices) {
          const svcDef = allServices.find((d) => d.name === svc.name);
          if (!svcDef) continue;
          const lineItem = pricing.serviceBreakdown.find((s) => s.name === svc.name);
          await tx.bookingService.create({
            data: {
              bookingId: newBooking.id,
              serviceId: svcDef.id,
              name: svc.name,
              quantity: svc.quantity || 1,
              totalPrice: lineItem?.total || 0,
            },
          });
        }
      }

      // Create promo usage tracker
      if (resolvedPromo) {
        await tx.promoUsage.create({
          data: {
            promoId: resolvedPromo.id,
            customerId: user.id,
            bookingId: newBooking.id,
          }
        });
      }

      // 4. Mark lock as CONVERTED
      await tx.reservationLock.update({
        where: { id: lockId },
        data: { status: 'CONVERTED' },
      });

      return newBooking;
    }, {
      isolationLevel: 'Serializable',
      timeout: 10000 // Category 3: Prevent DB lock exhaustion
    });

    return NextResponse.json({
      ...booking,
      pricing,  // Return pricing breakdown so the UI can render it
    });
  } catch (error) {
    console.error('Failed to create booking:', error);
    return NextResponse.json({ error: 'Failed to create booking' }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const status = searchParams.get('status');
    const userId = searchParams.get('userId');

    const where: Record<string, unknown> = {};
    if (status) where.status = status;
    if (userId) where.userId = userId;

    const bookings = await prisma.booking.findMany({
      where,
      include: {
        user: true,
        villa: true,
        services: true,
        events: { orderBy: { createdAt: 'desc' }, take: 5 },
        orderTransactions: { orderBy: { srNo: 'desc' }, take: 1 },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(bookings);
  } catch (error) {
    console.error('Failed to fetch bookings:', error);
    return NextResponse.json({ error: 'Failed to fetch bookings' }, { status: 500 });
  }
}
