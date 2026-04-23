'use client';

import { forwardRef } from 'react';
import Select from './Select';

type FieldType = 'text' | 'email' | 'tel' | 'textarea' | 'select';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface FormFieldProps {
  id: string;
  label: string;
  type?: FieldType;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  placeholder?: string;
  error?: string;
  optional?: boolean;
  rows?: number;
  options?: SelectOption[];
  autoComplete?: string;
  maxLength?: number;
  disabled?: boolean;
}

type AnyInputRef = HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement;

/**
 * Atomic form field: label row (label + optional marker), input, error message.
 * Top-aligned fixed label, no floating behavior — per UX research.
 */
const FormField = forwardRef<AnyInputRef, FormFieldProps>(function FormField(
  {
    id,
    label,
    type = 'text',
    value,
    onChange,
    onBlur,
    placeholder,
    error,
    optional,
    rows = 4,
    options,
    autoComplete,
    maxLength,
    disabled,
  },
  ref
) {
  const errorId = `${id}-error`;
  const hasError = Boolean(error);

  // Shared input styling — idle → hover → focus → error states
  const borderBase = hasError
    ? 'border-burgundy'
    : 'border-ash/25 hover:border-ash/50';
  const baseInput = `w-full bg-dark border ${borderBase} text-off-white font-body text-base py-4 px-5 placeholder:text-ash/40 focus:border-burgundy focus:outline-none transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed`;

  return (
    <div className="w-full">
      {/* Label row */}
      <div className="flex items-baseline justify-between mb-2">
        <label
          htmlFor={id}
          className="font-mono text-[10px] tracking-[0.22em] uppercase text-ash"
        >
          {label}
        </label>
        {optional && (
          <span className="font-mono text-[10px] tracking-[0.18em] text-ash/40">
            · OPTIONAL
          </span>
        )}
      </div>

      {/* Input variants */}
      {type === 'textarea' ? (
        <textarea
          ref={ref as React.Ref<HTMLTextAreaElement>}
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          rows={rows}
          maxLength={maxLength}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? errorId : undefined}
          className={`${baseInput} resize-none leading-[1.6]`}
        />
      ) : type === 'select' ? (
        <Select
          ref={ref as React.Ref<HTMLSelectElement>}
          id={id}
          value={value}
          onChange={onChange}
          onBlur={onBlur}
          options={options ?? []}
          placeholder={placeholder}
          error={hasError}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? errorId : undefined}
          disabled={disabled}
        />
      ) : (
        <input
          ref={ref as React.Ref<HTMLInputElement>}
          id={id}
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onBlur={onBlur}
          placeholder={placeholder}
          autoComplete={autoComplete}
          maxLength={maxLength}
          disabled={disabled}
          aria-invalid={hasError || undefined}
          aria-describedby={hasError ? errorId : undefined}
          className={baseInput}
        />
      )}

      {/* Error message — burgundy em-dash prefix, off-white text. Border carries the alarm. */}
      {hasError && (
        <p
          id={errorId}
          role="alert"
          className="mt-2 font-body text-xs text-off-white"
        >
          <span className="text-burgundy mr-2">—</span>
          {error}
        </p>
      )}
    </div>
  );
});

export default FormField;
