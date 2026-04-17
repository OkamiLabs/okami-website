/**
 * In-memory IP-based rate limiter. Per serverless instance, so this is an
 * approximation (Vercel may spin up multiple instances). Good enough for
 * API-surface abuse control; not an auth boundary.
 */

interface RateLimitOptions {
  windowMs?: number;
  max?: number;
}

const DEFAULT_WINDOW_MS = 60 * 1000;
const DEFAULT_MAX = 5;

const buckets = new Map<string, { count: number; resetAt: number }>();
let lastPurge = Date.now();
const PURGE_INTERVAL_MS = 5 * 60 * 1000;

function purgeExpired() {
  const now = Date.now();
  if (now - lastPurge < PURGE_INTERVAL_MS) return;
  lastPurge = now;
  for (const [key, entry] of buckets) {
    if (now > entry.resetAt) buckets.delete(key);
  }
}

export function isRateLimited(
  ip: string,
  { windowMs = DEFAULT_WINDOW_MS, max = DEFAULT_MAX }: RateLimitOptions = {}
): boolean {
  purgeExpired();
  const now = Date.now();
  const key = `${ip}:${windowMs}:${max}`;
  const entry = buckets.get(key);

  if (!entry || now > entry.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return false;
  }

  entry.count++;
  return entry.count > max;
}

/** Extract the best-effort client IP from a Next.js request. */
export function getClientIp(headers: Headers): string {
  return (
    headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    headers.get('x-real-ip') ||
    'unknown'
  );
}
