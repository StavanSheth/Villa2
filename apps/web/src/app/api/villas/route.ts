// apps/web/src/app/api/villas/route.ts
// GET /api/villas — List active villas with images, addons, reviews, and pricing rules

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@villa-platform/database";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const location = searchParams.get("location");
    const minGuests = searchParams.get("guests") ? Number(searchParams.get("guests")) : undefined;
    const limit = searchParams.get("limit") ? Number(searchParams.get("limit")) : 20;

    const where: Record<string, unknown> = { isActive: true };
    if (location) {
      where.location = { contains: location, mode: "insensitive" };
    }
    if (minGuests && !isNaN(minGuests)) {
      where.maxGuests = { gte: minGuests };
    }

    const villas = await prisma.villa.findMany({
      where,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        images: {
          orderBy: { sortOrder: "asc" },
        },
        addons: true,
        pricingRules: true,
        reviews: {
          where: { status: "APPROVED" },
          select: {
            rating: true,
          },
        },
      },
    });

    const enriched = villas.map((v) => {
      const avgRating =
        v.reviews.length > 0
          ? v.reviews.reduce((acc: number, r: { rating: number }) => acc + r.rating, 0) / v.reviews.length
          : null;

      return {
        ...v,
        basePricePerNight: Number(v.basePricePerNight),
        cleaningFee: Number(v.cleaningFee),
        securityDeposit: Number(v.securityDeposit),
        averageRating: avgRating ? Number(avgRating.toFixed(1)) : null,
        reviewCount: v.reviews.length,
      };
    });

    return NextResponse.json({ success: true, count: enriched.length, data: enriched });
  } catch (error) {
    console.warn("GET /api/villas error:", error);
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ success: false, error: "Service temporarily unavailable" }, { status: 503 });
    }
    const mockVillas = [
      {
        id: "cm9defaultvilla0001",
        name: "Seven C Villa",
        slug: "seven-c-villa",
        description: "An exclusive ultra-luxury sanctuary featuring private infinity pools and dedicated butler service.",
        basePricePerNight: 25000,
        cleaningFee: 2500,
        securityDeposit: 15000,
        maxGuests: 12,
        bedrooms: 5,
        bathrooms: 6,
        averageRating: 4.9,
        reviewCount: 42,
        images: [
          { url: "https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=1200&q=80" },
        ],
      },
    ];
    return NextResponse.json({ success: true, count: mockVillas.length, data: mockVillas, mock: true });
  }
}

