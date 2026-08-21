// apps/web/src/app/api/bookings/[id]/route.ts
// GET / PATCH / DELETE /api/bookings/[id] — Manage single booking

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@villa-platform/database";
import { getAuthUser } from "@villa-platform/auth/permissions";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const bookingId = resolvedParams.id;

    const booking = await prisma.booking.findFirst({
      where: {
        OR: [{ id: bookingId }, { bookingCode: bookingId }],
      },
      include: {
        villa: {
          include: {
            images: {
              where: { isCover: true },
              take: 1,
            },
          },
        },
        user: {
          select: { id: true, name: true, email: true, phone: true },
        },
        transactions: {
          orderBy: { createdAt: "desc" },
        },
        invoices: true,
        guests: true,
      },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }

    if (user.role === "CUSTOMER" && booking.userId !== user.id) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({ success: true, data: booking });
  } catch (error) {
    console.error("GET /api/bookings/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to fetch booking details" }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 });
    }

    const resolvedParams = await params;
    const bookingId = resolvedParams.id;
    const body = await request.json();
    const { status, cancellationReason } = body;

    const booking = await prisma.booking.findUnique({
      where: { id: bookingId },
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: "Booking not found" }, { status: 404 });
    }

    // Customer can only cancel their own pending/awaiting booking
    if (user.role === "CUSTOMER") {
      if (booking.userId !== user.id) {
        return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
      }
      if (status !== "CANCELLED") {
        return NextResponse.json(
          { success: false, error: "Customers can only cancel their bookings" },
          { status: 403 }
        );
      }
    }

    const updated = await prisma.booking.update({
      where: { id: booking.id },
      data: {
        status,
        ...(status === "CANCELLED"
          ? { cancelledAt: new Date(), cancellationReason: cancellationReason || "User cancelled" }
          : {}),
        ...(status === "CHECKED_IN" ? { checkedInAt: new Date() } : {}),
        ...(status === "CHECKED_OUT" ? { checkedOutAt: new Date() } : {}),
      },
    });

    return NextResponse.json({ success: true, data: updated });
  } catch (error) {
    console.error("PATCH /api/bookings/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to update booking" }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getAuthUser();
    if (!user || (user.role !== "SUPER_ADMIN" && user.role !== "ADMIN")) {
      return NextResponse.json({ success: false, error: "Forbidden" }, { status: 403 });
    }

    const resolvedParams = await params;
    const bookingId = resolvedParams.id;

    await prisma.booking.delete({
      where: { id: bookingId },
    });

    return NextResponse.json({ success: true, message: "Booking deleted" });
  } catch (error) {
    console.error("DELETE /api/bookings/[id] error:", error);
    return NextResponse.json({ success: false, error: "Failed to delete booking" }, { status: 500 });
  }
}
