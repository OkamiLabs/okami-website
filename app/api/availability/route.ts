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
  const rawSlots: Record<string, unknown> = data.data ?? data.slots ?? {};

  return NextResponse.json({
    slots: applyLeadTimeRules(rawSlots, eventTypeSlug, timeZone, new Date()),
  });
}

/**
 * Event-specific minimum lead time between "now" and the next bookable slot.
 *
 * - Okami Review (`okami-review`): no same-day availability at all. Today's slots
 *   are dropped. Also enforced in Cal.com event-type settings as a backup.
 * - Discovery Call (`discovery-call`): same-day OK, but slot must be at least
 *   2 hours from now. Today's slots before the threshold are dropped.
 * - Anything else: passes through unchanged.
 *
 * Filtering here keeps the UI simple (TimePicker just renders what it receives)
 * and guarantees the rule applies regardless of client clock skew.
 */
function applyLeadTimeRules(
  rawSlots: Record<string, unknown>,
  eventTypeSlug: string,
  timeZone: string,
  now: Date
): Record<string, unknown> {
  const todayYMD = formatYMDInTimeZone(now, timeZone);
  const DC_MIN_LEAD_MS = 2 * 60 * 60 * 1000;

  const filtered: Record<string, unknown> = {};

  for (const [dateKey, arr] of Object.entries(rawSlots)) {
    if (!Array.isArray(arr)) continue;

    // Future days always pass through.
    if (dateKey !== todayYMD) {
      filtered[dateKey] = arr;
      continue;
    }

    if (eventTypeSlug === 'okami-review') {
      // Drop today's slots entirely — no same-day reviews.
      continue;
    }

    if (eventTypeSlug === 'discovery-call') {
      const threshold = now.getTime() + DC_MIN_LEAD_MS;
      const kept = arr.filter((s) => {
        const iso =
          typeof s === 'string'
            ? s
            : (s && typeof s === 'object'
                ? ((s as { start?: string; time?: string }).start ??
                   (s as { start?: string; time?: string }).time ??
                   '')
                : '');
        if (!iso) return false;
        const t = new Date(iso).getTime();
        return Number.isFinite(t) && t >= threshold;
      });
      if (kept.length > 0) filtered[dateKey] = kept;
      continue;
    }

    // Unknown event type — pass through without filtering.
    filtered[dateKey] = arr;
  }

  return filtered;
}

/** Returns YYYY-MM-DD as seen in the given IANA timezone. */
function formatYMDInTimeZone(date: Date, timeZone: string): string {
  // en-CA yields YYYY-MM-DD; timeZone ensures the "today" pivot matches the user's view.
  try {
    return date.toLocaleDateString('en-CA', { timeZone });
  } catch {
    // Fall back to UTC if an invalid zone slips through.
    return date.toISOString().slice(0, 10);
  }
}
