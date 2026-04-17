'use client';

import { useState } from 'react';

export interface SummaryService {
  id: 'review' | 'discovery';
  name: string; // "Review Service by Okami" / "Discovery Call"
  duration: string; // "45–60 min"
  format: string; // "Google Meet"
  description: string;
  priceCents: number | null; // null for free
}

export interface SummarySlot {
  iso: string;
  localLabel: string; // "Tue, Apr 21 · 2:00 PM"
  timeZone: string;
}

interface OrderSummaryProps {
  service: SummaryService;
  slot?: SummarySlot | null;
  intakeName?: string;
  intakeEmail?: string;
  showTotal?: boolean;
  /** Auto-expand the mobile accordion when rendered under a non-booking step. */
  mobileExpandedDefault?: boolean;
}

function formatPrice(cents: number): string {
  return `$${(cents / 100).toFixed(2)}`;
}

export default function OrderSummary({
  service,
  slot,
  intakeName,
  intakeEmail,
  showTotal = true,
  mobileExpandedDefault = false,
}: OrderSummaryProps) {
  const [mobileOpen, setMobileOpen] = useState(mobileExpandedDefault);
  const priceLabel = service.priceCents == null ? 'No charge' : formatPrice(service.priceCents);

  const detailRows: Array<{ label: string; value: string; sub?: string }> = [];
  if (slot) {
    detailRows.push({
      label: 'When',
      value: slot.localLabel,
      sub: slot.timeZone,
    });
  }
  detailRows.push({ label: 'Duration', value: service.duration });
  detailRows.push({ label: 'Format', value: service.format });
  if (intakeName) detailRows.push({ label: 'Name', value: intakeName });
  if (intakeEmail) detailRows.push({ label: 'Email', value: intakeEmail });

  const body = (
    <>
      {/* Top accent — matches the Services hero treatment */}
      <div className="w-8 h-[2px] bg-burgundy mb-6" />

      <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-burgundy block mb-3">
        Order
      </span>

      <h3 className="font-playfair text-2xl text-off-white leading-[1.15] mb-6">
        {service.name}
      </h3>

      <div className="border-t border-dashed border-ash/15 my-6" />

      {/* Detail rows */}
      <dl className="space-y-3">
        {detailRows.map((row) => (
          <div key={row.label} className="flex items-start justify-between gap-6 py-1">
            <dt className="font-mono text-[10px] tracking-[0.22em] uppercase text-ash/60 flex-shrink-0 pt-1">
              {row.label}
            </dt>
            <dd className="text-right">
              <div className="font-mono text-sm text-off-white tabular-nums">
                {row.value}
              </div>
              {row.sub && (
                <div className="font-mono text-[10px] text-ash/50 mt-0.5">
                  {row.sub}
                </div>
              )}
            </dd>
          </div>
        ))}
      </dl>

      {/* Total block */}
      {showTotal && (
        <>
          <div className="border-t border-ash/20 my-6" />
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-ash">
              Total
            </span>
            <div className="text-right">
              <div className="font-mono text-2xl text-off-white tabular-nums">
                {priceLabel}
              </div>
              {service.priceCents != null && (
                <div className="font-mono text-[10px] text-ash/50 mt-1">
                  USD · paid in full at booking
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Footnote */}
      <p className="font-mono text-[10px] text-ash/40 leading-[1.7] mt-8 pt-6 border-t border-ash/10">
        Reschedule up to 24 hours before. Cancellation fees apply after.
      </p>
    </>
  );

  return (
    <>
      {/* Desktop: full sidebar */}
      <aside className="hidden lg:block border border-ash/10 bg-dark p-8 sticky top-28 self-start">
        {body}
      </aside>

      {/* Mobile: collapsible accordion at top of flow */}
      <aside className="lg:hidden border border-ash/10 bg-dark mb-8">
        <button
          type="button"
          onClick={() => setMobileOpen((o) => !o)}
          aria-expanded={mobileOpen}
          className="w-full flex items-center justify-between px-6 py-4"
        >
          <div className="flex items-baseline gap-3 text-left">
            <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-burgundy">
              Order
            </span>
            <span className="font-playfair text-base text-off-white">
              {service.name}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-sm text-off-white tabular-nums">
              {priceLabel}
            </span>
            <span
              className={`font-mono text-xs text-ash transition-transform duration-300 ${
                mobileOpen ? 'rotate-180' : ''
              }`}
              aria-hidden
            >
              ↓
            </span>
          </div>
        </button>
        {mobileOpen && (
          <div className="px-6 pb-6 pt-2 border-t border-ash/10">{body}</div>
        )}
      </aside>
    </>
  );
}
