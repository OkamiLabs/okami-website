import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Button from '@/components/Button';
import ReferenceReveal from '@/components/book/ReferenceReveal';
import BookTopBar from '@/components/book/BookTopBar';
import { stripe, toRef } from '@/lib/stripe';
import { reconcileBookingFromIntent, ReconcileError } from '@/lib/booking-flow';

export const metadata: Metadata = {
  title: 'Booking Confirmed',
  description: 'Your review is booked.',
  robots: { index: false, follow: false },
};

interface PageProps {
  searchParams: Promise<{
    ref?: string;
    pi?: string;
    payment_intent?: string;
    service?: string;
  }>;
}

interface ResolvedBooking {
  referenceNumber: string;
  rescheduleUrl: string | null;
  slot: string | null;
  email: string | null;
  service: 'review' | 'discovery';
}

/**
 * Resolve the confirmation's booking data. Three paths:
 *
 * 1. Direct from client: `?ref=OR-XXX&pi=pi_xxx` — reference is already known,
 *    we can (optionally) look up PI for slot/email details. Zero network cost
 *    if we just trust the ref and skip the PI read.
 *
 * 2. 3DS return: `?payment_intent=pi_xxx` — user completed 3DS and came back.
 *    Retrieve PI; if bookingId in metadata, return cached reference; if not,
 *    reconcile (creates Cal booking using PI metadata).
 *
 * 3. Discovery path: `?ref=DC-XXX` — free booking, no PI. Reference-only.
 */
async function resolveBooking(params: {
  ref?: string;
  pi?: string;
  payment_intent?: string;
}): Promise<ResolvedBooking | { error: 'invalid' | 'payment_failed' | 'missing_stripe' }> {
  const piId = params.pi || params.payment_intent;

  // Path 3: discovery or ref-only — trust the ref, don't require PI
  if (params.ref && !piId) {
    const service = params.ref.startsWith('DC-') ? 'discovery' : 'review';
    return {
      referenceNumber: params.ref,
      rescheduleUrl: null,
      slot: null,
      email: null,
      service,
    };
  }

  // Paths 1 & 2 require Stripe
  if (!piId) return { error: 'invalid' };
  if (!stripe) return { error: 'missing_stripe' };

  let pi;
  try {
    pi = await stripe.paymentIntents.retrieve(piId);
  } catch (err) {
    console.error('[confirmed] PI retrieve failed:', err);
    return { error: 'invalid' };
  }

  if (pi.status !== 'succeeded') {
    return { error: 'payment_failed' };
  }

  // Fast path: ref passed explicitly and PI already has bookingId → trust both
  if (params.ref && pi.metadata?.bookingId) {
    return {
      referenceNumber: params.ref,
      rescheduleUrl: pi.metadata.rescheduleUrl || null,
      slot: pi.metadata.slotIso || null,
      email: pi.metadata.email || pi.receipt_email || null,
      service: (pi.metadata.serviceId === 'discovery' ? 'discovery' : 'review'),
    };
  }

  // Reconcile — will return existing ref if bookingId is already set,
  // or create the Cal booking using PI metadata (3DS recovery path).
  try {
    const reconciled = await reconcileBookingFromIntent(pi);
    return {
      referenceNumber: reconciled.referenceNumber,
      rescheduleUrl: reconciled.rescheduleUrl,
      slot: reconciled.slot,
      email: reconciled.email,
      service: (pi.metadata?.serviceId === 'discovery' ? 'discovery' : 'review'),
    };
  } catch (err) {
    if (err instanceof ReconcileError && err.code === 'cal_failure') {
      // Fall through to a degraded "payment received, booking pending" state
      return {
        referenceNumber: toRef(pi.id, 'review'),
        rescheduleUrl: null,
        slot: pi.metadata?.slotIso || null,
        email: pi.metadata?.email || pi.receipt_email || null,
        service: 'review',
      };
    }
    console.error('[confirmed] Reconcile error:', err);
    return { error: 'invalid' };
  }
}

function formatSlotLong(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
}

