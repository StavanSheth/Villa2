import { describe, it, expect, beforeAll, afterAll, vi } from 'vitest';
import { prisma } from '@villa-platform/database';
import crypto from 'node:crypto';
import { DELETE, PUT } from '../apps/owner/src/app/api/promos/[id]/route';
import { ForbiddenError } from '../packages/rbac/index.ts';

// Hoist mock to top level
vi.mock('../packages/auth/permissions/index.ts', async (importOriginal) => {
  const actual = await importOriginal<typeof import('../packages/auth/permissions/index.ts')>();
  return {
    ...actual,
    requirePermission: vi.fn(),
  };
});

import { requirePermission } from '../packages/auth/permissions/index.ts';

describe('Category 2: Authorization & RBAC', () => {
  let testPromoId: string;

  beforeAll(async () => {
    const promo = await prisma.promoCode.create({
      data: {
        code: `RBAC-TEST-${crypto.randomUUID().substring(0, 8)}`,
        type: 'FIXED',
        value: 1000,
        usagePerUser: 1,
        usageCount: 0,
        status: 'ACTIVE'
      }
    });
    testPromoId = promo.id;
  });

  afterAll(async () => {
    await prisma.promoCode.deleteMany({ where: { id: testPromoId } });
    vi.restoreAllMocks();
  });

  it('Scenario 2A: Customer accessing admin endpoint -> 403 Forbidden', async () => {
    // Mock requirePermission to throw ForbiddenError for CUSTOMER
    vi.mocked(requirePermission).mockRejectedValueOnce(new ForbiddenError("User with role 'CUSTOMER' is not authorized to perform 'delete' on 'promos'"));

    const req = new Request(`http://localhost/api/promos/${testPromoId}`, {
      method: 'DELETE'
    });

    const res = await DELETE(req, { params: Promise.resolve({ id: testPromoId }) });
    const data = await res.json();
    
    expect(res.status).toBe(403);
    expect(data.error).toBe('Forbidden');

    const promo = await prisma.promoCode.findUnique({ where: { id: testPromoId } });
    expect(promo).not.toBeNull();
  });

  it('Scenario 2B: Owner/Admin accessing admin endpoint -> 200 OK', async () => {
    // Mock requirePermission to resolve successfully for ADMIN
    vi.mocked(requirePermission).mockResolvedValueOnce({
      id: 'demo_admin_id',
      email: 'admin@mavon.online',
      name: 'Administrator',
      role: 'ADMIN',
      isGuest: false
    });

    const req = new Request(`http://localhost/api/promos/${testPromoId}`, {
      method: 'DELETE'
    });

    const res = await DELETE(req, { params: Promise.resolve({ id: testPromoId }) });
    const data = await res.json();
    
    expect(data.success).toBe(true);

    const promo = await prisma.promoCode.findUnique({ where: { id: testPromoId } });
    expect(promo).toBeNull();
  });
});
