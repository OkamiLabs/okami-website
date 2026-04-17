/**
 * Shared booking-reconciliation logic used by:
 *   - POST /api/book     (primary create path)
 *   - /book/confirmed    (3DS-return recovery path, when user was bounced to
 *                         their bank and came back before /api/book was called)
 *
 * Given a succeeded Stripe PaymentIntent, either returns the already-created
 * Cal.com booking reference or creates the Cal booking now using PI metadata
 * as the source of truth (client input cannot be trusted on the server).
 */

import type Stripe from 'stripe';
import { stripe, toRef } from './stripe';
import { createBooking, CalBookingError } from './cal-bookings';

export interface ReconciledBooking {
  referenceNumber: string;
  bookingId: string;
  rescheduleUrl: string | null;
  slot: string;
  email: string;
}

export class ReconcileError extends Error {
  code:
    | 'not_configured'
    | 'payment_not_succeeded'
    | 'metadata_missing'
    | 'cal_failure';
  detail?: unknown;

  constructor(code: ReconcileError['code'], message: string, detail?: unknown) {
    super(message);
    this.name = 'ReconcileError';
    this.code = code;
    this.detail = detail;
  }
}

const CAL_USERNAME = 'okami';

function eventSlugFor(service: string): string {
  return service === 'discovery' ? 'discovery-call' : 'okami-review';
}

/**
 * If the PI already carries a bookingId in metadata, synthesize the reconciled
 * result from metadata without hitting Cal.com again.
 */
function fromExistingBooking(pi: Stripe.PaymentIntent): ReconciledBooking {
  const m = pi.metadata ?? {};
  const serviceId = (m.serviceId === 'discovery' ? 'discovery' : 'review') as
    | 'review'
    | 'discovery';
  return {
    referenceNumber: toRef(m.bookingId || pi.id, serviceId),
    bookingId: m.bookingId || '',
    rescheduleUrl: m.rescheduleUrl || null,
    slot: m.slotIso || '',
    email: m.email || pi.receipt_email || '',
  };
}

/**
 * Main entry: given a PI (already retrieved by caller), ensure a Cal booking
 * exists and return its reference. Idempotent.
 */
export async function reconcileBookingFromIntent(
  pi: Stripe.PaymentIntent
): Promise<ReconciledBooking> {
  if (!stripe) {
    throw new ReconcileError('not_configured', 'Stripe is not configured.');
  }
  if (pi.status !== 'succeeded') {
    throw new ReconcileError('payment_not_succeeded', `Payment status: ${pi.status}`);
  }

  // Already booked? Return the cached result.
  if (pi.metadata?.bookingId) {
    return fromExistingBooking(pi);
  }

  const m = pi.metadata ?? {};
  const { slotIso, timeZone, name, email, company, role, companySize, challenge, revenueStage, howHeard, serviceId } = m;

  if (!slotIso || !name || !email || !role || !challenge) {
    throw new ReconcileError(
      'metadata_missing',
      'PaymentIntent metadata is missing required booking fields.',
      { haveKeys: Object.keys(m) }
    );
  }

  const service = (serviceId === 'discovery' ? 'discovery' : 'review') as
    | 'review'
    | 'discovery';

  const bookingFields: Record<string, string | undefined> =
    service === 'review'
      ? { company, role, companySize, challenge, revenueStage, howHeard }
      : { role, challenge };

  try {
    const booking = await createBooking({
      slotIso,
      eventTypeSlug: eventSlugFor(service),
      username: CAL_USERNAME,
      attendee: {
        name,
        email,
        timeZone: timeZone || 'UTC',
      },
      bookingFieldsResponses: bookingFields,
      metadata: {
        paymentIntentId: pi.id,
        source: 'okamilabs.com/book (3ds-recovery)',
      },
    });

    // Update PI metadata with bookingId for future idempotency
    try {
      await stripe.paymentIntents.update(pi.id, {
        metadata: {
          bookingId: String(booking.id),
          bookingUid: booking.uid,
          rescheduleUrl: booking.rescheduleUri ?? '',
        },
      });
    } catch (err) {
      console.warn('[booking-flow] PI metadata update failed (non-fatal):', err);
    }

    return {
      referenceNumber: toRef(String(booking.id), service),
      bookingId: String(booking.id),
      rescheduleUrl: booking.rescheduleUri,
      slot: slotIso,
      email,
    };
  } catch (err) {
    console.error(
      '[BOOKING_FAILED_POST_CHARGE]',
      JSON.stringify({
        paymentIntentId: pi.id,
        path: 'reconcile',
        calStatus: err instanceof CalBookingError ? err.status : null,
        calBody: err instanceof CalBookingError ? err.body : null,
        message: err instanceof Error ? err.message : String(err),
      })
    );
    throw new ReconcileError(
      'cal_failure',
      'Could not create booking after payment.',
      err
    );
  }
}
