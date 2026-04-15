'use client';

import { useSearchParams } from 'next/navigation';

export default function CheckoutSuccess() {
  const searchParams = useSearchParams();
  const isSuccess = searchParams.get('checkout') === 'success';

  if (!isSuccess) return null;

  return (
    <section className="border-b border-burgundy/20 bg-burgundy/[0.04]">
      <div className="max-w-4xl mx-auto px-6 py-12 md:py-16 text-center">
        <span className="font-mono text-xs uppercase tracking-widest text-burgundy block mb-4">
          Payment Confirmed
        </span>
        <h2 className="font-playfair text-3xl md:text-4xl text-off-white mb-4 leading-tight">
          You're in. Now let's book your session.
        </h2>
        <p className="font-body text-base text-ash max-w-xl mx-auto leading-relaxed">
          Your <span className="font-playfair">Okami Review</span> payment has been received. Select a time below for your
          45–60 minute session. You'll receive a confirmation email with details once booked.
        </p>
      </div>
    </section>
  );
}
