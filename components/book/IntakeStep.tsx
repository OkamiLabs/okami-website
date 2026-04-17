'use client';

import { useRef, useState } from 'react';
import Button from '../Button';
import FormField from './FormField';
import { trackPartialBooking } from '@/lib/track-partial-booking';

export type ServiceId = 'review' | 'discovery';

export interface IntakeValues {
  name: string;
  email: string;
  company: string;
  role: string;
  companySize: string;
  challenge: string;
  revenueStage: string;
  howHeard: string;
}

export const EMPTY_INTAKE: IntakeValues = {
  name: '',
  email: '',
  company: '',
  role: '',
  companySize: '',
  challenge: '',
  revenueStage: '',
  howHeard: '',
};

interface IntakeStepProps {
  serviceId: ServiceId;
  slotIso: string | null;
  initialValues: IntakeValues;
  onSubmit: (values: IntakeValues) => void;
  onBack: () => void;
  submitCtaLabel: string; // "Continue to payment" or "Confirm booking"
  submitting?: boolean;
}

const COMPANY_SIZE_OPTIONS = [
  { value: 'Just me', label: 'Just me' },
  { value: '2–10', label: '2–10' },
  { value: '11–50', label: '11–50' },
  { value: '51–200', label: '51–200' },
  { value: '201+', label: '201+' },
];

