'use client';

import { forwardRef } from 'react';

interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

interface SelectProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  options: SelectOption[];
  placeholder?: string;
  error?: boolean;
  'aria-invalid'?: boolean;
  'aria-describedby'?: string;
  disabled?: boolean;
}

// Inline chevron, stroke = ash (#9A918A). 1.5px stroke.
const chevronDataUri =
  "data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 10 10' fill='none'%3E%3Cpath d='M1 3 L5 7 L9 3' stroke='%239A918A' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E";

const Select = forwardRef<HTMLSelectElement, SelectProps>(function Select(
  { id, value, onChange, onBlur, options, placeholder, error, disabled, ...aria },
  ref
) {
  const borderColor = error ? 'border-burgundy' : 'border-ash/25 hover:border-ash/50';

  return (
    <select
      ref={ref}
      id={id}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      onBlur={onBlur}
      disabled={disabled}
      aria-invalid={aria['aria-invalid']}
      aria-describedby={aria['aria-describedby']}
      className={`w-full bg-dark border ${borderColor} text-off-white font-body text-base py-4 px-5 pr-12 appearance-none focus:border-burgundy focus:outline-none transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${
        !value ? 'text-ash/60' : ''
      }`}
      style={{
        backgroundImage: `url("${chevronDataUri}")`,
        backgroundRepeat: 'no-repeat',
        backgroundPosition: 'right 1.25rem center',
        backgroundSize: '10px',
      }}
    >
      {placeholder && (
        <option value="" disabled hidden>
          {placeholder}
        </option>
      )}
      {options.map((opt) => (
        <option key={opt.value} value={opt.value} disabled={opt.disabled}>
          {opt.label}
        </option>
      ))}
    </select>
  );
});

export default Select;
