/**
 * POST /api/payment-intent
 *
 * Creates a Stripe PaymentIntent for the Okami Review ($299).
 * Called when the user enters the payment step of the /book flow.
 *
 * Discovery calls are free and skip this endpoint entirely.
 */

import { NextRequest, NextResponse } from 'next/server';
import { createHash } from 'crypto';
import { stripe, isStripeConfigured } from '@/lib/stripe';
import { isRateLimited, getClientIp } from '@/lib/rate-limit';

const REVIEW_PRICE_CENTS = 29900;
const REVIEW_CAL_LINK = 'okami/okami-review';

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface IntakePayload {
  name: string;
  email: string;
  company: string;
  role?: string;
  companySize: string;
  challenge: string;
  revenueStage?: string;
  howHeard?: string;
}

interface RequestBody {
  serviceId: 'review';
  slotIso: string;
  intake: IntakePayload;
  timeZone: string;
}

function validate(body: unknown): { ok: true; data: RequestBody } | { ok: false; field?: string; message: string } {
  if (!body || typeof body !== 'object') return { ok: false, message: 'Invalid request body.' };
  const b = body as Record<string, unknown>;

  if (b.serviceId !== 'review') {
    return { ok: false, field: 'serviceId', message: 'Discovery calls skip payment.' };
  }
  if (typeof b.slotIso !== 'string' || isNaN(Date.parse(b.slotIso))) {
    return { ok: false, field: 'slotIso', message: 'Invalid slot.' };
  }
  if (typeof b.timeZone !== 'string' || !b.timeZone) {
    return { ok: false, field: 'timeZone', message: 'Missing timezone.' };
  }
  const i = b.intake as Record<string, unknown> | undefined;
  if (!i || typeof i !== 'object') {
    return { ok: false, field: 'intake', message: 'Missing intake data.' };
  }

  const required: Array<[keyof IntakePayload, number, number]> = [
    ['name', 2, 80],
    ['email', 5, 254],
    ['company', 1, 120],
    ['companySize', 1, 40],
    ['challenge', 20, 1000],
  ];
  for (const [k, min, max] of required) {
    const v = i[k];
    if (typeof v !== 'string' || v.length < min || v.length > max) {
      return { ok: false, field: k, message: `Invalid ${k}.` };
    }
  }
  if (!EMAIL_RE.test(i.email as string)) {
    return { ok: false, field: 'email', message: 'Invalid email.' };
  }
  // Optional fields — accept strings up to 120
  for (const k of ['role', 'revenueStage', 'howHeard'] as const) {
    const v = i[k];
    if (v !== undefined && v !== null) {
      if (typeof v !== 'string' || v.length > 120) {
        return { ok: false, field: k, message: `Invalid ${k}.` };
      }
    }
  }

  return {
    ok: true,
    data: {
      serviceId: 'review',
      slotIso: b.slotIso,
      timeZone: b.timeZone,
      intake: {
        name: (i.name as string).trim(),
        email: (i.email as string).trim().toLowerCase(),
        company: (i.company as string).trim(),
        role: (i.role as string | undefined)?.trim() || undefined,
        companySize: (i.companySize as string).trim(),
        challenge: (i.challenge as string).trim(),
        revenueStage: (i.revenueStage as string | undefined)?.trim() || undefined,
        howHeard: (i.howHeard as string | undefined)?.trim() || undefined,
      },
    },
  };
}

export async function POST(request: NextRequest) {
  if (!isStripeConfigured() || !stripe) {
    return NextResponse.json(
      { error: 'not_configured', message: 'Payment service is not configured.' },
      { status: 503 }
    );
  }

  const ip = getClientIp(request.headers);
  if (isRateLimited(ip, { max: 10, windowMs: 60 * 1000 })) {
    return NextResponse.json(
      { error: 'rate_limit', message: 'Too many requests. Please wait a minute.' },
      { status: 429 }
    );
  }

  const body = await request.json().catch(() => null);
  const result = validate(body);
  if (!result.ok) {
    return NextResponse.json(
      { error: 'validation', field: result.field, message: result.message },
      { status: 400 }
    );
  }
  const { slotIso, timeZone, intake } = result.data;

  try {
    // Stripe metadata values are capped at 500 chars; keep challenge under 490 to be safe.
    const challenge = intake.challenge.slice(0, 490);

    const idempotencyKey = createHash('sha256')
      .update(`${intake.email}::${slotIso}`)
      .digest('hex');

    const pi = await stripe.paymentIntents.create(
      {
        amount: REVIEW_PRICE_CENTS,
        currency: 'usd',
        payment_method_types: ['card'],
        receipt_email: intake.email,
        description: 'Okami Review Service',
        metadata: {
          serviceId: 'review',
          slotIso,
          timeZone,
          calLink: REVIEW_CAL_LINK,
          name: intake.name,
          email: intake.email,
          company: intake.company,
          role: intake.role ?? '',
          companySize: intake.companySize,
          challenge,
          revenueStage: intake.revenueStage ?? '',
          howHeard: intake.howHeard ?? '',
        },
      },
      { idempotencyKey }
    );

    return NextResponse.json({
      clientSecret: pi.client_secret,
      paymentIntentId: pi.id,
    });
  } catch (err) {
    console.error('[payment-intent] Stripe error:', err);
    return NextResponse.json(
      { error: 'stripe', message: 'Could not initialize payment. Try again.' },
      { status: 500 }
    );
  }
}
