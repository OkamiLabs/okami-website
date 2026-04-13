import type { Metadata } from 'next';
import { HeroSection, Card, CTASection, FadeIn, NewsletterForm } from '@/components';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'The Silent Giant Behind Modern Business',
  description:
    'Every business is being told to adopt AI. Most aren\'t ready for it. Okami works in that gap — fixing the operational foundations before adding new technology on top.',
  openGraph: {
    title: 'Okami Labs — The Silent Giant Behind Modern Business',
    description:
      'Every business is being told to adopt AI. Most aren\'t ready for it. Okami works in that gap — fixing the operational foundations before adding new technology on top.',
  },
};

export default function Home() {
  return (
    <main>
      {/* Hero Section */}
      <HeroSection />

      {/* Problem Section */}
      <section id="problem" className="py-24 md:py-32 px-6 lg:px-8 border-t border-ash/10">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-12 gap-12 lg:gap-16">
          <div className="lg:col-span-5">
            <h2 className="font-playfair text-4xl md:text-5xl lg:text-6xl text-off-white leading-tight">
              The tools are ready. The operations aren't.
            </h2>
          </div>
          <div className="lg:col-span-7 font-body text-base md:text-lg text-ash leading-relaxed space-y-6">
            <p>
              Every business is being told to adopt AI. Most aren't ready for it.
            </p>
            <p>
              Not because the technology is wrong. Because the operations underneath can't
              support it. Broken handoffs, scattered data, processes that live in someone's
              head. These don't disappear when you add new tools. They get faster and more
              expensive.
            </p>
            <p>
              Okami works in that gap.
            </p>
          </div>
        </div>
      </section>

      {/* Two Arms Section */}
      <section className="py-24 md:py-32 px-6 lg:px-8 border-t border-ash/10">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-end justify-between mb-16 flex-wrap gap-4">
            <h2 className="font-playfair text-3xl md:text-4xl lg:text-5xl text-off-white">
              Two ways to work with Okami.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-px bg-ash/10">
            <Card
              tag="Consulting"
              title="Understand what needs fixing."
              description="Okami Consulting works with businesses to build the operational foundations for growth. Every engagement starts with the Operations Diagnostic. From there, the work begins."
              href="/services"
              linkText="Learn about Consulting"
              accent="burgundy"
            />
            <Card
              tag="Labs"
              title="Build systems that handle the work."
              description="Okami Labs works with businesses to build the operational systems they need to scale. Systems that run quietly and handle the work without adding friction. Every one built on Okami Agent Core."
              href="/building"
              linkText="Explore the Platform"
              accent="slate-blue"
            />
          </div>
        </div>
      </section>

      {/* Operations Diagnostic Callout */}
      <section className="py-24 md:py-32 px-6 lg:px-8 border-t border-ash/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-burgundy/[0.04] to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto relative">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            <div className="lg:col-span-7">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-8 h-[2px] bg-burgundy" />
                <span className="font-mono text-xs uppercase tracking-widest text-burgundy">
                  Starting Point
                </span>
              </div>
              <h2 className="font-playfair text-3xl md:text-4xl lg:text-5xl text-off-white mb-6 leading-tight">
                Every engagement starts here.
              </h2>
              <p className="font-body text-base md:text-lg text-ash leading-relaxed mb-8">
                The Operations Diagnostic is a 45-minute structured conversation followed by a
                full report. It shows how your business actually runs and where it breaks. That
                report becomes the foundation for everything that follows.
              </p>
              <Link
                href="/services"
                className="inline-flex items-center gap-2 font-mono text-sm tracking-wider uppercase text-burgundy hover:text-off-white transition-colors group"
              >
                <span>See How It Works</span>
                <svg
                  className="w-4 h-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>

            <div className="lg:col-span-5">
              <div className="border border-burgundy/20 bg-burgundy/[0.03] p-8">
                <span className="font-mono text-[10px] uppercase tracking-widest text-burgundy block mb-6">
                  What You Get
                </span>
                {[
                  'Operational maturity assessment',
                  'Systems & data flow inventory',
                  'Customer journey mapping',
                  'Bottleneck documentation',
                  'Prioritized action roadmap',
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-3 py-3 border-b border-ash/5 last:border-0">
                    <span className="font-mono text-xs text-burgundy/40">{String(i + 1).padStart(2, '0')}</span>
                    <span className="font-body text-sm text-ash">{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Credibility Section */}
      <section className="py-24 md:py-32 px-6 lg:px-8 border-t border-ash/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
            <div className="lg:col-span-5">
              <h2 className="font-playfair text-3xl md:text-4xl text-off-white mb-6 leading-tight">
                Built on experience across both sides of a business.
              </h2>
              <Link
                href="/about"
                className="inline-flex items-center gap-2 font-mono text-sm tracking-wider uppercase text-ash hover:text-off-white transition-colors group"
              >
                <span>Read the Full Story</span>
                <svg
                  className="w-4 h-4 transition-transform group-hover:translate-x-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
                </svg>
              </Link>
            </div>

            <div className="lg:col-span-7">
              <div className="space-y-6">
                <p className="font-body text-base md:text-lg text-ash leading-relaxed">
                  Okami was founded by someone with experience in web development and IT
                  operations. One is about building systems from the ground up. The other is
                  about understanding how those systems live inside a real business, day to day.
                  That combination shapes every engagement.
                </p>
                <p className="font-body text-base md:text-lg text-ash leading-relaxed">
                  Building something technically sound is one thing. Building something that fits
                  how a business actually runs, with the people and workflows already in place,
                  is another. Okami approaches every engagement with both questions active from
                  the start.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Anchor */}
      <section className="py-32 md:py-48 lg:py-64 px-6 lg:px-8 border-t border-ash/10">
        <FadeIn className="max-w-5xl mx-auto">
          <blockquote className="text-center">
            <p className="font-playfair text-4xl md:text-5xl lg:text-7xl text-off-white leading-[1.2] italic">
              "Every business is adding technology to get ahead. The ones pulling ahead are
              fixing what's underneath first."
            </p>
          </blockquote>
        </FadeIn>
      </section>

      {/* Newsletter Section */}
      <section className="py-24 md:py-32 px-6 lg:px-8 border-t border-ash/10">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
            <div>
              <h2 className="font-playfair text-4xl md:text-5xl leading-[1.1] text-off-white mb-6">
                Not ready to book yet?
              </h2>
              <p className="font-body text-base leading-relaxed text-ash">
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

      {/* Final CTA */}
      <CTASection
        headline="Start with a conversation."
        subheadline="Start with a free 15-minute discovery call to talk through what's slowing you down and whether the Operations Diagnostic is the right next step."
        buttonText="Book Your Consultation"
        buttonHref="/contact"
      />
    </main>
  );
}
