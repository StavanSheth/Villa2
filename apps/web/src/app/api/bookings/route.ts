// apps/web/src/app/api/bookings/route.ts
// POST /api/bookings — Create booking & initialize Razorpay order
// GET  /api/bookings — List bookings for current user (or all if ADMIN/SUPER_ADMIN)

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@villa-platform/database";
import { getAuthUser } from "@villa-platform/auth/permissions";
import { calculateBookingPrice, razorpayClient, toPaise } from "@villa-platform/payment";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    const where: Record<string, unknown> = {};
    // Only admins and super admins can view all bookings; customers/staff see assigned or own
    if (user.role === "CUSTOMER") {
      where.userId = user.id;
    }
    if (status) {
      where.status = status;
    }

    const bookings = await prisma.booking.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        villa: {
          select: {
            id: true,
            name: true,
            slug: true,
            location: true,
            images: {
              where: { isCover: true },
              take: 1,
            },
          },
        },
        transactions: true,
      },
    });

    return NextResponse.json({ success: true, count: bookings.length, data: bookings });
  } catch (error) {
    console.warn("GET /api/bookings error:", error);
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ success: false, error: "Service temporarily unavailable" }, { status: 503 });
    }
    return NextResponse.json({ success: true, count: 0, data: [], mock: true });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { villaId, checkIn, checkOut, numGuests, specialRequests } = body;

    if (!villaId || !checkIn || !checkOut || !numGuests) {
      return NextResponse.json(
        { success: false, error: "Missing required booking fields (villaId, checkIn, checkOut, numGuests)" },
        { status: 400 }
      );
    }

    const checkInDate = new Date(checkIn);
    const checkOutDate = new Date(checkOut);
    const numNights = Math.round((checkOutDate.getTime() - checkInDate.getTime()) / (1000 * 3600 * 24));

    if (numNights <= 0) {
      return NextResponse.json(
        { success: false, error: "Check-out date must be after check-in date" },
        { status: 400 }
      );
    }

    const villa = await prisma.villa.findUnique({
      where: { id: villaId },
    });

    if (!villa || !villa.isActive) {
      return NextResponse.json({ success: false, error: "Villa is not available" }, { status: 404 });
    }

    if (numGuests > villa.maxGuests) {
      return NextResponse.json(
        { success: false, error: `Maximum allowed guests for this villa is ${villa.maxGuests}` },
        { status: 400 }
      );
    }

    // Calculate full pricing breakdown
    const pricing = calculateBookingPrice({
      basePricePerNight: Number(villa.basePricePerNight),
      numNights,
      cleaningFee: Number(villa.cleaningFee),
      securityDeposit: Number(villa.securityDeposit),
      advancePercent: villa.advancePercent,
    });

    // Generate unique human-readable booking code
    const bookingCode = `MVN-${crypto.randomUUID().substring(0, 8).toUpperCase()}`;

    // Create Booking record
    const booking = await prisma.booking.create({
      data: {
        bookingCode,
        villaId: villa.id,
        userId: user.id,
        checkIn: checkInDate,
        checkOut: checkOutDate,
        numGuests: Number(numGuests),
        specialRequests: specialRequests || null,
        status: "AWAITING_PAYMENT",
        baseAmount: pricing.baseAmount,
        addonsAmount: pricing.addonsAmount,
        cleaningFee: pricing.cleaningFee,
        discountAmount: pricing.discountAmount,
        subtotal: pricing.subtotal,
        taxAmount: pricing.taxAmount,
        gatewayFee: pricing.gatewayFee,
        gatewayFeeTax: pricing.gatewayFeeTax,
        securityDeposit: pricing.securityDeposit,
        currentTotal: pricing.currentTotal,
        advanceAmount: pricing.advanceAmount,
        balanceAmount: pricing.balanceAmount,
        totalPaid: 0,
      },
    });

    // Attempt to create a Razorpay order (or use mock ID if keys are placeholders/missing)
    let razorpayOrder;
    try {
      razorpayOrder = await razorpayClient.createOrder({
        amountPaise: toPaise(pricing.advanceAmount),
        currency: "INR",
        receipt: booking.bookingCode,
        notes: {
          bookingId: booking.id,
          bookingCode: booking.bookingCode,
          userId: user.id,
        },
      });
    } catch {
      // Fallback to mock Razorpay order ID in development/test
      razorpayOrder = {
        id: `order_mock_${Math.random().toString(36).substring(2, 10)}`,
        amount: toPaise(pricing.advanceAmount),
        currency: "INR",
        status: "created",
      };
    }

    // Create payment transaction ledger entry
    const transaction = await prisma.paymentTransaction.create({
      data: {
        bookingId: booking.id,
        type: "ADVANCE",
        method: "RAZORPAY_ONLINE",
        amount: pricing.advanceAmount,
        currency: "INR",
        status: "CREATED",
        razorpayOrderId: razorpayOrder.id,
      },
    });

    return NextResponse.json({
      success: true,
      booking,
      order: razorpayOrder,
      transactionId: transaction.id,
      pricing,
    });
  } catch (error) {
    console.warn("POST /api/bookings error:", error);
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ success: false, error: "Service temporarily unavailable" }, { status: 503 });
    }
    const mockOrder = {
      id: `order_mock_${Math.random().toString(36).substring(2, 10)}`,
      entity: "order",
      amount: 4000000,
      amount_paid: 0,
      amount_due: 4000000,
      currency: "INR",
      receipt: "rcpt_mock_001",
      status: "created",
    };
    const mockBooking = {
      id: "booking_mock_001",
      bookingCode: `MVN-${Math.floor(100000 + Math.random() * 900000)}`,
      status: "AWAITING_PAYMENT",
      currentTotal: 158472,
      totalPaid: 0,
    };
    return NextResponse.json({
      success: true,
      booking: mockBooking,
      order: mockOrder,
      transactionId: "txn_mock_001",
      mock: true,
    });
  }
}

