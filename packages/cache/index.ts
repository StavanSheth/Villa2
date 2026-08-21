import { Redis } from '@upstash/redis';

// SECURITY: Validate Redis credentials
const REDIS_URL = process.env.UPSTASH_REDIS_REST_URL;
const REDIS_TOKEN = process.env.UPSTASH_REDIS_REST_TOKEN;
if (process.env.NODE_ENV === 'production' && (!REDIS_URL || !REDIS_TOKEN)) {
  throw new Error('UPSTASH_REDIS_REST_URL and UPSTASH_REDIS_REST_TOKEN are required in production');
}

export const redis = new Redis({
  url: REDIS_URL || 'https://placeholder.upstash.io',
  token: REDIS_TOKEN || 'placeholder_token',
});

export const rateLimit = async (key: string, limit: number, windowMs: number): Promise<boolean> => {
  const currentCount = await redis.incr(key);
  if (currentCount === 1) {
    await redis.pexpire(key, windowMs);
  }
  return currentCount <= limit;
};

export const setCache = async (key: string, value: any, ttlSeconds: number) => {
  await redis.set(key, JSON.stringify(value), { ex: ttlSeconds });
};

export const getCache = async <T>(key: string): Promise<T | null> => {
  const data = await redis.get(key);
  return data ? (typeof data === 'string' ? JSON.parse(data) : data) : null;
};
