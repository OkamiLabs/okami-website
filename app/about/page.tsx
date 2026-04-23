import type { Metadata } from 'next';
import { CTASection, Aside } from '@/components';

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
                  on top of foundations that weren&apos;t built to support them. The tools changed.
                  The underlying problems didn&apos;t. Okami exists to fix the foundation first.
                </p>

                <Aside
                  label="Context"
                  accent="burgundy"
                  closer="That shapes every system Okami builds."
                >
                  <p>
                    Okami was founded in South Florida — one of the most linguistically and
                    culturally complex business environments in the country. Businesses here
                    operate across languages, borders, and cultures at once.
                  </p>
                </Aside>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Philosophy Section — centered manifesto */}
      <section className="border-b border-ash/10 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-ash/20 via-ash/10 to-transparent" />

        <div className="max-w-3xl mx-auto px-6 py-24 lg:py-32 text-center relative">
          <div className="flex items-center justify-center gap-4 mb-10">
            <div className="w-8 h-[2px] bg-burgundy/40" />
            <span className="font-mono text-xs uppercase tracking-widest text-burgundy">
              Philosophy
            </span>
            <div className="w-8 h-[2px] bg-burgundy/40" />
          </div>

          <p className="font-playfair text-2xl md:text-3xl lg:text-4xl leading-[1.35] text-off-white mb-10">
            The best operational systems don&apos;t announce themselves.
          </p>

          <div className="space-y-6 max-w-2xl mx-auto">
            <p className="font-body text-base md:text-lg leading-[1.8] text-ash">
              They run in the background, handle the work, and stay out of the way.
              The business doesn&apos;t feel them. It just moves better because of them.
            </p>
            <p className="font-body text-base md:text-lg leading-[1.8] text-ash">
              That&apos;s what Okami builds. Not tools that demand attention or
              workflows that create new friction. Systems that make waves for the
              business without making noise.
            </p>
          </div>

          <p className="mt-12 font-playfair italic text-xl md:text-2xl text-off-white/70">
            Silent systems. Built to run.
          </p>
        </div>
      </section>

      {/* Final CTA */}
      <CTASection
        headline="Start with the Okami Review."
        subheadline="The systems you don't notice are the ones holding the business up."
        buttonText="Book your Review"
        buttonHref="/book"
        buttonVariant="consulting"
      />
    </main>
  );
}
