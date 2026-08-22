// @ts-nocheck
// domains/bookings/repositories/index.ts
// Booking Repository Layer
// Ponytail: Clean data access methods for availability overlap checks and booking queries

import { prisma, Booking, BookingStatus } from "@villa-platform/database";

export class BookingsRepository {
  /**
   * Check if a villa has any active overlapping bookings for the requested date range.
   * Two ranges [start1, end1) and [start2, end2) overlap when start1 < end2 && end1 > start2.
   */
  public static async hasOverlappingBookings(
    villaId: string,
    checkIn: Date,
    checkOut: Date,
    excludeBookingId?: string,
    tx: any = prisma
  ): Promise<boolean> {
    const count = await tx.booking.count({
      where: {
        villaId,
        status: {
          in: ["PENDING", "CONFIRMED"],
        },
        checkIn: {
          lt: checkOut,
        },
        checkOut: {
          gt: checkIn,
        },
        ...(excludeBookingId ? { id: { not: excludeBookingId } } : {}),
      },
    });

    return count > 0;
  }

  /**
   * Create a new booking in the database
   */
  public static async createBooking(data: {
    bookingCode: string;
    villaId: string;
    userId: string;
    checkIn: Date;
    checkOut: Date;
    totalGuests: number;
    amountToBePaid: number;
    status?: string;
  }): Promise<Booking> {
    return prisma.booking.create({
      data: {
        ...data,
        status: data.status || "PENDING_PAYMENT",
      } as any,
    });
  }

  /**
   * Find booking by ID or Booking Code
   */
  public static async findBookingByIdOrCode(idOrCode: string): Promise<Booking | null> {
    return prisma.booking.findFirst({
      where: {
        OR: [{ id: idOrCode }, { bookingCode: idOrCode }],
      },
    });
  }

  /**
   * Update booking status
   */
  public static async updateStatus(
    bookingId: string,
    status: BookingStatus
  ): Promise<Booking> {
    return prisma.booking.update({
      where: { id: bookingId },
      data: { status },
    });
  }

  /**
   * List bookings for a specific user
   */
  public static async listForUser(userId: string): Promise<Booking[]> {
    return prisma.booking.findMany({
      where: { userId },
      orderBy: { checkIn: "desc" },
    });
  }
}
