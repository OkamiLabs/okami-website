interface PartialBookingBeacon {
  email: string;
  serviceId: 'review' | 'discovery';
  slotIso: string | null;
  step: 'booking' | 'intake' | 'payment';
  intake: Record<string, string>;
  converted?: boolean;
}

export function trackPartialBooking(data: PartialBookingBeacon): void {
  try {
    const payload = JSON.stringify(data);
    if (typeof navigator !== 'undefined' && navigator.sendBeacon) {
      const blob = new Blob([payload], { type: 'application/json' });
      navigator.sendBeacon('/api/partial-booking', blob);
      return;
    }
    fetch('/api/partial-booking', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: payload,
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Tracking must never throw
  }
}
