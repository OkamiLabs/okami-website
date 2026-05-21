import { describe, it, expect, vi, beforeEach } from 'vitest';
import type Stripe from 'stripe';

// ---------------------------------------------------------------------------
// Module-level mocks — Vitest hoists these above imports automatically
// ---------------------------------------------------------------------------

vi.mock('./stripe', () => ({
  stripe: {
    paymentIntents: {
      update: vi.fn().mockResolvedValue({}),
    },
  },
  // toRef is a pure function — inline the real implementation so tests don't
  // depend on a network call or the env var guard in lib/stripe.ts
  toRef: (id: string, serviceId: 'review' | 'discovery') => {
    const prefix = serviceId === 'review' ? 'OR' : 'DC';
    const cleaned = id.replace(/[^a-zA-Z0-9]/g, '');
    const tail = cleaned.slice(-6).toUpperCase();
    return `${prefix}-${tail}`;
  },
}));

vi.mock('./cal-bookings', async (importOriginal) => {
  const original = await importOriginal<typeof import('./cal-bookings')>();
  return {
    ...original,             // preserves CalBookingError so instanceof works
    createBooking: vi.fn(),  // controllable mock
  };
});

vi.mock('@sentry/nextjs', () => ({
  captureException: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Imports (after mocks)
// ---------------------------------------------------------------------------

import { reconcileBookingFromIntent, ReconcileError } from './booking-flow';
import { createBooking, CalBookingError } from './cal-bookings';
import * as Sentry from '@sentry/nextjs';

// ---------------------------------------------------------------------------
// Fixtures
// ---------------------------------------------------------------------------

function makeSucceededPI(overrides: Partial<{ metadata: Record<string, string> }> = {}) {
  return {
    id: 'pi_3Rxyz12345abcde',
    status: 'succeeded',
    receipt_email: null,
    metadata: {
      slotIso: '2026-06-01T10:00:00Z',
      timeZone: 'America/New_York',
      name: 'Jane Doe',
      email: 'jane@example.com',
      company: 'Acme',
      role: 'CTO',
      companySize: '11-50',
      challenge: 'scaling',
      revenueStage: 'growth',
      howHeard: 'referral',
      serviceId: 'review',
      ...overrides.metadata,
    },
  } as unknown as Stripe.PaymentIntent;
}

const fakeCalBooking = {
  id: 99,
  uid: 'uid-abc',
  rescheduleUri: 'https://cal.com/reschedule/uid-abc',
  status: 'accepted',
  raw: {},
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('reconcileBookingFromIntent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // -------------------------------------------------------------------------
  describe('happy path', () => {
    it('returns ReconciledBooking with correct shape when PI succeeded and booking is new', async () => {
      vi.mocked(createBooking).mockResolvedValue(fakeCalBooking);

      const pi = makeSucceededPI();
      const result = await reconcileBookingFromIntent(pi);

      expect(result.referenceNumber).toMatch(/^OR-/);
      expect(result.bookingId).toBe('99');
      expect(result.email).toBe('jane@example.com');
      expect(result.slot).toBe('2026-06-01T10:00:00Z');
      expect(createBooking).toHaveBeenCalledOnce();
    });
  });

  // -------------------------------------------------------------------------
  describe('idempotent path', () => {
    it('returns cached result without calling createBooking when bookingId already in metadata', async () => {
      const pi = {
        id: 'pi_3Rxyz12345abcde',
        status: 'succeeded',
        receipt_email: null,
        metadata: {
          bookingId: '42',
          bookingUid: 'uid-existing',
          rescheduleUrl: 'https://cal.com/reschedule/uid-existing',
          slotIso: '2026-06-01T10:00:00Z',
          serviceId: 'review',
          email: 'jane@example.com',
        },
      } as unknown as Stripe.PaymentIntent;

      const result = await reconcileBookingFromIntent(pi);

      expect(createBooking).not.toHaveBeenCalled();
      expect(result.referenceNumber).toMatch(/^OR-/);
      expect(result.bookingId).toBe('42');
      expect(result.email).toBe('jane@example.com');
    });
  });

  // -------------------------------------------------------------------------
  describe('BOOKING_FAILED_POST_CHARGE', () => {
    it('calls Sentry.captureException and throws ReconcileError cal_failure when createBooking rejects', async () => {
      vi.mocked(createBooking).mockRejectedValue(
        new CalBookingError('Cal API down', 503, { message: 'unavailable' })
      );

      const pi = makeSucceededPI();

      await expect(reconcileBookingFromIntent(pi)).rejects.toMatchObject({
        name: 'ReconcileError',
        code: 'cal_failure',
      });

      expect(Sentry.captureException).toHaveBeenCalledOnce();
    });
  });

  // -------------------------------------------------------------------------
  describe('ReconcileError codes', () => {
    it('not_configured — throws when stripe is null', async () => {
      // Override the stripe module so that stripe is null for this test
      vi.resetModules();
      vi.doMock('./stripe', () => ({
        stripe: null,
        toRef: (id: string, serviceId: 'review' | 'discovery') => {
          const prefix = serviceId === 'review' ? 'OR' : 'DC';
          const cleaned = id.replace(/[^a-zA-Z0-9]/g, '');
          const tail = cleaned.slice(-6).toUpperCase();
          return `${prefix}-${tail}`;
        },
      }));

      const { reconcileBookingFromIntent: reconcile } = await import('./booking-flow');

      const pi = makeSucceededPI();
      await expect(reconcile(pi)).rejects.toMatchObject({
        name: 'ReconcileError',
        code: 'not_configured',
      });

      // Restore the original mock for subsequent tests
      vi.resetModules();
      vi.doMock('./stripe', () => ({
        stripe: {
          paymentIntents: {
            update: vi.fn().mockResolvedValue({}),
          },
        },
        toRef: (id: string, serviceId: 'review' | 'discovery') => {
          const prefix = serviceId === 'review' ? 'OR' : 'DC';
          const cleaned = id.replace(/[^a-zA-Z0-9]/g, '');
          const tail = cleaned.slice(-6).toUpperCase();
          return `${prefix}-${tail}`;
        },
      }));
    });

    it('payment_not_succeeded — throws when PI status is not succeeded', async () => {
      const pi = {
        id: 'pi_test',
        status: 'requires_payment_method',
        receipt_email: null,
        metadata: {},
      } as unknown as Stripe.PaymentIntent;

      await expect(reconcileBookingFromIntent(pi)).rejects.toMatchObject({
        name: 'ReconcileError',
        code: 'payment_not_succeeded',
      });
    });

    it('metadata_missing — throws when required fields absent from metadata', async () => {
      const pi = {
        id: 'pi_test2',
        status: 'succeeded',
        receipt_email: null,
        metadata: {
          serviceId: 'review',
          // slotIso, name, email, challenge are all absent
        },
      } as unknown as Stripe.PaymentIntent;

      await expect(reconcileBookingFromIntent(pi)).rejects.toMatchObject({
        name: 'ReconcileError',
        code: 'metadata_missing',
      });
    });
  });
});
