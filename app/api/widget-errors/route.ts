/**
 * POST /api/widget-errors
 *
 * Sink for client-side widget error reports. Ported from
 * okami-widget/server/routes/errors.ts, renamed to avoid colliding with
 * any future site-level error endpoint.
 *
 * Phase I: logs via `console.error` only (Sentry forwarding lands in
 * Phase 9). 8KB body gate (relaxed from the source's 4KB, per plan).
 * Rate limiting lands in Phase 8 — no per-IP limiter here yet.
 * Phase 6: Zod validation on body.
 */

import { type NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';

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

  console.error('[widget-error]', parsed.data);

  return new NextResponse(null, { status: 204 });
}
