import { Redis } from '@upstash/redis';

// ponytail: build-safe init. Fails at runtime against placeholders if prod env is missing.
export const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL || 'https://placeholder.upstash.io',
  token: process.env.UPSTASH_REDIS_REST_TOKEN || 'placeholder_token',
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
  return data ? (typeof data === 'string' ? JSON.parse(data) : data) as T : null;
};
