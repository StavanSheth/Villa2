// @ts-nocheck
// domains/bookings/services/index.ts
// Core Bookings Domain Service
// Ponytail: Orchestrates date overlap checks, INR pricing calculation, and reservation persistence

import { prisma, Villa } from "@villa-platform/database";
import { calculateBookingPrice } from "@villa-platform/payments";
import { BookingsRepository } from "../repositories/index";
import {
  CheckAvailabilityInput,
  CreateBookingInput,
  AvailabilityResultDto,
} from "../dto/index";

export class BookingsService {
  /**
   * Generates a human-readable booking reference code (e.g., MVN-849201)
   */
  private static generateBookingCode(): string {
    const randomDigits = Math.floor(100000 + Math.random() * 900000);
    return `MVN-${randomDigits}`;
  }

  /**
   * Check if a villa is available for requested dates
   */
  public static async checkAvailability(
    input: CheckAvailabilityInput
  ): Promise<AvailabilityResultDto> {
    const checkIn = new Date(input.checkIn);
    const checkOut = new Date(input.checkOut);

    if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
      throw new Error("Invalid checkIn or checkOut dates");
    }

    if (checkIn >= checkOut) {
      return {
        available: false,
        villaId: input.villaId,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        reason: "Check-out date must be after check-in date",
        numNights: 0,
      };
    }

    const numNights = Math.round(
      (checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24)
    );

    const villa = await prisma.villa.findUnique({
      where: { id: input.villaId },
    });

    if (!villa || !villa.isActive) {
      return {
        available: false,
        villaId: input.villaId,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        reason: "Villa is not available or inactive",
        numNights,
      };
    }

    if (input.numGuests > villa.maxGuests) {
      return {
        available: false,
        villaId: input.villaId,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        reason: `Exceeds maximum occupancy of ${villa.maxGuests} guests`,
        numNights,
      };
    }

    const hasOverlap = await BookingsRepository.hasOverlappingBookings(
      input.villaId,
      checkIn,
      checkOut
    );

    if (hasOverlap) {
      return {
        available: false,
        villaId: input.villaId,
        checkIn: input.checkIn,
        checkOut: input.checkOut,
        reason: "Villa is already booked for these dates",
        numNights,
      };
    }

    return {
      available: true,
      villaId: input.villaId,
      checkIn: input.checkIn,
      checkOut: input.checkOut,
      numNights,
    };
  }

  /**
   * Create a new booking reservation
   */
  public static async createReservation(input: CreateBookingInput) {
    const availability = await this.checkAvailability(input);
    if (!availability.available) {
      throw new Error(`Reservation failed: ${availability.reason}`);
    }

    const villa = (await prisma.villa.findUnique({
      where: { id: input.villaId },
    })) as Villa;

    const pricing = calculateBookingPrice({
      basePricePerNight: Number(villa.basePricePerNight),
      numNights: availability.numNights,
      securityDeposit: Number(villa.securityDeposit),
    });

    const bookingCode = this.generateBookingCode();

    const booking = await BookingsRepository.createBooking({
      bookingCode,
      villaId: input.villaId,
      userId: input.userId,
      checkIn: new Date(input.checkIn),
      checkOut: new Date(input.checkOut),
      numGuests: input.numGuests,
      baseAmount: pricing.baseAmount,
      taxAmount: pricing.taxAmount,
      cleaningFee: pricing.cleaningFee,
      discountAmount: pricing.discountAmount,
      totalAmount: pricing.totalAmount,
    });

    return {
      booking,
      pricing,
    };
  }

  /**
   * Cancel a booking by ID or Code
   */
  public static async cancelBooking(idOrCode: string) {
    const booking = await BookingsRepository.findBookingByIdOrCode(idOrCode);
    if (!booking) {
      throw new Error("Booking not found");
    }

    return BookingsRepository.updateStatus(booking.id, "CANCELLED");
  }

  /**
   * Retrieve booking details
   */
  public static async getBooking(idOrCode: string) {
    return BookingsRepository.findBookingByIdOrCode(idOrCode);
  }
}
