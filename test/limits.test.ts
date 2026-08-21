import { describe, it, expect, beforeAll } from 'vitest';
import app from '../apps/api/src/index';

describe('Category 3: Database Resilience & Limits', () => {
  it('Scenario 3A: Global Rate Limiting -> 429 Too Many Requests', async () => {
    let res: Response;
    // Simulate 101 requests (max is 100)
    for (let i = 0; i <= 100; i++) {
      const req = new Request('http://localhost/health', {
        method: 'GET',
        headers: { 'cf-connecting-ip': '192.168.1.100' }
      });
      res = await app.fetch(req);
      if (res.status === 429) break;
    }

    expect(res!.status).toBe(429);
    const data = await res!.json();
    expect(data.error).toBe('Too Many Requests');
  });

  it('Scenario 3B: Payload Size Limits -> 413 Payload Too Large', async () => {
    // Generate a payload larger than 512 KB
    const largePayload = {
      idToken: 'a'.repeat(600 * 1024) // ~600 KB string
    };

    const req = new Request('http://localhost/auth/login', {
      method: 'POST',
      body: JSON.stringify(largePayload),
      headers: {
        'Content-Type': 'application/json',
        'cf-connecting-ip': '192.168.1.101' // Use different IP to avoid rate limit
      }
    });

    const res = await app.fetch(req);
    const data = await res.json();

    expect(res.status).toBe(413);
    expect(data.error).toBe('Payload Too Large');
  });
});
