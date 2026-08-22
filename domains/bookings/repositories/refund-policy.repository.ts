// domains/bookings/repositories/refund-policy.repository.ts
// Refund Policy Repository — CRUD for RefundPolicy and RefundSlab
// ponytail: Thin data access layer. Business logic stays in the service.

// @ts-nocheck
import { prisma, RefundPolicy, RefundRule } from '@villa-platform/database';
import type { RefundPolicySnapshot } from '@villa-platform/types';

export class RefundPolicyRepository {
  /**
   * Get the active refund policy for a villa (with slabs).
   */
  public static async getActivePolicy(villaId: string, tx: any = prisma) {
    return tx.refundPolicy.findFirst({
      where: { villaId, isActive: true },
      include: { slabs: { orderBy: { minHoursBefore: 'asc' } } },
    });
  }

  /**
   * Create a new refund policy with slabs.
   * Deactivates any existing active policy for the same villa.
   */
  public static async createPolicy(data: {
    villaId: string;
    name: string;
    refundType: string;
    refundGatewayFee: boolean;
    refundGst: boolean;
    refundPlatformFee: boolean;
    slabs?: Array<{ minHoursBefore: number; maxHoursBefore: number; refundPercent: number }>;
  }) {
    // Deactivate existing active policies for this villa
    await prisma.refundPolicy.updateMany({
      where: { villaId: data.villaId, isActive: true },
      data: { isActive: false },
    });

    return prisma.refundPolicy.create({
      data: {
        villaId: data.villaId,
        name: data.name,
        refundType: data.refundType,
        refundGatewayFee: data.refundGatewayFee,
        refundGst: data.refundGst,
        refundPlatformFee: data.refundPlatformFee,
        isActive: true,
        slabs: data.slabs
          ? { create: data.slabs }
          : undefined,
      },
      include: { slabs: true },
    });
  }

  /**
   * Create a snapshot of the active refund policy for embedding in a booking.
   * Returns null if no active policy exists (booking proceeds without refund guarantee).
   */
  public static async snapshotForBooking(villaId: string, tx: any = prisma): Promise<RefundPolicySnapshot | null> {
    const policy = await this.getActivePolicy(villaId, tx);
    if (!policy) return null;

    return {
      policyId: policy.id,
      name: policy.name,
      refundType: policy.refundType as RefundPolicySnapshot['refundType'],
      refundGatewayFee: policy.refundGatewayFee,
      refundGst: policy.refundGst,
      refundPlatformFee: policy.refundPlatformFee,
      slabs: policy.slabs.map((s) => ({
        minHoursBefore: s.minHoursBefore,
        maxHoursBefore: s.maxHoursBefore,
        refundPercent: Number(s.refundPercent),
      })),
      snapshotAt: new Date().toISOString(),
    };
  }
}
