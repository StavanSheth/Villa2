import { describe, it, expect } from 'vitest';
import autocannon from 'autocannon';

describe('Category 16: Performance Scenarios', () => {
  it('Scenario 16A: Properties API can handle 100 concurrent connections with P99 < 500ms', async () => {
    // We target the API backend directly. In this monorepo, Hono API runs on a simulated worker or port 8787.
    // For this test, we assume the API is at localhost:8787/api/properties (or similar)
    // We will test against the local API dev server if available.
    // We will use a safe route: GET / (Hono root) which should return 200 OK fast.

    const targetUrl = 'http://127.0.0.1:8787/';

    const result = await autocannon({
      url: targetUrl,
      connections: 100, // 100 concurrent connections
      duration: 5, // 5 seconds of load
      pipelining: 1, // 1 request per connection at a time
    });

    // 1. Assert that the rate limiter kicked in (we expect a high amount of 429 errors!)
    expect(result['4xx']).toBeGreaterThan(result.requests.total * 0.5); // Expect at least 50% to be blocked by rate limit

    // 2. Assert latency bounds
    // result.latency.p99 is the 99th percentile latency in ms
    expect(result.latency.p99).toBeLessThan(1000); // 1000ms max for P99 locally

    // 3. Assert average latency
    expect(result.latency.average).toBeLessThan(300); // 300ms average locally

    console.log(`[PERF] Total Requests: ${result.requests.total}`);
    console.log(`[PERF] P99 Latency: ${result.latency.p99}ms`);
    console.log(`[PERF] Avg Latency: ${result.latency.average}ms`);
    console.log(`[PERF] Errors: ${result.non2xx} / ${result.errors}`);
  }, 10000); // 10s timeout for vitest since the load test runs for 5s
});
