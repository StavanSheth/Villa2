import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@villa-platform/database";
import { getAuthUser } from "@villa-platform/auth/permissions";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const villaId = searchParams.get("villaId");
    const limit = Number(searchParams.get("limit") || 10);

    const where = villaId ? { villaId, status: "APPROVED" } : { status: "APPROVED" };

    const reviews = await prisma.review.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        user: { select: { firstName: true, lastName: true, avatarUrl: true } }
      }
    });

    return NextResponse.json({ success: true, count: reviews.length, data: reviews });
  } catch (error) {
    console.warn("GET /api/reviews error:", error);
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
    const { bookingId, villaId, rating, comment } = body;

    // Verify user actually stayed at this villa
    const booking = await prisma.booking.findFirst({
      where: {
        id: bookingId,
        userId: user.id,
        villaId: villaId,
        status: { in: ["COMPLETED", "CHECKED_OUT"] }
      }
    });

    if (!booking) {
      return NextResponse.json({ success: false, error: "Valid completed booking required to leave a review" }, { status: 403 });
    }

    // Create review (starts as PENDING for moderation)
    const review = await prisma.review.create({
      data: {
        rating,
        comment,
        status: "PENDING",
        userId: user.id,
        villaId,
        bookingId
      }
    });

    return NextResponse.json({ success: true, data: review });
  } catch (error) {
    console.warn("POST /api/reviews error:", error);
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ success: false, error: "Service temporarily unavailable" }, { status: 503 });
    }
    return NextResponse.json({ success: true, data: { id: "mock_rev_1", status: "PENDING" }, mock: true });
  }
}
