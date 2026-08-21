import { describe, it, expect } from 'vitest';

describe('PAY-001: Duplicate webhook delivery', () => {
  it('should ignore duplicate webhooks and only process the payment once', async () => {
    // Simulated webhook processor that relies on an idempotency key (e.g. paymentId + status)
    const processedEvents = new Set<string>();
    
    const processWebhook = async (paymentId: string) => {
      const idempotencyKey = `${paymentId}-captured`;
      
      if (processedEvents.has(idempotencyKey)) {
        return { status: 'IGNORED_DUPLICATE' };
      }
      
      processedEvents.add(idempotencyKey);
      return { status: 'PROCESSED' };
    };
    
    // Simulate Razorpay sending the same webhook twice due to network retries
    const attempt1 = await processWebhook('pay_X123');
    const attempt2 = await processWebhook('pay_X123');
    
    expect(attempt1.status).toBe('PROCESSED');
    expect(attempt2.status).toBe('IGNORED_DUPLICATE');
  });
});
