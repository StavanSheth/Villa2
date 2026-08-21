import { Context, Next } from 'hono';

// Simple isolate-level rate limiter
// Ponytail: Avoid Redis/KV for basic flood protection. A Map in the Worker isolate
// resets on cold start but stops sustained burst attacks without external dependencies.
const requestCounts = new Map<string, { count: number, resetAt: number }>();

export const rateLimiter = (options: { windowMs: number, max: number }) => {
  return async (c: Context, next: Next) => {
    // 1. Get IP or fallback to a default string if not found
    const ip = c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || '127.0.0.1';
    const now = Date.now();

    const record = requestCounts.get(ip);
    
    // 2. Clean up expired records occasionally or when accessed
    if (!record || now > record.resetAt) {
      requestCounts.set(ip, { count: 1, resetAt: now + options.windowMs });
      return next();
    }

    // 3. Increment and check
    record.count++;
    
    if (record.count > options.max) {
      c.header('Retry-After', Math.ceil((record.resetAt - now) / 1000).toString());
      return c.json({ success: false, error: 'Too Many Requests' }, 429);
    }

    // Pass through
    await next();
  };
};
