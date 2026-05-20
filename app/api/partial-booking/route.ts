import { NextRequest, NextResponse } from 'next/server';
import { isRateLimited, getClientIp } from '@/lib/rate-limit';
import { sql } from '@/lib/db/client';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const VALID_SERVICES = new Set(['review', 'discovery']);
const VALID_STEPS = new Set(['booking', 'intake', 'payment']);
const STEP_ORDER: Record<string, number> = { booking: 0, intake: 1, payment: 2 };

const OK = NextResponse.json({ ok: true }, { status: 200 });

interface Payload {
  email: string;
  serviceId: string;
  slotIso: string | null;
  step: string;
  intake: Record<string, string>;
  converted: boolean;
}

function validate(body: unknown): Payload | null {
  if (!body || typeof body !== 'object') return null;
  const b = body as Record<string, unknown>;

  if (typeof b.email !== 'string' || !EMAIL_RE.test(b.email)) return null;
  if (!VALID_SERVICES.has(b.serviceId as string)) return null;
  if (!VALID_STEPS.has(b.step as string)) return null;
  if (b.slotIso !== null && (typeof b.slotIso !== 'string' || isNaN(Date.parse(b.slotIso as string)))) return null;

  // Validate intake: must be a plain object (not array), all values must be strings,
  // and key count must be reasonable to prevent unbounded JSONB storage.
  let intake: Record<string, string> = {};
  if (b.intake != null) {
    if (typeof b.intake !== 'object' || Array.isArray(b.intake)) return null;
    const raw = b.intake as Record<string, unknown>;
    if (Object.keys(raw).length > 20) return null;
    for (const v of Object.values(raw)) {
      if (typeof v !== 'string') return null;
    }
    intake = raw as Record<string, string>;
  }

  return {
    email: (b.email as string).trim().toLowerCase(),
    serviceId: b.serviceId as string,
    slotIso: (b.slotIso as string | null) ?? null,
    step: b.step as string,
    intake,
    converted: b.converted === true,
  };
}

export async function POST(request: NextRequest) {
  try {
    const ip = getClientIp(request.headers);
    if (isRateLimited(ip, { max: 20, windowMs: 60 * 1000 })) return OK;

    const body = await request.json().catch(() => null);
    const data = validate(body);
    if (!data) return OK;

    const { email, serviceId, slotIso, step, intake, converted } = data;

    try {
      await sql`
        SELECT upsert_partial_booking(
          ${email},
          ${serviceId},
          ${slotIso},
          ${step},
          ${STEP_ORDER[step] ?? 0},
          ${JSON.stringify(intake)}::jsonb,
          ${converted}
        )
      `;
    } catch (err) {
      console.error('[partial-booking] Neon error:', err);
    }

    return OK;
  } catch (err) {
    console.error('[partial-booking] Unexpected error:', err);
    return OK;
  }
}
