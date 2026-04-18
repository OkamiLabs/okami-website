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
 */

import { type NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const MAX_BODY_BYTES = 8192;

interface ErrorReport {
  message: string;
  stack?: string;
  widgetVersion?: string;
  url?: string;
}

function validate(raw: unknown): { ok: true; data: ErrorReport } | { ok: false } {
  if (!raw || typeof raw !== 'object') return { ok: false };
  const b = raw as Record<string, unknown>;
  if (typeof b.message !== 'string' || b.message.length === 0 || b.message.length > 1000) {
    return { ok: false };
  }
  const out: ErrorReport = { message: b.message };
  if (b.stack !== undefined) {
    if (typeof b.stack !== 'string' || b.stack.length > 3000) return { ok: false };
    out.stack = b.stack;
  }
  if (b.widgetVersion !== undefined) {
    if (typeof b.widgetVersion !== 'string' || b.widgetVersion.length > 20) return { ok: false };
    out.widgetVersion = b.widgetVersion;
  }
  if (b.url !== undefined) {
    if (typeof b.url !== 'string' || b.url.length > 500) return { ok: false };
    out.url = b.url;
  }
  return { ok: true, data: out };
}

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

  const parsed = validate(raw);
  if (!parsed.ok) {
    return NextResponse.json(
      { error: 'validation', message: 'Invalid error report.' },
      { status: 400 }
    );
  }

  console.error('[widget-error]', {
    message: parsed.data.message,
    widgetVersion: parsed.data.widgetVersion,
    url: parsed.data.url,
    stack: parsed.data.stack?.slice(0, 500),
  });

  return new NextResponse(null, { status: 204 });
}
