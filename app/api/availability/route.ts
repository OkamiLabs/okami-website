/**
 * GET /api/availability
 *
 * Fetches available booking slots from Cal.com v2 API for a given event type.
 *
 * Required env var:
 *   CAL_API_KEY — from cal.com/settings/developer/api-keys
 *
 * Query params:
 *   calLink   e.g. "okami/okami-review" (username/event-slug)
 *   start     ISO date or datetime (e.g. "2026-04-06")
 *   end       ISO date or datetime (e.g. "2026-04-10")
 *   timeZone  IANA timezone string (e.g. "America/New_York"), defaults to UTC
 *
 * Returns:
 *   { slots: { "YYYY-MM-DD": [{ time: "ISO" }, ...] } }
 */

import { NextRequest, NextResponse } from 'next/server';

const CAL_API_KEY = process.env.CAL_API_KEY || '';
const CAL_V2_BASE = 'https://api.cal.com/v2';
const CAL_API_VERSION = '2024-09-04';

export async function GET(req: NextRequest) {
  if (!CAL_API_KEY) {
    return NextResponse.json(
      { error: 'Availability API not configured. Add CAL_API_KEY to your environment.' },
      { status: 503 }
    );
  }

  const { searchParams } = new URL(req.url);
  const calLink = searchParams.get('calLink');
  const start = searchParams.get('start');
  const end = searchParams.get('end');
  const timeZone = searchParams.get('timeZone') || 'UTC';

  if (!calLink || !start || !end) {
    return NextResponse.json(
      { error: 'Missing required params: calLink, start, end' },
      { status: 400 }
    );
  }

  // Parse "username/event-slug" format
  const parts = calLink.split('/');
  if (parts.length < 2) {
    return NextResponse.json(
      { error: 'calLink must be in "username/event-slug" format' },
      { status: 400 }
    );
  }

  const username = parts[0];
  const eventTypeSlug = parts[parts.length - 1];

  // Cal.com v2: query slots directly by slug + username — no ID lookup needed
  const params = new URLSearchParams({
    eventTypeSlug,
    username,
    start,
    end,
    timeZone,
  });

  const slotsRes = await fetch(`${CAL_V2_BASE}/slots?${params}`, {
    headers: {
      Authorization: `Bearer ${CAL_API_KEY}`,
      'cal-api-version': CAL_API_VERSION,
    },
    next: { revalidate: 60 }, // cache 1 minute — slots change frequently
  });

  if (!slotsRes.ok) {
    const errText = await slotsRes.text().catch(() => '');
    console.error('Cal.com v2 slots error:', slotsRes.status, errText);
    return NextResponse.json(
      { error: 'Failed to fetch slots from Cal.com' },
      { status: 502 }
    );
  }

  const data = await slotsRes.json();
  // v2 returns { status: "success", data: { "YYYY-MM-DD": [...] } }
  return NextResponse.json({ slots: data.data ?? data.slots ?? {} });
}
