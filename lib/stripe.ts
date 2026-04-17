/**
 * Server-side Stripe client singleton + shared helpers.
 *
 * - `stripe` is the server SDK instance (Node). Never import this from a client component.
 * - `toRef(id, serviceId)` derives a short human-readable booking reference
 *   from a Stripe PaymentIntent id or Cal booking id.
 */

import Stripe from 'stripe';

const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY;

if (!STRIPE_SECRET_KEY && process.env.NODE_ENV === 'production') {
  // Fail loud at import time in prod so missing config is surfaced immediately.
  // In dev we allow unconfigured so the site still boots without Stripe keys.
  console.warn('[stripe] STRIPE_SECRET_KEY not set — payment endpoints will 503.');
}

export const stripe = STRIPE_SECRET_KEY
  ? new Stripe(STRIPE_SECRET_KEY, {
      apiVersion: '2026-03-25.dahlia',
      typescript: true,
      appInfo: { name: 'okamilabs.com', version: '1.0.0' },
    })
  : null;

export function isStripeConfigured(): boolean {
  return stripe !== null;
}

/**
 * Turn a Stripe PaymentIntent id (or Cal booking id) into a short user-facing
 * reference. Prefix varies by service so users can distinguish paid Okami Reviews
 * from free Discovery Calls when referencing bookings in email.
 *
 * Examples:
 *   toRef('pi_3Rxyz12345abcde', 'review') → 'OR-ABCDE'
 *   toRef('pi_3Rxyz12345abcde', 'discovery') → 'DC-ABCDE'
 */
export function toRef(id: string, serviceId: 'review' | 'discovery'): string {
  const prefix = serviceId === 'review' ? 'OR' : 'DC';
  const cleaned = id.replace(/[^a-zA-Z0-9]/g, '');
  const tail = cleaned.slice(-6).toUpperCase();
  return `${prefix}-${tail}`;
}
