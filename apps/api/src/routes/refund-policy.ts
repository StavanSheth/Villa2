// apps/api/src/routes/refund-policy.ts
// Refund Policy & Villa Booking Settings API Routes

import { Hono } from 'hono';
import { prisma } from '@villa-platform/database';
import { RefundPolicyRepository } from '../../../../domains/bookings/repositories/refund-policy.repository.js';
import {
  CreateRefundPolicySchema,
  VillaBookingSettingsSchema,
} from '@villa-platform/validation';

const refundPolicy = new Hono();

/**
 * GET /villas/:villaId/refund-policy
 * Get the active refund policy for a villa
 */
refundPolicy.get('/:villaId/refund-policy', async (c) => {
  try {
    const villaId = c.req.param('villaId');
    const policy = await RefundPolicyRepository.getActivePolicy(villaId);

    if (!policy) {
      return c.json({ error: 'No active refund policy found' }, 404);
    }

    return c.json(policy);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * POST /villas/:villaId/refund-policy
 * Create a new refund policy (deactivates previous)
 */
refundPolicy.post('/:villaId/refund-policy', async (c) => {
  try {
    const villaId = c.req.param('villaId');
    const body = await c.req.json();
    const parsed = CreateRefundPolicySchema.safeParse({ ...body, villaId });

    if (!parsed.success) {
      return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
    }

    const policy = await RefundPolicyRepository.createPolicy(parsed.data);
    return c.json(policy, 201);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

/**
 * GET /villas/:villaId/booking-settings
 * Get villa booking settings (owner controls)
 */
refundPolicy.get('/:villaId/booking-settings', async (c) => {
  try {
    const villaId = c.req.param('villaId');
    let settings = await prisma.villaBookingSettings.findUnique({
      where: { villaId },
    });

    if (!settings) {
      // Return defaults if no settings configured
      return c.json({
        villaId,
        allowOfflineBooking: true,
        allowMaintenanceBlock: true,
        allowPrivateGuest: true,
        allowVipBooking: true,
        requireInvoice: false,
        requireCustomerProfile: false,
      });
    }

    return c.json(settings);
  } catch (error: any) {
    return c.json({ error: error.message }, 500);
  }
});

/**
 * PUT /villas/:villaId/booking-settings
 * Update villa booking settings
 */
refundPolicy.put('/:villaId/booking-settings', async (c) => {
  try {
    const villaId = c.req.param('villaId');
    const body = await c.req.json();
    const parsed = VillaBookingSettingsSchema.safeParse({ ...body, villaId });

    if (!parsed.success) {
      return c.json({ error: 'Validation failed', details: parsed.error.flatten() }, 400);
    }

    const settings = await prisma.villaBookingSettings.upsert({
      where: { villaId },
      create: parsed.data,
      update: parsed.data,
    });

    return c.json(settings);
  } catch (error: any) {
    return c.json({ error: error.message }, 400);
  }
});

export default refundPolicy;
