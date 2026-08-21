// apps/web/src/app/api/villas/[id]/availability/route.ts
// GET /api/villas/[id]/availability — Check calendar availability and booked dates

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@villa-platform/database";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const identifier = resolvedParams.id;
    const { searchParams } = new URL(request.url);
    const monthStr = searchParams.get("month"); // e.g. "2026-08"

    const villa = await prisma.villa.findFirst({
      where: {
        OR: [{ id: identifier }, { slug: identifier }],
      },
      select: { id: true },
    });

    if (!villa) {
      return NextResponse.json(
        { success: false, error: "Villa not found" },
        { status: 404 }
      );
    }

    // Fetch existing active bookings for this villa
    const activeBookings = await prisma.booking.findMany({
      where: {
        villaId: villa.id,
        status: {
          in: ["ADVANCE_PAID", "CONFIRMED", "CHECKED_IN"],
        },
      },
      select: {
        checkIn: true,
        checkOut: true,
      },
    });

    // Fetch explicit blocked dates in VillaAvailability
    const blockedDates = await prisma.villaAvailability.findMany({
      where: {
        villaId: villa.id,
        isBlocked: true,
      },
      select: {
        date: true,
      },
    });

    return NextResponse.json({
      success: true,
      data: {
        villaId: villa.id,
        bookedRanges: activeBookings.map((b) => ({
          checkIn: b.checkIn.toISOString().split("T")[0],
          checkOut: b.checkOut.toISOString().split("T")[0],
        })),
        blockedDates: blockedDates.map((d) => d.date.toISOString().split("T")[0]),
      },
    });
  } catch (error) {
    console.error("GET /api/villas/[id]/availability error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch availability" },
      { status: 500 }
    );
  }
}
