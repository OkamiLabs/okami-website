'use client';

import { useState, useMemo, useCallback } from 'react';
import { loadStripe, type Stripe, type Appearance } from '@stripe/stripe-js';
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { useRouter } from 'next/navigation';
import Button from '../Button';
import type { IntakeValues, ServiceId } from './IntakeStep';
import { trackPartialBooking } from '@/lib/track-partial-booking';

/* ── Okami-native Stripe Elements appearance ──────────────────────────
   The detail that makes Stripe fields indistinguishable from Okami-native
   inputs: JetBrains Mono on card digits, burgundy focus border, 10px
   uppercase labels, square corners. */
const okamiAppearance: Appearance = {
  theme: 'night',
  variables: {
    colorPrimary: '#8B3A3A',
    colorBackground: '#0a0a0a',
    colorText: '#e8e6e1',
    colorDanger: '#8B3A3A',
    colorTextSecondary: '#9A918A',
    colorTextPlaceholder: '#9A918A66',
    fontFamily: 'var(--font-outfit-face), sans-serif',
    fontSizeBase: '16px',
    spacingUnit: '4px',
    borderRadius: '0px',
  },
  rules: {
    '.Input': {
      backgroundColor: '#0a0a0a',
      border: '1px solid rgba(154, 145, 138, 0.25)',
      padding: '16px 20px',
      fontFamily: 'var(--font-jetbrains-face), monospace',
      fontSize: '14px',
      color: '#e8e6e1',
      transition: 'border-color 200ms ease',
      boxShadow: 'none',
    },
    '.Input:focus': {
      border: '1px solid #8B3A3A',
      boxShadow: 'none',
      outline: 'none',
    },
    '.Input--invalid': {
      border: '1px solid #8B3A3A',
      boxShadow: 'none',
    },
    '.Label': {
      fontFamily: 'var(--font-outfit-face), sans-serif',
      fontSize: '11px',
      textTransform: 'uppercase',
      letterSpacing: '0.18em',
      color: '#9A918A',
      marginBottom: '8px',
      fontWeight: '400',
    },
    '.Error': {
      fontFamily: 'var(--font-jetbrains-face), monospace',
      fontSize: '11px',
      color: '#e8e6e1',
      marginTop: '8px',
    },
    '.Tab': {
      backgroundColor: '#0a0a0a',
      border: '1px solid rgba(154, 145, 138, 0.25)',
      borderRadius: '0px',
      padding: '12px',
      boxShadow: 'none',
    },
    '.Tab--selected': {
      border: '1px solid #8B3A3A',
      backgroundColor: 'rgba(139, 58, 58, 0.06)',
      boxShadow: 'none',
    },
    '.TabIcon': { fill: '#9A918A' },
    '.TabIcon--selected': { fill: '#8B3A3A' },
    '.TabLabel': {
      fontFamily: 'var(--font-outfit-face), sans-serif',
      fontSize: '11px',
      textTransform: 'uppercase',
      letterSpacing: '0.14em',
    },
  },
};

export interface PaymentBookingPayload {
  serviceId: ServiceId;
  slotIso: string;
  timeZone: string;
  intake: IntakeValues;
}

interface PaymentStepProps {
  publishableKey: string;
  clientSecret: string;
  paymentIntentId: string;
  priceLabel: string; // "$299"
  bookingPayload: PaymentBookingPayload;
  onBack: () => void;
}

export default function PaymentStep(props: PaymentStepProps) {
  // loadStripe caches internally by key, but useMemo keeps the promise stable
  const stripePromise = useMemo(
    () => loadStripe(props.publishableKey),
    [props.publishableKey]
  );

  return (
    <div className="w-full">
      <h1 className="font-playfair text-4xl md:text-5xl text-off-white mb-4 leading-[1.1]">
        Confirm your payment.
      </h1>
      <p className="font-body text-base text-ash mb-12 max-w-xl leading-relaxed">
        You'll receive a calendar invite and a link to reschedule within 5 minutes of payment.
      </p>

      <Elements
        stripe={stripePromise}
        options={{
          clientSecret: props.clientSecret,
          appearance: okamiAppearance,
        }}
      >
        <PaymentForm {...props} />
      </Elements>
    </div>
  );
}

/* ── Inner form (needs to live inside <Elements>) ─────────────────── */

interface BookResponseOk {
  referenceNumber: string;
  bookingId: string;
  rescheduleUrl: string | null;
  slot: string;
  email: string;
}

interface BookResponseFailed {
  error: 'booking_failed';
  paymentIntentId: string;
  referenceNumber: string;
  message: string;
}

