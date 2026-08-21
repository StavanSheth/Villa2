// domains/bookings/dto/index.ts
// Booking Data Transfer Objects and Schemas
// Re-exports shared Zod schemas and defines domain response structures

import {
  CheckAvailabilityInput,
  CreateBookingInput,
  CancelBookingInput,
} from "@villa-platform/validation";

export type { CheckAvailabilityInput, CreateBookingInput, CancelBookingInput };

export interface BookingSummaryDto {
  id: string;
  bookingCode: string;
  villaId: string;
  userId: string;
  checkIn: Date;
  checkOut: Date;
  numGuests: number;
  status: "PENDING" | "CONFIRMED" | "CANCELLED" | "COMPLETED";
  totalAmount: number;
  createdAt: Date;
}

export interface AvailabilityResultDto {
  available: boolean;
  villaId: string;
  checkIn: string;
  checkOut: string;
  reason?: string;
  numNights: number;
}
