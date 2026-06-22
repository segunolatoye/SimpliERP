import { redisClient } from '../redis';
import { RateLimitError } from '@/lib/errors/appError';

export interface RateLimitOptions {
  limit: number;      // Maximum number of requests
  windowSecs: number; // Time window in seconds
}

export const RATE_LIMITS = {
  ONBOARDING: { limit: 5, windowSecs: 3600 }, // 5 attempts per hour
  API_DEFAULT: { limit: 100, windowSecs: 60 }, // 100 requests per minute
  AUTH: { limit: 10, windowSecs: 300 },       // 10 attempts per 5 minutes
};

/**
 * Validates the rate limit for a given key. Throws a RateLimitError if the limit is exceeded.
 * @param key - The unique identifier for the action/user (e.g., 'onboarding:user-123')
 * @param options - Limit and window configuration
 */
export async function checkRateLimit(key: string, options: RateLimitOptions): Promise<void> {
  if (!redisClient.isOpen) {
    // If Redis is not connected for some reason, we might want to log a warning and let it pass,
    // or fail closed depending on security posture. Here we fail open with a warning to avoid breaking the app.
    console.warn(`Redis is not connected. Rate limiting bypassed for key: ${key}`);
    return;
  }

  const currentCountStr = await redisClient.get(key);
  const currentCount = currentCountStr ? parseInt(currentCountStr, 10) : 0;

  if (currentCount >= options.limit) {
    throw new RateLimitError(`Too many requests for action. Limit: ${options.limit} per ${options.windowSecs}s.`);
  }

  if (currentCount === 0) {
    // First request in the window, set the count and expiry
    await redisClient.setEx(key, options.windowSecs, '1');
  } else {
    // Increment the count. (We don't reset TTL here to strictly enforce the sliding window)
    await redisClient.incr(key);
  }
}
