import type { Metadata } from 'next';
import { Suspense } from 'react';
import { BookingSelector, NewsletterForm } from '@/components';
import CheckoutSuccess from '@/components/CheckoutSuccess';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Book a 45-minute Operations Diagnostic. Walk away with a full report on how your business runs, where it breaks, and what to fix first.',
  openGraph: {
    title: 'Book Your Operations Diagnostic — Okami Labs',
    description:
      'Book a 45-minute Operations Diagnostic. Walk away with a full report on how your business runs, where it breaks, and what to fix first.',
  },
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-dark">
      {/* Checkout Success Banner */}
      <Suspense>
        <CheckoutSuccess />
      </Suspense>

      {/* Hero Section */}
      <section className="border-b border-ash/10">
        <div className="max-w-7xl mx-auto px-6 py-32 lg:py-40">
          <div className="max-w-4xl">
            <h1 className="font-playfair text-5xl md:text-6xl lg:text-8xl text-off-white mb-6 leading-[1.05]">
              The Operations Diagnostic starts here.
            </h1>
            <p className="font-body text-lg md:text-xl text-ash max-w-2xl leading-relaxed">
              Book the full diagnostic, or start with a 15-minute discovery call if you want to
              talk through fit first.
            </p>
          </div>
        </div>
      </section>

      {/* Booking Selector */}
      <section className="py-16 md:py-24 px-6 lg:px-8 border-b border-ash/10">
        <div className="max-w-4xl mx-auto">
          <BookingSelector />
        </div>
      </section>

      {/* What the Diagnostic Covers */}
      <section className="py-24 md:py-32 px-6 lg:px-8 border-b border-ash/10">
        <div className="max-w-7xl mx-auto">
          <h2 className="font-playfair text-3xl md:text-4xl text-off-white mb-16 text-center">
            What the diagnostic covers.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-ash/10">
            {[
              {
                num: '01',
                title: 'Talk',
                desc: 'A free 15-minute discovery call to understand your operational challenges and confirm the Operations Diagnostic is the right starting point.',
              },
              {
                num: '02',
                title: 'Diagnostic Report',
                desc: 'A 45-minute structured conversation followed by a full report. Everything mapped. Everything prioritized. Clear next steps regardless of what comes after.',
              },
              {
                num: '03',
                title: 'Your Call',
                desc: 'Take the report and implement the changes yourself. Or partner with Okami to do it together. Either way, you leave with a clear picture of what needs to change.',
              },
            ].map((step) => (
              <div key={step.num} className="bg-dark p-8 lg:p-10 group">
                <span className="font-mono text-5xl text-ash/10 block leading-none mb-6">
                  {step.num}
                </span>
                <h3 className="font-mono text-sm tracking-wider uppercase text-off-white mb-3">
                  {step.title}
                </h3>
                <p className="font-body text-sm text-ash leading-relaxed">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Newsletter */}
      <section className="py-24 md:py-32 px-6 lg:px-8 border-b border-ash/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
            <div>
              <h2 className="font-playfair text-3xl md:text-4xl text-off-white mb-6">
                Or stay in touch without booking.
              </h2>
              <p className="font-body text-base text-ash leading-relaxed">
                The Silent Brief covers AI and automation applied to real business problems.
                Focused, no filler, respects your time. Just operational intelligence.
              </p>
            </div>
            <div>
              <NewsletterForm />
              <p className="font-mono text-xs text-ash mt-4">
                No spam. Unsubscribe anytime.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Final Note */}
      <section className="py-16 md:py-24 px-6 lg:px-8 border-b border-ash/10">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="font-playfair text-2xl md:text-3xl text-off-white mb-6">
            No contact form. No direct email.
          </h2>
          <p className="font-body text-base text-ash leading-relaxed max-w-xl mx-auto">
            The booking calendar is the only path in. Okami operates deliberately. The goal is
            fit, not volume.
          </p>
        </div>
      </section>
    </main>
  );
}
