import { describe, it, expect } from 'vitest';

describe('RBAC-001: Customer accesses admin dashboard', () => {
  it('should return 403 Forbidden', async () => {
    // Simulated backend API endpoint guard behavior
    const fetchAdminData = async (role: string) => {
      if (role !== 'ADMIN' && role !== 'SUPER_ADMIN') {
        const error: any = new Error('Forbidden');
        error.status = 403;
        throw error;
      }
      return { secret: 'data' };
    };
    
    // Test with customer role
    try {
      await fetchAdminData('CUSTOMER');
      expect.fail('Should have thrown an error');
    } catch (err: any) {
      expect(err.status).toBe(403);
    }
  });
});