function PaymentForm({
  clientSecret,
  paymentIntentId,
  priceLabel,
  bookingPayload,
  onBack,
}: Omit<PaymentStepProps, 'publishableKey'>) {
  const stripe = useStripe();
  const elements = useElements();
  const router = useRouter();

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<{ message: string; code?: string } | null>(null);
  const [postChargeError, setPostChargeError] = useState<BookResponseFailed | null>(null);

  const callBookApi = useCallback(
    async (pi: string): Promise<BookResponseOk | { error: true; body: BookResponseFailed | null }> => {
      const res = await fetch('/api/book', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...bookingPayload,
          paymentIntentId: pi,
        }),
      });

      const body = await res.json().catch(() => null);
      if (res.ok) return body as BookResponseOk;

      // 500 with booking_failed shape — needs the post-charge recovery UI
      if (res.status === 500 && body?.error === 'booking_failed') {
        return { error: true, body: body as BookResponseFailed };
      }
      return { error: true, body };
    },
    [bookingPayload]
  );

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    setError(null);

    // Build the 3DS return URL — only used when a redirect is needed.
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const returnUrl = `${origin}/book/confirmed?payment_intent=${paymentIntentId}`;

    const { error: stripeError, paymentIntent } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: returnUrl },
      redirect: 'if_required',
    });

    if (stripeError) {
      setSubmitting(false);
      setError({
        message: stripeError.message ?? 'Payment could not be completed.',
        code: stripeError.code,
      });
      return;
    }

    if (paymentIntent?.status !== 'succeeded') {
      setSubmitting(false);
      setError({
        message:
          paymentIntent?.status === 'requires_action'
            ? "Additional verification is required. Please follow your bank's prompt."
            : 'Payment did not complete. Please try again.',
      });
      return;
    }

    // Payment succeeded — create the Cal booking
    const result = await callBookApi(paymentIntent.id);

    if ('error' in result) {
      setSubmitting(false);
      if (result.body && 'error' in result.body && result.body.error === 'booking_failed') {
        // Post-charge recovery UI
        setPostChargeError(result.body);
      } else {
        setError({
          message:
            (result.body as { message?: string } | null)?.message ??
            'Could not complete booking. Contact hello@okamilabs.com and reference your receipt.',
        });
      }
      return;
    }

    // Success — mark conversion, clear session, push to confirmation
    trackPartialBooking({
      email: bookingPayload.intake.email.trim(),
      serviceId: bookingPayload.serviceId,
      slotIso: bookingPayload.slotIso,
      step: 'payment',
      intake: {},
      converted: true,
    });
    try {
      window.sessionStorage.removeItem('okami:book:state');
    } catch {
      /* noop */
    }
    const params = new URLSearchParams({
      ref: result.referenceNumber,
      pi: paymentIntent.id,
    });
    router.push(`/book/confirmed?${params.toString()}`);
  }

  // Post-charge recovery: payment went through, booking didn't.
  if (postChargeError) {
    return (
      <div className="border border-burgundy/30 bg-burgundy/[0.04] p-8">
        <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-burgundy block mb-4">
          Payment Received · Booking Pending
        </span>
        <h2 className="font-playfair text-2xl text-off-white mb-4 leading-tight">
          We've got your payment, but the slot didn't lock.
        </h2>
        <p className="font-body text-sm text-ash mb-6 leading-relaxed max-w-xl">
          {postChargeError.message} Your reference number is{' '}
          <span className="font-mono text-off-white tabular-nums">
            {postChargeError.referenceNumber}
          </span>
          . Email{' '}
          <a
            href="mailto:hello@okamilabs.com"
            className="text-off-white underline underline-offset-4"
          >
            hello@okamilabs.com
          </a>{' '}
          with that reference and we'll resolve it immediately.
        </p>
        <p className="font-mono text-[10px] text-ash/50">
          Payment intent: {postChargeError.paymentIntentId}
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Error banner */}
      {error && (
        <div
          role="alert"
          className="border-l-2 border-burgundy pl-4 py-3 bg-burgundy/[0.04] mb-8"
        >
          <p className="font-body text-sm text-off-white leading-relaxed">
            {error.message}
          </p>
          {error.code && (
            <p className="font-mono text-[10px] text-ash/60 mt-1 tracking-[0.18em] uppercase">
              Code: {error.code}
            </p>
          )}
        </div>
      )}

      <PaymentElement
        options={{
          layout: { type: 'tabs', defaultCollapsed: false },
          defaultValues: {
            billingDetails: { email: bookingPayload.intake.email },
          },
        }}
      />

      {/* Footer */}
      <div className="flex justify-between items-center mt-10 pt-10 border-t border-ash/10 flex-wrap gap-4">
        <Button
          variant="ghost"
          showArrow={false}
          onClick={onBack}
          disabled={submitting}
        >
          ← Back
        </Button>
        <Button
          variant="consulting"
          type="submit"
          disabled={submitting || !stripe || !elements}
        >
          {submitting ? 'Processing…' : `Pay ${priceLabel}`}
        </Button>
      </div>

      {/* Quiet security line — the one concession to reassurance */}
      <p className="font-mono text-[10px] tracking-[0.18em] text-ash/40 mt-6 max-w-md">
        Payments processed by Stripe. Okami never stores card details.
      </p>

      <div className="mt-6 pt-6 border-t border-ash/10 max-w-md">
        <p className="font-mono text-[10px] tracking-[0.18em] text-ash/40 leading-[1.8]">
          Reschedule free of charge up to 24 hours before your session.
          Cancellations within 24 hours are non-refundable.
          No-shows are treated as completed sessions.
          Questions? Email{' '}
          <a
            href="mailto:hello@okamilabs.com"
            className="text-ash/60 underline underline-offset-2 hover:text-ash transition-colors"
          >
            hello@okamilabs.com
          </a>
        </p>
      </div>
    </form>
  );
}
