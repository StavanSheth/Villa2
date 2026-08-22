// apps/web/src/app/api/villas/[id]/route.ts
// GET /api/villas/[id] — Fetch detailed info for a villa by ID or slug

import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@villa-platform/database";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const resolvedParams = await params;
    const identifier = resolvedParams.id;

    const villa = await prisma.villa.findFirst({
      where: {
        id: identifier,
        isActive: true,
      },
      include: {
        images: {
          orderBy: { sortOrder: "asc" },
        },
        addons: true,
        pricingRules: true,
        reviews: {
          where: { status: "APPROVED" },
          include: {
            user: {
              select: { name: true, avatarUrl: true },
            },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    });

    if (!villa) {
      return NextResponse.json(
        { success: false, error: "Villa not found" },
        { status: 404 }
      );
    }

    const avgRating =
      villa.reviews.length > 0
        ? villa.reviews.reduce((acc: number, r: { rating: number }) => acc + r.rating, 0) / villa.reviews.length
        : null;

    const formatted = {
      ...villa,
      basePricePerNight: Number(villa.basePricePerNight),
      cleaningFee: Number(villa.cleaningFee),
      securityDeposit: Number(villa.securityDeposit),
      averageRating: avgRating ? Number(avgRating.toFixed(1)) : null,
      reviewCount: villa.reviews.length,
    };

    return NextResponse.json({ success: true, data: formatted });
  } catch (error) {
    console.error("GET /api/villas/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to fetch villa details" },
      { status: 500 }
    );
  }
}
