/**
 * GET /api/widget-health
 *
 * Liveness probe for the widget backend. Exempt from the origin allowlist
 * check added in Phase 2's proxy.ts so uptime monitors and the widget
 * bootstrap can hit it cross-origin without 403.
 */

import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  return NextResponse.json(
    { ok: true },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
