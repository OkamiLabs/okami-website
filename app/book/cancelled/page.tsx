'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense } from 'react';
import BookTopBar from '@/components/book/BookTopBar';

const COUNTDOWN_SECONDS = 5;

function CancelledInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reason = searchParams.get('reason');
  const [seconds, setSeconds] = useState(COUNTDOWN_SECONDS);
  const [paused, setPaused] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (paused) return;
    intervalRef.current = setInterval(() => {
      setSeconds((s) => {
        if (s <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          router.replace('/book');
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused, router]);

  // Copy variants based on reason
  const headline = reason === 'payment_failed' ? 'Payment didn\u2019t clear.' : 'No charge made.';
  const explanation =
    reason === 'payment_failed'
      ? 'The payment was returned by your bank. No charge was made. You can pick up where you left off, or try a different card.'
      : 'You backed out before the payment cleared. Your slot wasn\u2019t held. You can try again whenever you\u2019re ready.';

  return (
    <main className="min-h-screen bg-dark">
      <BookTopBar />
      <div className="max-w-2xl mx-auto px-6 py-16 text-center flex flex-col items-center justify-center min-h-[calc(100vh-5rem)]">
        {/* Top accent — ash (neutral), not burgundy */}
        <div className="w-12 h-[2px] bg-ash/40 mx-auto mb-8" />

        <span className="font-mono text-xs tracking-[0.32em] uppercase text-ash block mb-6">
          Payment Not Completed
        </span>

        <h1 className="font-playfair text-5xl md:text-6xl text-off-white leading-[1.05] mb-6">
          {headline}
        </h1>

        <p className="font-body text-lg text-ash mb-12 max-w-xl mx-auto leading-relaxed">
          {explanation}
        </p>

        {/* Countdown card */}
        <div
          onMouseEnter={() => setPaused(true)}
          onMouseLeave={() => setPaused(false)}
          onFocus={() => setPaused(true)}
          onBlur={() => setPaused(false)}
          className={`inline-flex items-center gap-6 border px-8 py-6 transition-colors ${
            paused ? 'border-burgundy/40' : 'border-ash/15'
          }`}
          role="status"
          aria-live="polite"
        >
          <span className="font-mono text-[10px] tracking-[0.22em] uppercase text-ash">
            Redirecting in
          </span>
          <span className="font-mono text-3xl text-off-white tabular-nums">
            {String(seconds).padStart(2, '0')}
          </span>
          <span className="w-px h-8 bg-ash/20" aria-hidden />
          <button
            type="button"
            onClick={() => router.replace('/book')}
            className="text-xs tracking-[0.22em] uppercase text-burgundy hover:text-off-white underline underline-offset-4 transition-colors"
          >
            Take me there now →
          </button>
        </div>

        {paused && (
          <p className="font-mono text-[10px] tracking-[0.22em] uppercase text-ash/50 mt-3">
            Paused
          </p>
        )}

        <p className="text-xs text-ash/40 mt-16 max-w-md mx-auto leading-relaxed">
          Trouble with the payment form? Email{' '}
          <a
            href="mailto:hello@okamilabs.com"
            className="text-ash hover:text-off-white underline underline-offset-4 transition-colors"
          >
            hello@okamilabs.com
          </a>
          .
        </p>
      </div>
    </main>
  );
}

export default function CancelledPage() {
  return (
    <Suspense fallback={null}>
      <CancelledInner />
    </Suspense>
  );
}
