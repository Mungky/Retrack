"use client";

interface RateLimitEntry {
  attempts: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitEntry>();

/**
 * Check if a key is rate limited
 * @param key - Unique identifier for rate limiting (e.g., "login:email@example.com")
 * @param maxAttempts - Maximum number of attempts allowed
 * @param windowMs - Time window in milliseconds
 * @returns true if rate limited, false otherwise
 */
export function isRateLimited(
  key: string,
  maxAttempts: number,
  windowMs: number
): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(key);

  if (!entry) {
    rateLimitMap.set(key, {
      attempts: 1,
      resetTime: now + windowMs,
    });
    return false;
  }

  // Reset if window has passed
  if (now > entry.resetTime) {
    rateLimitMap.set(key, {
      attempts: 1,
      resetTime: now + windowMs,
    });
    return false;
  }

  // Increment attempts
  entry.attempts += 1;
  rateLimitMap.set(key, entry);

  return entry.attempts > maxAttempts;
}

/**
 * Get remaining time until rate limit resets
 * @param key - Rate limit key
 * @returns Remaining time in milliseconds, or 0 if not rate limited
 */
export function getRemainingTime(key: string): number {
  const entry = rateLimitMap.get(key);
  if (!entry) return 0;

  const now = Date.now();
  const remaining = entry.resetTime - now;
  return remaining > 0 ? remaining : 0;
}
