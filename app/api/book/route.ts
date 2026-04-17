/**
 * POST /api/book
 *
 * Creates a Cal.com booking. For paid services (Okami Review), first verifies
 * a succeeded Stripe PaymentIntent matching the requested slot and price.
 * Idempotent: if the PaymentIntent already carries a bookingId in its metadata,
 * returns the existing reference without creating a duplicate Cal booking.
 *
 * Called from:
 *   - Client, right after stripe.confirmPayment succeeds (review path)
 *   - Client, directly from the intake submit (discovery path, paymentIntentId=null)
 *   - Server, from /book/confirmed when a user returns post-3DS and the booking
 *     was not yet created
 */

import { NextRequest, NextResponse } from 'next/server';
import { stripe, isStripeConfigured, toRef } from '@/lib/stripe';
import { createBooking, CalBookingError } from '@/lib/cal-bookings';
import { isRateLimited, getClientIp } from '@/lib/rate-limit';

const REVIEW_PRICE_CENTS = 29900;
const CAL_USERNAME = 'okami';
const EVENT_SLUGS = {
  review: 'okami-review',
  discovery: 'discovery-call',
} as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

interface IntakePayload {
  name: string;
  email: string;
  role: string;
  challenge: string;
  // Review-only:
  company?: string;
  companySize?: string;
  revenueStage?: string;
  howHeard?: string;
}

interface RequestBody {
  serviceId: 'review' | 'discovery';
  slotIso: string;
  intake: IntakePayload;
  timeZone: string;
  paymentIntentId: string | null;
}

function validate(body: unknown): { ok: true; data: RequestBody } | { ok: false; field?: string; message: string } {
  if (!body || typeof body !== 'object') return { ok: false, message: 'Invalid request body.' };
  const b = body as Record<string, unknown>;

  if (b.serviceId !== 'review' && b.serviceId !== 'discovery') {
    return { ok: false, field: 'serviceId', message: 'Unknown service.' };
  }
  if (typeof b.slotIso !== 'string' || isNaN(Date.parse(b.slotIso))) {
    return { ok: false, field: 'slotIso', message: 'Invalid slot.' };
  }
  if (typeof b.timeZone !== 'string' || !b.timeZone) {
    return { ok: false, field: 'timeZone', message: 'Missing timezone.' };
  }

  if (b.serviceId === 'review' && typeof b.paymentIntentId !== 'string') {
    return { ok: false, field: 'paymentIntentId', message: 'Missing payment intent.' };
  }
  if (b.serviceId === 'discovery' && b.paymentIntentId != null) {
    return { ok: false, field: 'paymentIntentId', message: 'Discovery calls should not carry a payment intent.' };
  }

  const i = b.intake as Record<string, unknown> | undefined;
  if (!i || typeof i !== 'object') {
    return { ok: false, field: 'intake', message: 'Missing intake data.' };
  }

  const baseRequired: Array<[keyof IntakePayload, number, number]> = [
    ['name', 2, 80],
    ['email', 5, 254],
    ['challenge', 20, 1000],
  ];
  for (const [k, min, max] of baseRequired) {
    const v = i[k];
    if (typeof v !== 'string' || v.length < min || v.length > max) {
      return { ok: false, field: k, message: `Invalid ${k}.` };
    }
  }
  if (!EMAIL_RE.test(i.email as string)) {
    return { ok: false, field: 'email', message: 'Invalid email.' };
  }

  // role is optional — validate length only when present
  if (i.role !== undefined && i.role !== null) {
    if (typeof i.role !== 'string' || i.role.length > 80) {
      return { ok: false, field: 'role', message: 'Invalid role.' };
    }
  }

  if (b.serviceId === 'review') {
    const reviewRequired: Array<[keyof IntakePayload, number, number]> = [
      ['company', 1, 120],
      ['companySize', 1, 40],
    ];
    for (const [k, min, max] of reviewRequired) {
      const v = i[k];
      if (typeof v !== 'string' || v.length < min || v.length > max) {
        return { ok: false, field: k, message: `Invalid ${k}.` };
      }
    }
  }

  return {
    ok: true,
    data: {
      serviceId: b.serviceId,
      slotIso: b.slotIso,
      timeZone: b.timeZone,
      paymentIntentId: (b.paymentIntentId as string | null) ?? null,
      intake: {
        name: (i.name as string).trim(),
        email: (i.email as string).trim().toLowerCase(),
        role: (i.role as string).trim(),
        challenge: (i.challenge as string).trim(),
        company: (i.company as string | undefined)?.trim(),
        companySize: (i.companySize as string | undefined)?.trim(),
        revenueStage: (i.revenueStage as string | undefined)?.trim() || undefined,
        howHeard: (i.howHeard as string | undefined)?.trim() || undefined,
      },
    },
  };
}

