import type { Metadata } from 'next';
import { CTASection } from '@/components';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Okami was built on one observation: every business has operations running underneath it. Most were never built to scale. That gap is where everything breaks.',
  openGraph: {
    title: 'About Okami Labs',
    description:
      'Okami was built on one observation: every business has operations running underneath it. Most were never built to scale.',
  },
};

export default function AboutPage() {
  return (
    <main className="min-h-screen bg-dark">
      {/* Hero Section */}
      <section className="border-b border-ash/10">
        <div className="max-w-7xl mx-auto px-6 py-32 lg:py-40">
          <div className="max-w-4xl">
            <h1 className="font-playfair text-5xl md:text-7xl lg:text-8xl leading-[1.05] text-off-white mb-8">
              Okami was built on one observation.
            </h1>
            <p className="font-body text-lg md:text-xl leading-relaxed text-ash max-w-2xl">
              Every business has operations running underneath it. Most were never built to
              scale. That gap is where everything breaks.
            </p>
          </div>
        </div>
      </section>

      {/* Founder Story */}
      <section className="border-b border-ash/10">
        <div className="max-w-7xl mx-auto px-6 py-24 lg:py-32">
          <div className="grid lg:grid-cols-12 gap-16">
            <div className="lg:col-span-4">
              <h2 className="font-playfair text-4xl md:text-5xl leading-[1.1] text-off-white mb-6">
                The story behind the work.
              </h2>
              <div className="w-12 h-[2px] bg-ash/30" />
            </div>

            <div className="lg:col-span-8">
              <div className="space-y-8 max-w-2xl">
                <p className="font-body text-base leading-[1.8] text-ash">
                  Okami was founded by someone who came up through web development and IT
                  operations. Across every business, the same pattern repeated. New tools added
                  on top of foundations that weren't built to support them. The tools changed.
                  The underlying problems didn't. Okami exists to fix the foundation first.
                </p>
                <p className="font-body text-base leading-[1.8] text-ash">
                  Growing up in South Florida, one of the most linguistically and culturally
                  diverse business environments in the country, shaped how Okami builds systems.
                  Many businesses operate across languages and cultures every day. Okami was
                  built inside one of those environments. The systems reflect that.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section */}
      <section className="border-b border-ash/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-ash/20 via-ash/10 to-transparent" />

        <div className="max-w-7xl mx-auto px-6 py-24 lg:py-32">
          <div className="grid lg:grid-cols-12 gap-16">
            <div className="lg:col-span-4">
              <h2 className="font-playfair text-4xl md:text-5xl leading-[1.1] text-off-white mb-6">
                Silent Systems.
              </h2>
              <div className="w-12 h-[2px] bg-ash/30" />
            </div>

            <div className="lg:col-span-8">
              <div className="space-y-8 max-w-2xl">
                <p className="font-body text-base leading-[1.8] text-ash">
                  The best operational systems don't announce themselves. They run in the
                  background, handle the work, and stay out of the way. The business doesn't
                  feel them. It just moves better because of them.
                </p>
                <p className="font-body text-base leading-[1.8] text-ash">
                  That's what Okami builds. Not tools that demand attention or workflows that
                  create new friction. Systems that make waves for the business without making
                  noise.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <CTASection
        headline="The starting point is the Operations Diagnostic."
        subheadline="A 45-minute conversation that produces a full picture of how your business runs, where it breaks, and what to fix first."
        buttonText="Book Your Diagnostic"
        buttonHref="/contact"
        buttonVariant="secondary"
      />
    </main>
  );
}