export default async function ConfirmedPage({ searchParams }: PageProps) {
  const params = await searchParams;

  if (!params.ref && !params.pi && !params.payment_intent) {
    // No context at all — send to start of flow
    redirect('/book');
  }

  const result = await resolveBooking(params);

  if ('error' in result) {
    if (result.error === 'payment_failed') {
      redirect('/book/cancelled?reason=payment_failed');
    }
    redirect('/book');
  }

  const slotLabel = formatSlotLong(result.slot);
  const emailShown = result.email ?? 'your email';

  return (
    <main className="min-h-screen bg-dark">
      <BookTopBar />
      <div className="max-w-2xl mx-auto px-6 py-24 lg:py-32 text-center">
        {/* Top accent */}
        <div className="w-12 h-[2px] bg-burgundy mx-auto mb-8" />

        <span className="font-mono text-xs tracking-[0.32em] uppercase text-burgundy block mb-8">
          Booking Confirmed
        </span>

        <h1 className="font-playfair text-5xl md:text-6xl text-off-white leading-[1.05] mb-8">
          You&apos;re in.
        </h1>

        <p className="font-body text-lg md:text-xl text-ash mb-16 max-w-xl mx-auto leading-relaxed">
          {slotLabel ? (
            <>
              A calendar invite for <span className="text-off-white">{slotLabel}</span> is on
              its way to <span className="text-off-white">{emailShown}</span>. Here&apos;s what
              happens before we talk.
            </>
          ) : (
            <>
              Your booking is confirmed. A calendar invite is on its way to{' '}
              <span className="text-off-white">{emailShown}</span>. Here&apos;s what happens
              before we talk.
            </>
          )}
        </p>

        {/* Reference block */}
        <div className="mb-20">
          <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-ash block mb-3">
            Reference
          </span>
          <ReferenceReveal reference={result.referenceNumber} />
        </div>

        {/* What happens next */}
        <div className="text-left max-w-xl mx-auto">
          <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-ash block mb-6 pb-4 border-b border-ash/10">
            What to expect
          </span>

          {[
            {
              title: 'Calendar invite + prep note.',
              body: "Within 5 minutes you'll receive a calendar invite and a short prep note listing the three things we'll dig into first.",
            },
            {
              title: 'The conversation.',
              body:
                result.service === 'discovery'
                  ? 'A 15-minute conversation to talk through where things are stuck and whether the full Okami Review is the right next step.'
                  : '45 to 60 minutes, structured, focused. Come with context about where the business is stuck.',
            },
            {
              title: result.service === 'discovery' ? 'Next steps.' : 'The report.',
              body:
                result.service === 'discovery'
                  ? "After the call you'll have a clear read on fit and what a full engagement could look like."
                  : "Within 7 business days you'll receive your full review — everything mapped, prioritized, and ready to act on.",
            },
          ].map((item, i) => (
            <div
              key={i}
              className="flex items-start gap-6 py-6 border-b border-ash/10 last:border-0"
            >
              <span className="font-mono text-4xl text-burgundy/30 tabular-nums leading-none pt-1">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <h2 className="font-playfair text-xl text-off-white mb-2 leading-snug">
                  {item.title}
                </h2>
                <p className="font-body text-sm text-ash leading-relaxed">{item.body}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Reschedule block */}
        <div className="py-16 mt-8 border-t border-ash/10">
          <span className="font-mono text-xs tracking-[0.22em] uppercase text-ash block mb-4">
            Need to change your time?
          </span>
          {result.rescheduleUrl ? (
            <a
              href={result.rescheduleUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm tracking-wider uppercase text-off-white underline underline-offset-4 hover:text-burgundy transition-colors"
            >
              Reschedule →
            </a>
          ) : (
            <a
              href="mailto:hello@okamilabs.com?subject=Reschedule%20request"
              className="text-sm tracking-wider uppercase text-off-white underline underline-offset-4 hover:text-burgundy transition-colors"
            >
              Email to reschedule →
            </a>
          )}
          <p className="text-xs text-ash/50 mt-4">
            Reschedule up to 24 hours before or cancellation fees apply.
          </p>
        </div>

        {/* Close CTA */}
        <div className="pt-8">
          <Button href="/" variant="ghost" size="lg">
            Back to Okami
          </Button>
        </div>

        {result.email && (
          <p className="text-xs text-ash/40 mt-16">
            Receipt sent to {result.email}.
          </p>
        )}

        {/* Degraded-booking note (Cal booking failed post-charge, rare) */}
        {params.pi && !result.rescheduleUrl && !slotLabel && (
          <p className="text-xs text-ash/50 mt-4 max-w-sm mx-auto leading-relaxed">
            <Link href="mailto:hello@okamilabs.com" className="text-off-white underline underline-offset-4">
              hello@okamilabs.com
            </Link>{' '}
            if you don&apos;t receive your calendar invite within 5 minutes.
          </p>
        )}
      </div>
    </main>
  );
}
