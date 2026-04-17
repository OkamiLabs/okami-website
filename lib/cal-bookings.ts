/**
 * Cal.com v2 booking creation.
 *
 * Creates a confirmed booking via the Cal.com v2 API after we've already taken
 * payment via Stripe (for paid services). Cal.com's own Stripe integration
 * on the event type should be disconnected so the booking is accepted as
 * pre-paid from our side.
 *
 * Docs: https://cal.com/docs/api-reference/v2/bookings/create-a-booking
 */

const CAL_V2_BASE = 'https://api.cal.com/v2';
const CAL_API_VERSION = '2024-08-13';

export interface CreateBookingArgs {
  slotIso: string;
  eventTypeSlug: string; // e.g. 'okami-review' | 'discovery-call'
  username: string; // e.g. 'okami'
  attendee: {
    name: string;
    email: string;
    timeZone: string;
    language?: string;
  };
  bookingFieldsResponses?: Record<string, string | undefined>;
  metadata?: Record<string, string>;
}

export interface CalBookingResult {
  id: string | number;
  uid: string;
  rescheduleUri: string | null;
  status: string;
  raw: unknown; // full response for downstream use
}

export class CalBookingError extends Error {
  status: number;
  body: unknown;

  constructor(message: string, status: number, body: unknown) {
    super(message);
    this.name = 'CalBookingError';
    this.status = status;
    this.body = body;
  }
}

/**
 * Create a booking in Cal.com via v2 API.
 * Throws CalBookingError on non-2xx responses; caller should decide how to handle
 * (e.g. return HTTP 500 with recovery metadata if Stripe already captured).
 */
export async function createBooking(args: CreateBookingArgs): Promise<CalBookingResult> {
  const apiKey = process.env.CAL_API_KEY;
  if (!apiKey) {
    throw new CalBookingError('CAL_API_KEY not configured', 503, null);
  }

  // Strip undefined values from bookingFieldsResponses so we don't send "key: undefined"
  const cleanedResponses: Record<string, string> = {};
  if (args.bookingFieldsResponses) {
    for (const [k, v] of Object.entries(args.bookingFieldsResponses)) {
      if (v !== undefined && v !== '') cleanedResponses[k] = v;
    }
  }

  const body = {
    start: args.slotIso,
    eventTypeSlug: args.eventTypeSlug,
    username: args.username,
    attendee: {
      name: args.attendee.name,
      email: args.attendee.email,
      timeZone: args.attendee.timeZone,
      language: args.attendee.language ?? 'en',
    },
    bookingFieldsResponses: cleanedResponses,
    metadata: args.metadata ?? {},
  };

  const res = await fetch(`${CAL_V2_BASE}/bookings`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'cal-api-version': CAL_API_VERSION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const responseBody = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new CalBookingError(
      `Cal.com booking failed: ${res.status}`,
      res.status,
      responseBody
    );
  }

  // v2 success shape: { status: 'success', data: { id, uid, rescheduleUri?, status, ... } }
  const data = responseBody?.data ?? responseBody;

  return {
    id: data.id ?? data.uid ?? '',
    uid: data.uid ?? String(data.id ?? ''),
    rescheduleUri: data.rescheduleUri ?? data.reschedule_uri ?? null,
    status: data.status ?? 'unknown',
    raw: responseBody,
  };
}
