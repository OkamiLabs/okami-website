'use client';

import TimePicker from '../TimePicker';

export interface ServiceConfig {
  id: 'review' | 'discovery';
  name: string;
  calLink: string;
  duration: string;
  description: string;
}

interface BookingStepProps {
  services: readonly ServiceConfig[];
  serviceId: 'review' | 'discovery';
  onServiceChange: (id: 'review' | 'discovery') => void;
  selectedSlot: string | null;
  onSlotSelect: (iso: string) => void;
}

export default function BookingStep({
  services,
  serviceId,
  onServiceChange,
  selectedSlot,
  onSlotSelect,
}: BookingStepProps) {
  const active = services.find((s) => s.id === serviceId)!;

  return (
    <div className="w-full">
      <h1 className="font-playfair text-4xl md:text-5xl text-off-white mb-4 leading-[1.1]">
        When should we talk?
      </h1>
      <p className="font-body text-base text-ash mb-12 max-w-xl leading-relaxed">
        Pick a 45–60 minute slot that works. Times shown in your local timezone.
      </p>

      {/* Service tabs */}
      <div className="flex border-b border-ash/20 mb-10">
        {services.map((service) => {
          const isActive = serviceId === service.id;
          return (
            <button
              key={service.id}
              onClick={() => onServiceChange(service.id)}
              className={`relative pb-4 mr-10 text-xs tracking-widest uppercase transition-colors ${
                isActive ? 'text-off-white' : 'text-ash hover:text-off-white/70'
              }`}
            >
              {service.name}
              <span
                className={`ml-2 text-[10px] tracking-wider px-1.5 py-0.5 border transition-colors ${
                  isActive ? 'border-burgundy text-burgundy' : 'border-ash/30 text-ash/50'
                }`}
              >
                {service.duration}
              </span>
              {isActive && <span className="absolute bottom-0 left-0 right-0 h-px bg-burgundy" />}
            </button>
          );
        })}
      </div>

      <p className="font-body text-sm text-ash leading-relaxed mb-10 max-w-2xl">
        {active.description}
      </p>

      <TimePicker
        key={active.id}
        calLink={active.calLink}
        onSlotSelect={onSlotSelect}
        selectedSlot={selectedSlot}
      />
    </div>
  );
}