export async function POST(request: NextRequest) {
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
  const { serviceId, slotIso, timeZone, intake, paymentIntentId } = result.data;

  // For review path, verify PaymentIntent
  if (serviceId === 'review') {
    if (!isStripeConfigured() || !stripe) {
      return NextResponse.json(
        { error: 'not_configured', message: 'Payment service is not configured.' },
        { status: 503 }
      );
    }

    let pi;
    try {
      pi = await stripe.paymentIntents.retrieve(paymentIntentId!);
    } catch (err) {
      console.error('[book] PI retrieve failed:', err);
      return NextResponse.json(
        { error: 'payment_not_found', message: 'Payment could not be verified.' },
        { status: 402 }
      );
    }

    if (pi.status !== 'succeeded') {
      return NextResponse.json(
        { error: 'payment_not_succeeded', message: `Payment status: ${pi.status}.` },
        { status: 402 }
      );
    }
    if (pi.amount !== REVIEW_PRICE_CENTS) {
      return NextResponse.json(
        { error: 'payment_amount_mismatch', message: 'Payment amount does not match.' },
        { status: 402 }
      );
    }
    if (pi.metadata?.slotIso && pi.metadata.slotIso !== slotIso) {
      return NextResponse.json(
        { error: 'slot_mismatch', message: 'Payment was for a different slot.' },
        { status: 402 }
      );
    }

    // Idempotency: if a booking was already created for this PaymentIntent, return it.
    if (pi.metadata?.bookingId) {
      return NextResponse.json({
        referenceNumber: toRef(pi.metadata.bookingId || pi.id, 'review'),
        bookingId: pi.metadata.bookingId,
        rescheduleUrl: pi.metadata.rescheduleUrl || null,
        slot: slotIso,
        email: intake.email,
      });
    }
  }

  // Create Cal.com booking
  try {
    const bookingFields =
      serviceId === 'review'
        ? {
            company: intake.company,
            role: intake.role,
            companySize: intake.companySize,
            challenge: intake.challenge,
            revenueStage: intake.revenueStage,
            howHeard: intake.howHeard,
          }
        : {
            role: intake.role,
            challenge: intake.challenge,
          };

    const booking = await createBooking({
      slotIso,
      eventTypeSlug: EVENT_SLUGS[serviceId],
      username: CAL_USERNAME,
      attendee: {
        name: intake.name,
        email: intake.email,
        timeZone,
      },
      bookingFieldsResponses: bookingFields,
      metadata: {
        paymentIntentId: paymentIntentId ?? '',
        source: 'okamilabs.com/book',
      },
    });

    const refSource = String(booking.id || booking.uid || paymentIntentId || '');
    const referenceNumber = toRef(refSource, serviceId);

    // For review path, write bookingId back to PI metadata for idempotency on re-entry
    if (serviceId === 'review' && paymentIntentId && stripe) {
      try {
        await stripe.paymentIntents.update(paymentIntentId, {
          metadata: {
            bookingId: String(booking.id),
            bookingUid: booking.uid,
            rescheduleUrl: booking.rescheduleUri ?? '',
          },
        });
      } catch (err) {
        // Non-fatal: booking exists, we just couldn't stamp PI. Log and continue.
        console.warn('[book] PI metadata update failed (non-fatal):', err);
      }
    }

    return NextResponse.json({
      referenceNumber,
      bookingId: String(booking.id),
      rescheduleUrl: booking.rescheduleUri,
      slot: slotIso,
      email: intake.email,
    });
  } catch (err) {
    // CRITICAL CASE: for the review path, Stripe has captured but Cal booking failed.
    // Do NOT auto-refund (too much ambiguity). Log loudly for human recovery.
    const isCalErr = err instanceof CalBookingError;
    const status = isCalErr ? err.status : 500;

    if (serviceId === 'review' && paymentIntentId) {
      console.error(
        '[BOOKING_FAILED_POST_CHARGE]',
        JSON.stringify({
          paymentIntentId,
          slotIso,
          email: intake.email,
          calStatus: isCalErr ? err.status : null,
          calBody: isCalErr ? err.body : null,
          message: err instanceof Error ? err.message : String(err),
        })
      );

      const refForUser = toRef(paymentIntentId, 'review');
      return NextResponse.json(
        {
          error: 'booking_failed',
          paymentIntentId,
          referenceNumber: refForUser,
          message:
            "Payment confirmed, but we couldn't lock the calendar slot. We've been notified and will reach out within one business hour.",
        },
        { status: 500 }
      );
    }

    // Discovery / non-charged failure — surface the slot conflict if Cal returned one
    const slotTaken = isCalErr && status === 409;
    console.error('[book] Cal booking failed (discovery or pre-charge):', err);
    return NextResponse.json(
      {
        error: slotTaken ? 'slot_no_longer_available' : 'booking_failed',
        message: slotTaken
          ? 'That slot was just taken. Please pick another time.'
          : 'Could not complete booking. Please try again.',
      },
      { status: slotTaken ? 409 : 500 }
    );
  }
}
