'use client';

import { useReducer, useEffect, useCallback, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import StepIndicator from './StepIndicator';
import OrderSummary, { type SummaryService, type SummarySlot } from './OrderSummary';
import BookingStep, { type ServiceConfig } from './BookingStep';
import IntakeStep, { EMPTY_INTAKE, type IntakeValues } from './IntakeStep';
import PaymentStep from './PaymentStep';

/* ── Service catalog ──────────────────────────────────────────────── */

const SERVICES: readonly ServiceConfig[] = [
  {
    id: 'review',
    name: 'The Okami Review',
    calLink: 'okami/okami-review',
    duration: '60 min',
    description:
      'A structured conversation that maps how your business runs, where it breaks, and what to fix first. You receive a full report with prioritized recommendations.',
  },
  {
    id: 'discovery',
    name: 'Discovery Call',
    calLink: 'okami/discovery-call',
    duration: '15 min',
    description:
      "A 15-minute conversation to talk through what's slowing you down and whether the Okami Review is the right place to start.",
  },
] as const;

const SUMMARY_SERVICE: Record<'review' | 'discovery', SummaryService> = {
  review: {
    id: 'review',
    name: 'Review Service by Okami',
    duration: '45–60 min',
    format: 'Google Meet',
    description:
      'A 45–60 minute structured conversation followed by a full report mapping how your business runs, where it breaks, and what to fix first.',
    priceCents: 29900,
  },
  discovery: {
    id: 'discovery',
    name: 'Discovery Call',
    duration: '15 min',
    format: 'Google Meet',
    description:
      "A 15-minute conversation to talk through what's slowing you down and whether the Okami Review is the right fit.",
    priceCents: null,
  },
};

/* ── State machine ────────────────────────────────────────────────── */

type Step = 'booking' | 'intake' | 'payment';

interface FlowState {
  serviceId: 'review' | 'discovery';
  step: Step;
  slotIso: string | null;
  intake: IntakeValues;
  // Payment state — excluded from sessionStorage persistence
  clientSecret: string | null;
  paymentIntentId: string | null;
  initializingPayment: boolean;
  paymentInitError: string | null;
  submittingIntake: boolean;
}

type Action =
  | { type: 'SET_SERVICE'; id: 'review' | 'discovery' }
  | { type: 'SELECT_SLOT'; iso: string }
  | { type: 'GO_TO'; step: Step }
  | { type: 'SET_INTAKE'; values: IntakeValues }
  | { type: 'INTAKE_SUBMITTING'; value: boolean }
  | { type: 'PAYMENT_INIT_START' }
  | { type: 'PAYMENT_INIT_SUCCESS'; clientSecret: string; paymentIntentId: string }
  | { type: 'PAYMENT_INIT_ERROR'; message: string }
  | { type: 'CLEAR_PAYMENT' }
  | { type: 'RESTORE'; snapshot: Partial<FlowState> };

function initialState(defaultServiceId: 'review' | 'discovery'): FlowState {
  return {
    serviceId: defaultServiceId,
    step: 'booking',
    slotIso: null,
    intake: EMPTY_INTAKE,
    clientSecret: null,
    paymentIntentId: null,
    initializingPayment: false,
    paymentInitError: null,
    submittingIntake: false,
  };
}

function reducer(state: FlowState, action: Action): FlowState {
  switch (action.type) {
    case 'SET_SERVICE':
      if (state.serviceId === action.id) return state;
      return {
        ...state,
        serviceId: action.id,
        // Reset slot on service change (slots are service-specific)
        slotIso: null,
        clientSecret: null,
        paymentIntentId: null,
      };
    case 'SELECT_SLOT':
      return {
        ...state,
        slotIso: action.iso,
        // Any previously-minted PI is bound to the old slot — invalidate
        clientSecret: null,
        paymentIntentId: null,
      };
    case 'GO_TO':
      return { ...state, step: action.step, paymentInitError: null };
    case 'SET_INTAKE':
      return { ...state, intake: action.values };
    case 'INTAKE_SUBMITTING':
      return { ...state, submittingIntake: action.value };
    case 'PAYMENT_INIT_START':
      return { ...state, initializingPayment: true, paymentInitError: null };
    case 'PAYMENT_INIT_SUCCESS':
      return {
        ...state,
        initializingPayment: false,
        clientSecret: action.clientSecret,
        paymentIntentId: action.paymentIntentId,
        step: 'payment',
      };
    case 'PAYMENT_INIT_ERROR':
      return { ...state, initializingPayment: false, paymentInitError: action.message };
    case 'CLEAR_PAYMENT':
      return { ...state, clientSecret: null, paymentIntentId: null };
    case 'RESTORE':
      return { ...state, ...action.snapshot };
    default:
      return state;
  }
}

/* ── Persistence ──────────────────────────────────────────────────── */

const STORAGE_KEY = 'okami:book:state';
const STORAGE_MAX_AGE_MS = 2 * 60 * 60 * 1000; // 2h

interface StoredState {
  serviceId: 'review' | 'discovery';
  step: Step;
  slotIso: string | null;
  intake: IntakeValues;
  savedAt: number;
}

function loadSnapshot(): StoredState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const data = JSON.parse(raw) as StoredState;
    if (!data.savedAt || Date.now() - data.savedAt > STORAGE_MAX_AGE_MS) {
      window.sessionStorage.removeItem(STORAGE_KEY);
      return null;
    }
    return data;
  } catch {
    return null;
  }
}

