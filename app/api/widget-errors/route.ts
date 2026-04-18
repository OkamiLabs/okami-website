/**
 * POST /api/widget-errors
 *
 * Sink for client-side widget error reports. Ported from
 * okami-widget/server/routes/errors.ts, renamed to avoid colliding with
 * any future site-level error endpoint.
 *
 * Phase I: logs via `console.error` only (Sentry forwarding lands in
 * Phase 9). 8KB body gate (relaxed from the source's 4KB, per plan).
 * Phase 6: Zod validation on body.
 * Phase 7: resolves visitor via HMAC-verified cookie (read-only) for logging.
 * Phase 8: Neon-backed per-visitor/IP rate limit (30 / 10 min).
 */

import { type NextRequest, NextResponse } from 'next/server';
import { ipAddress } from '@vercel/functions';
import { z } from 'zod';
import { getVerifiedVisitorId } from '@/lib/visitor';
import { checkChatRateLimit } from '@/lib/rate-limit-chat';

export const runtime = 'nodejs';

const MAX_BODY_BYTES = 8192;

const errorBodySchema = z.object({
  message: z.string().max(1000),
  stack: z.string().max(3000).optional(),
  widgetVersion: z.string().max(20).optional(),
  url: z.string().url().max(500).optional(),
});

export async function POST(request: NextRequest) {
  const contentLength = request.headers.get('content-length');
  if (contentLength && parseInt(contentLength, 10) > MAX_BODY_BYTES) {
    return NextResponse.json(
      { error: 'payload_too_large', message: 'Error report exceeds 8KB.' },
      { status: 413 }
    );
  }

  let raw: unknown;
  try {
    raw = await request.json();
  } catch {
    return NextResponse.json(
      { error: 'bad_json', message: 'Request body must be valid JSON.' },
      { status: 400 }
    );
  }

  const parsed = errorBodySchema.safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json(
      {
        error: 'validation',
        message: parsed.error.issues[0]?.message ?? 'Invalid error report.',
      },
      { status: 400 }
    );
  }

  // Phase 7/8: resolve visitor (read-only) + IP, then rate-limit before logging.
  const visitorId = await getVerifiedVisitorId();
  const ip = ipAddress(request) ?? 'unknown';
  const rateLimitKey = visitorId ?? ip;

  const limit = await checkChatRateLimit('ip', rateLimitKey, { max: 30, windowSec: 600 });
  if (!limit.allowed) {
    return new NextResponse(null, {
      status: 429,
      headers: { 'Retry-After': String(limit.retryAfter ?? 60) },
    });
  }

  console.error('[widget-error]', { visitorId, ip, ...parsed.data });

  return new NextResponse(null, { status: 204 });
}
