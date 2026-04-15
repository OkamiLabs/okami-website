/**
 * Cal.com embed bootstrap utility.
 * Call bootstrapCal() once to inject embed.js and set up the global Cal queue.
 * Subsequent calls are no-ops (guarded by window.__calBootstrapped).
 */

declare global {
  interface Window {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    Cal: any;
    __calBootstrapped: boolean;
  }
}

export function bootstrapCal(): void {
  if (typeof window === 'undefined' || window.__calBootstrapped) return;
  window.__calBootstrapped = true;

  // Cal.com canonical queue loader — verbatim from their embed wizard
  /* eslint-disable */
  (function (C: any, A: string, L: string) {
    let p = function (a: any, ar: any) { a.q.push(ar); };
    let d = C.document;
    C.Cal = C.Cal || function () {
      let cal = C.Cal;
      let ar = arguments;
      if (!cal.loaded) {
        cal.ns = {};
        cal.q = cal.q || [];
        d.head.appendChild(d.createElement('script')).src = A;
        cal.loaded = true;
      }
      if (ar[0] === L) {
        const api = function () { p(api, arguments); };
        const namespace = ar[1];
        (api as any).q = [];
        if (typeof namespace === 'string') {
          cal.ns[namespace] = cal.ns[namespace] || api;
          p(cal.ns[namespace], ar);
          p(cal, [L, namespace, ar[2]]);
        } else {
          p(cal, ar);
        }
        return;
      }
      p(cal, ar);
    };
  })(window, 'https://app.cal.com/embed/embed.js', 'init');
  /* eslint-enable */

  window.Cal('init', { origin: 'https://cal.com' });
}

/**
 * Opens the Cal.com booking modal for a given calLink.
 * When a specific slot ISO string is provided, the modal skips the calendar
 * and goes straight to the booking form with that time pre-selected.
 * Falls back to opening the Cal.com page in a new tab if the modal can't fire.
 *
 * @param calLink  e.g. "okami/okami-review"
 * @param slot     optional ISO datetime string of the selected slot (e.g. "2026-04-13T09:00:00.000-04:00")
 */
export function openCalModal(calLink: string, slot?: string): void {
  bootstrapCal();

  // Build query string: if we have a full slot time, pass both date and slot
  // so Cal.com skips the calendar and goes straight to the booking form.
  let queryParams = '';
  if (slot) {
    const date = slot.slice(0, 10); // YYYY-MM-DD
    queryParams = `?date=${date}&slot=${encodeURIComponent(slot)}`;
  }

  const linkWithParams = `${calLink}${queryParams}`;

  try {
    window.Cal('modal', {
      calLink: linkWithParams,
      config: { theme: 'dark' },
    });
  } catch {
    window.open(`https://cal.com/${linkWithParams}`, '_blank', 'noopener,noreferrer');
  }
}