const REVENUE_STAGE_OPTIONS = [
  { value: 'Pre-revenue', label: 'Pre-revenue' },
  { value: 'Under $250k', label: 'Under $250k' },
  { value: '$250k–$1M', label: '$250k–$1M' },
  { value: '$1M–$5M', label: '$1M–$5M' },
  { value: '$5M+', label: '$5M+' },
  { value: 'Prefer not to say', label: 'Prefer not to say' },
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

type FieldKey = keyof IntakeValues;
type Errors = Partial<Record<FieldKey, string>>;

function validate(values: IntakeValues, serviceId: ServiceId): Errors {
  const errors: Errors = {};

  if (values.name.trim().length < 2) errors.name = 'Enter your name.';
  else if (values.name.trim().length > 80) errors.name = 'Name is too long.';

  if (!values.email.trim()) errors.email = 'Enter your email.';
  else if (!EMAIL_RE.test(values.email.trim())) errors.email = 'That email doesn\u2019t look right.';

  if (values.role.trim().length > 80) errors.role = 'Role is too long.';

  if (values.challenge.trim().length < 20) errors.challenge = 'Add a bit more detail (20 characters minimum).';
  else if (values.challenge.trim().length > 1000) errors.challenge = 'That\u2019s plenty — try 1000 characters or fewer.';

  if (serviceId === 'review') {
    if (values.company.trim().length < 1) errors.company = 'Enter your company name.';
    else if (values.company.trim().length > 120) errors.company = 'Company name is too long.';

    if (!values.companySize) errors.companySize = 'Pick a company size.';
  }

  return errors;
}

export default function IntakeStep({
  serviceId,
  slotIso,
  initialValues,
  onSubmit,
  onBack,
  submitCtaLabel,
  submitting,
}: IntakeStepProps) {
  const [values, setValues] = useState<IntakeValues>(initialValues);
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const fieldRefs = useRef<Partial<Record<FieldKey, HTMLElement | null>>>({});

  const isReview = serviceId === 'review';

  function setField<K extends FieldKey>(key: K, value: string) {
    setValues((v) => ({ ...v, [key]: value }));
    // After first submit attempt, revalidate on every change
    if (submitAttempted) {
      const next = { ...values, [key]: value };
      setErrors(validate(next, serviceId));
    }
  }

  function onBlurField(key: FieldKey) {
    setTouched((t) => ({ ...t, [key]: true }));
    setErrors(validate(values, serviceId));

    if (key === 'email' && EMAIL_RE.test(values.email.trim())) {
      trackPartialBooking({
        email: values.email.trim(),
        serviceId,
        slotIso,
        step: 'intake',
        intake: {
          name: values.name,
          company: values.company,
          role: values.role,
          challenge: values.challenge,
        },
      });
    }
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitAttempted(true);
    const nextErrors = validate(values, serviceId);
    setErrors(nextErrors);

    const firstInvalid = (Object.keys(nextErrors) as FieldKey[])[0];
    if (firstInvalid) {
      const el = fieldRefs.current[firstInvalid];
      if (el) {
        el.scrollIntoView({ block: 'center', behavior: 'smooth' });
        // Focus after scroll settles
        setTimeout(() => {
          if (typeof (el as HTMLElement).focus === 'function') (el as HTMLElement).focus();
        }, 300);
      }
      return;
    }

    onSubmit(values);
  }

  // Only show an error once the field has been touched or submit was attempted
  const shownError = (key: FieldKey) =>
    submitAttempted || touched[key] ? errors[key] : undefined;

  const setRef = (key: FieldKey) => (el: HTMLElement | null) => {
    fieldRefs.current[key] = el;
  };

  return (
    <form onSubmit={handleSubmit} noValidate className="w-full">
      <h1 className="font-playfair text-4xl md:text-5xl text-off-white mb-4 leading-[1.1]">
        Tell us about the business.
      </h1>
      <p className="font-body text-base text-ash mb-4 max-w-xl leading-relaxed">
        A few details so the session goes deep, fast.
      </p>

      <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ash/60 mb-12 pb-4 border-b border-ash/10">
        All fields required unless marked optional
      </p>

      <div className="space-y-6">
        <FormField
          ref={setRef('name')}
          id="name"
          label="Your name"
          value={values.name}
          onChange={(v) => setField('name', v)}
          onBlur={() => onBlurField('name')}
          error={shownError('name')}
          autoComplete="name"
          maxLength={80}
          disabled={submitting}
        />

        <FormField
          ref={setRef('email')}
          id="email"
          label="Email"
          type="email"
          placeholder="you@company.com"
          value={values.email}
          onChange={(v) => setField('email', v)}
          onBlur={() => onBlurField('email')}
          error={shownError('email')}
          autoComplete="email"
          maxLength={254}
          disabled={submitting}
        />

        {isReview && (
          <FormField
            ref={setRef('company')}
            id="company"
            label="Company"
            value={values.company}
            onChange={(v) => setField('company', v)}
            onBlur={() => onBlurField('company')}
            error={shownError('company')}
            autoComplete="organization"
            maxLength={120}
            disabled={submitting}
          />
        )}

        <FormField
          ref={setRef('role')}
          id="role"
          label="Role"
          placeholder="Founder, Ops Lead, etc."
          value={values.role}
          onChange={(v) => setField('role', v)}
          onBlur={() => onBlurField('role')}
          error={shownError('role')}
          autoComplete="organization-title"
          maxLength={80}
          optional
          disabled={submitting}
        />

        {/* Visual section break — "who you are" vs "about the business" */}
        {isReview && <div className="h-6" aria-hidden />}

        {isReview && (
          <FormField
            ref={setRef('companySize')}
            id="companySize"
            label="Company size"
            type="select"
            placeholder="Select a range"
            value={values.companySize}
            onChange={(v) => setField('companySize', v)}
            onBlur={() => onBlurField('companySize')}
            error={shownError('companySize')}
            options={COMPANY_SIZE_OPTIONS}
            disabled={submitting}
          />
        )}

        <FormField
          ref={setRef('challenge')}
          id="challenge"
          label="What's slowing the business down right now?"
          type="textarea"
          placeholder="A few sentences is plenty. We'll go deeper in the session."
          rows={isReview ? 6 : 4}
          value={values.challenge}
          onChange={(v) => setField('challenge', v)}
          onBlur={() => onBlurField('challenge')}
          error={shownError('challenge')}
          maxLength={1000}
          disabled={submitting}
        />

        {isReview && (
          <>
            <FormField
              ref={setRef('revenueStage')}
              id="revenueStage"
              label="Revenue stage"
              type="select"
              placeholder="Select a range"
              value={values.revenueStage}
              onChange={(v) => setField('revenueStage', v)}
              onBlur={() => onBlurField('revenueStage')}
              options={REVENUE_STAGE_OPTIONS}
              optional
              disabled={submitting}
            />

            <FormField
              ref={setRef('howHeard')}
              id="howHeard"
              label="How did you hear about Okami?"
              value={values.howHeard}
              onChange={(v) => setField('howHeard', v)}
              onBlur={() => onBlurField('howHeard')}
              maxLength={120}
              optional
              disabled={submitting}
            />
          </>
        )}
      </div>

      {/* Footer */}
      <div className="flex justify-between items-center mt-12 pt-10 border-t border-ash/10 flex-wrap gap-4">
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
          disabled={submitting}
        >
          {submitting ? 'One moment…' : submitCtaLabel}
        </Button>
      </div>
    </form>
  );
}
