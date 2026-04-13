'use client';

import { useState } from 'react';
import TimePicker from './TimePicker';

const SERVICES = [
  {
    id: 'diagnostic',
    name: 'Operations Diagnostic',
    calLink: 'okami/operations-diagnostic',
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
      "A 15-minute conversation to talk through what's slowing you down and whether the Operations Diagnostic is the right place to start.",
  },
] as const;

type ServiceId = (typeof SERVICES)[number]['id'];

export default function BookingSelector() {
  const [selected, setSelected] = useState<ServiceId>('diagnostic');

  const active = SERVICES.find((s) => s.id === selected)!;

  return (
    <div className="w-full">
      {/* Tab selector */}
      <div className="flex border-b border-ash/20 mb-10">
        {SERVICES.map((service) => {
          const isActive = selected === service.id;
          return (
            <button
              key={service.id}
              onClick={() => setSelected(service.id)}
              className={[
                'relative pb-4 mr-10 font-mono text-xs tracking-widest uppercase transition-colors',
                isActive ? 'text-off-white' : 'text-ash hover:text-off-white/70',
              ].join(' ')}
            >
              {service.name}
              <span
                className={[
                  'ml-2 text-[10px] tracking-wider px-1.5 py-0.5 border transition-colors',
                  isActive ? 'border-burgundy text-burgundy' : 'border-ash/30 text-ash/50',
                ].join(' ')}
              >
                {service.duration}
              </span>
              {isActive && <span className="absolute bottom-0 left-0 right-0 h-px bg-burgundy" />}
            </button>
          );
        })}
      </div>

      {/* Active service description */}
      <p className="font-body text-sm text-ash leading-relaxed mb-10 max-w-2xl">
        {active.description}
      </p>

      {/* Time picker — key forces fresh state when switching services */}
      <TimePicker key={active.id} calLink={active.calLink} />
    </div>
  );
}
