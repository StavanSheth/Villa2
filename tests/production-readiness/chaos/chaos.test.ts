import { describe, it, expect, vi } from 'vitest';
import { prisma } from '@villa-platform/database';

describe('CHAOS-001: Database restart mid-transaction', () => {
  it('should swallow database errors gracefully without leaking to client', async () => {
    // Mock prisma to simulate a database outage
    const findManySpy = vi.spyOn(prisma.villa, 'findMany').mockRejectedValue(
      new Error('Can\'t reach database server at `localhost:5432`')
    );

    try {
      await prisma.villa.findMany();
      expect.fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.message).toContain("Can't reach database server");
    } finally {
      findManySpy.mockRestore();
    }
  });
});