function saveSnapshot(state: FlowState) {
  if (typeof window === 'undefined') return;
  try {
    const snapshot: StoredState = {
      serviceId: state.serviceId,
      step: state.step,
      slotIso: state.slotIso,
      intake: state.intake,
      savedAt: Date.now(),
    };
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot));
  } catch {
    /* noop — storage disabled or full */
  }
}

/* ── Slot formatting helper ───────────────────────────────────────── */

function formatSlotForSummary(iso: string): SummarySlot {
  const d = new Date(iso);
  const localLabel = `${d.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  })} · ${d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })}`;
  const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  return { iso, localLabel, timeZone };
}

/* ── Component ────────────────────────────────────────────────────── */

interface BookFlowProps {
  stripePublishableKey: string;
  defaultServiceId?: 'review' | 'discovery';
}

export default function BookFlow({
  stripePublishableKey,
  defaultServiceId = 'review',
}: BookFlowProps) {
  const router = useRouter();
  const [state, dispatch] = useReducer(reducer, defaultServiceId, initialState);
  const [hydrated, setHydrated] = useState(false);
  const isFirstLoad = useRef(true);

  // Restore from sessionStorage once on mount
  useEffect(() => {
    const snap = loadSnapshot();
    if (snap) {
      // clientSecret + paymentIntentId are intentionally NOT persisted — they
      // can go stale. If the user reloads while on the payment step, roll them
      // back to intake so "Continue to payment" can mint a fresh PI
      // (Stripe's idempotency key returns the same PI when nothing changed).
      const safeStep: Step = snap.step === 'payment' ? 'intake' : snap.step;
      dispatch({
        type: 'RESTORE',
        snapshot: {
          serviceId: snap.serviceId,
          step: safeStep,
          slotIso: snap.slotIso,
          intake: snap.intake,
        },
      });
    }
    setHydrated(true);
    isFirstLoad.current = false;
  }, []);

  // Persist on every state change (except on first hydration-triggered restore)
  useEffect(() => {
    if (!hydrated || isFirstLoad.current) return;
    saveSnapshot(state);
  }, [state, hydrated]);

  const handleServiceChange = useCallback((id: 'review' | 'discovery') => {
    dispatch({ type: 'SET_SERVICE', id });
  }, []);

  const handleSlotSelect = useCallback((iso: string) => {
    dispatch({ type: 'SELECT_SLOT', iso });
    dispatch({ type: 'GO_TO', step: 'intake' });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleIntakeBack = useCallback(() => {
    dispatch({ type: 'GO_TO', step: 'booking' });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleIntakeSubmit = useCallback(
    async (values: IntakeValues) => {
      dispatch({ type: 'SET_INTAKE', values });

      const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

      if (state.serviceId === 'discovery') {
        // No payment — go straight to booking creation
        dispatch({ type: 'INTAKE_SUBMITTING', value: true });
        try {
          const res = await fetch('/api/book', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              serviceId: 'discovery',
              slotIso: state.slotIso,
              timeZone,
              paymentIntentId: null,
              intake: values,
            }),
          });
          const data = await res.json().catch(() => null);
          if (!res.ok) {
            dispatch({ type: 'INTAKE_SUBMITTING', value: false });
            dispatch({
              type: 'PAYMENT_INIT_ERROR',
              message: data?.message ?? 'Could not create booking. Please try again.',
            });
            return;
          }
          try {
            window.sessionStorage.removeItem(STORAGE_KEY);
          } catch {
            /* noop */
          }
          const params = new URLSearchParams({ ref: data.referenceNumber });
          router.push(`/book/confirmed?${params.toString()}`);
        } catch {
          dispatch({ type: 'INTAKE_SUBMITTING', value: false });
          dispatch({ type: 'PAYMENT_INIT_ERROR', message: 'Network error. Please try again.' });
        }
        return;
      }

      // Review path — create PaymentIntent, advance to payment step
      dispatch({ type: 'PAYMENT_INIT_START' });
      try {
        const res = await fetch('/api/payment-intent', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            serviceId: 'review',
            slotIso: state.slotIso,
            timeZone,
            intake: values,
          }),
        });
        const data = await res.json().catch(() => null);
        if (!res.ok || !data?.clientSecret || !data?.paymentIntentId) {
          dispatch({
            type: 'PAYMENT_INIT_ERROR',
            message: data?.message ?? 'Could not start payment. Please try again.',
          });
          return;
        }
        dispatch({
          type: 'PAYMENT_INIT_SUCCESS',
          clientSecret: data.clientSecret,
          paymentIntentId: data.paymentIntentId,
        });
        if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
      } catch {
        dispatch({ type: 'PAYMENT_INIT_ERROR', message: 'Network error. Please try again.' });
      }
    },
    [state.serviceId, state.slotIso, router]
  );

  const handlePaymentBack = useCallback(() => {
    dispatch({ type: 'GO_TO', step: 'intake' });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  const handleStepClick = useCallback((stepId: string) => {
    if (stepId !== 'booking' && stepId !== 'intake' && stepId !== 'payment') return;
    dispatch({ type: 'GO_TO', step: stepId as Step });
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  /* ── Derived values ──────────────────────────────────────────────── */

  const summaryService = SUMMARY_SERVICE[state.serviceId];
  const slotSummary = state.slotIso ? formatSlotForSummary(state.slotIso) : null;

  // Step indicator config
  const stepsForService =
    state.serviceId === 'review'
      ? [
          { id: 'booking', label: 'Booking' },
          { id: 'intake', label: 'Details' },
          { id: 'payment', label: 'Payment' },
        ]
      : [
          { id: 'booking', label: 'Booking' },
          { id: 'intake', label: 'Details' },
        ];

  const completedStepIds = (() => {
    const completed: string[] = [];
    if (state.step === 'intake' || state.step === 'payment') completed.push('booking');
    if (state.step === 'payment') completed.push('intake');
    return completed;
  })();

  // Currently-active step id for indicator
  const currentStepId = state.step;

  const showSummary = state.step === 'payment';

  return (
    <div className={showSummary ? 'grid lg:grid-cols-[1fr_360px] gap-10 lg:gap-16' : ''}>
      {/* Left: flow column */}
      <div className="min-w-0">
        <StepIndicator
          steps={stepsForService}
          currentStepId={currentStepId}
          completedStepIds={completedStepIds}
          onStepClick={handleStepClick}
        />

        {/* Intake-submit error banner (shown on intake step) */}
        {state.step === 'intake' && state.paymentInitError && (
          <div
            role="alert"
            className="border-l-2 border-burgundy pl-4 py-3 bg-burgundy/[0.04] mb-10"
          >
            <p className="font-body text-sm text-off-white leading-relaxed">
              {state.paymentInitError}
            </p>
          </div>
        )}

        {state.step === 'booking' && (
          <BookingStep
            services={SERVICES}
            serviceId={state.serviceId}
            onServiceChange={handleServiceChange}
            selectedSlot={state.slotIso}
            onSlotSelect={handleSlotSelect}
          />
        )}

        {state.step === 'intake' && (
          <IntakeStep
            serviceId={state.serviceId}
            initialValues={state.intake}
            onSubmit={handleIntakeSubmit}
            onBack={handleIntakeBack}
            submitCtaLabel={
              state.serviceId === 'review' ? 'Continue to payment' : 'Confirm booking'
            }
            submitting={state.submittingIntake || state.initializingPayment}
          />
        )}

        {state.step === 'payment' &&
          (state.clientSecret && state.paymentIntentId && state.slotIso ? (
            <PaymentStep
              publishableKey={stripePublishableKey}
              clientSecret={state.clientSecret}
              paymentIntentId={state.paymentIntentId}
              priceLabel="$299"
              bookingPayload={{
                serviceId: 'review',
                slotIso: state.slotIso,
                timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
                intake: state.intake,
              }}
              onBack={handlePaymentBack}
            />
          ) : (
            <div className="border border-burgundy/30 bg-burgundy/[0.04] p-8 max-w-xl">
              <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-burgundy block mb-4">
                Session Expired
              </span>
              <h2 className="font-playfair text-2xl text-off-white mb-3 leading-tight">
                Let&apos;s rebuild your payment session.
              </h2>
              <p className="font-body text-sm text-ash mb-6 leading-relaxed">
                Your details are still here. Step back to intake and press Continue to restart payment — no charges have been made.
              </p>
              <button
                type="button"
                onClick={handlePaymentBack}
                className="font-mono text-xs tracking-[0.22em] uppercase text-off-white hover:text-burgundy underline underline-offset-4 transition-colors"
              >
                ← Back to intake
              </button>
            </div>
          ))}
      </div>

      {/* Right: order summary — only on payment step */}
      {showSummary && (
        <OrderSummary
          service={summaryService}
          slot={slotSummary}
          intakeName={state.intake.name || undefined}
          intakeEmail={state.intake.email || undefined}
          showTotal={state.serviceId === 'review'}
          mobileExpandedDefault
        />
      )}
    </div>
  );
}
