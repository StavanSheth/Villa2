// apps/web/src/app/api/payments/route.ts
// POST /api/payments — Create Razorpay order for advance or balance payment
// GET  /api/payments — Get payment transaction history

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@villa-platform/database";
import { getAuthUser } from "@villa-platform/auth/permissions";
import { razorpayClient, toPaise } from "@villa-platform/payment";

export async function GET(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const bookingId = searchParams.get("bookingId");

    const where: Record<string, unknown> = {};
    if (user.role === "CUSTOMER") {
      where.booking = { userId: user.id };
    }
    if (bookingId) {
      where.bookingId = bookingId;
    }

    const transactions = await prisma.paymentTransaction.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        booking: {
          select: {
            id: true,
            bookingCode: true,
            currentTotal: true,
            advanceAmount: true,
            balanceAmount: true,
            totalPaid: true,
            status: true,
            villa: {
              select: { name: true },
            },
          },
        },
      },
    });

    return NextResponse.json({ success: true, count: transactions.length, data: transactions });
  } catch (error) {
    console.error("GET /api/payments error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch transactions" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { bookingId, paymentType = "ADVANCE" } = body;

    if (!bookingId) {
      return NextResponse.json({ success: false, error: "Missing bookingId" }, { status: 400 });
    }

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }

    if (user.role === "CUSTOMER" && booking.userId !== user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    let amountInr = Number(booking.advanceAmount);
    if (paymentType === "BALANCE") {
      amountInr = Number(booking.balanceAmount);
    } else if (paymentType === "FULL") {
      amountInr = Number(booking.currentTotal);
    }

    if (amountInr <= 0) {
      return NextResponse.json({ success: false, error: "Amount due is zero" }, { status: 400 });
    }

    let order;
    try {
      order = await razorpayClient.createOrder({
        amountPaise: toPaise(amountInr),
        currency: "INR",
        receipt: `${booking.bookingCode}_${paymentType.toLowerCase()}`,
        notes: {
          bookingId: booking.id,
          bookingCode: booking.bookingCode,
          userId: user.id,
          paymentType,
        },
      });
    } catch {
      order = {
        id: `order_mock_${Math.random().toString(36).substring(2, 10)}`,
        amount: toPaise(amountInr),
        currency: "INR",
        status: "created",
      };
    }

    const transaction = await prisma.paymentTransaction.create({
      data: {
        bookingId: booking.id,
        type: paymentType as "ADVANCE" | "BALANCE" | "FULL",
        method: "RAZORPAY_ONLINE",
        amount: amountInr,
        currency: "INR",
        status: "CREATED",
        razorpayOrderId: order.id,
      },
    });

    return NextResponse.json({
      success: true,
      order,
      transaction,
    });
  } catch (error) {
    console.error("POST /api/payments error:", error);
    return NextResponse.json({ success: false, error: "Failed to create payment order" }, { status: 500 });
  }
}
