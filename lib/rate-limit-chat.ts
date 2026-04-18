/**
 * Neon-backed fixed-window rate limiter for the widget chat pipeline.
 * Atomic via INSERT ... ON CONFLICT. Keys are hashed window starts so every
 * (scope, id) pair gets its own row per window.
 *
 * Separate from lib/rate-limit.ts (in-memory, used by /book) — widget
 * traffic hits multiple Vercel regions/instances so in-memory isn't safe.
 */

import { sql } from '@/lib/db/client';

export type RateLimitScope = 'visitor' | 'ip';

export interface RateLimitOutcome {
  allowed: boolean;
  retryAfter?: number;
}

export async function checkChatRateLimit(
  scope: RateLimitScope,
  id: string,
  opts: { max: number; windowSec: number }
): Promise<RateLimitOutcome> {
  const windowMs = opts.windowSec * 1000;
  const now = Date.now();
  const windowStartEpoch = Math.floor(now / windowMs) * windowMs;
  const bucketKey = `${scope}:${id}:${windowStartEpoch}`;
  const expiresAt = new Date(windowStartEpoch + windowMs * 2);

  const rows = (await sql`
    INSERT INTO rate_limit_buckets (bucket_key, count, expires_at)
    VALUES (${bucketKey}, 1, ${expiresAt})
    ON CONFLICT (bucket_key) DO UPDATE
      SET count = rate_limit_buckets.count + 1
    RETURNING count
  `) as Array<{ count: number }>;

  const count = rows[0]?.count ?? 0;
  if (count > opts.max) {
    return {
      allowed: false,
      retryAfter: Math.max(1, Math.ceil((windowStartEpoch + windowMs - now) / 1000)),
    };
  }
  return { allowed: true };
}

/** Opportunistic cleanup — fire-and-forget from route handlers ~1/10 calls. */
export async function opportunisticCleanup(): Promise<void> {
  if (Math.random() > 0.1) return;
  try {
    await sql`DELETE FROM rate_limit_buckets WHERE expires_at < NOW()`;
    await sql`DELETE FROM token_reservations WHERE reserved_at < NOW() - INTERVAL '5 minutes' AND NOT reconciled`;
  } catch {
    // Never block a request on cleanup failure.
  }
}
