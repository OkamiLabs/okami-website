import type { Metadata } from 'next';
import { CTASection, Button } from '@/components';

export const metadata: Metadata = {
  title: 'Consulting',
  description:
    'Okami Consulting starts with The Okami Review — a 45-minute conversation that produces a full report on how your business runs, where it breaks, and what to prioritize.',
  openGraph: {
    title: 'Okami Consulting — The Okami Review',
    description:
      'Every engagement starts with The Okami Review. A 45-minute conversation that maps how your business runs, where it breaks, and what to fix first.',
  },
};

export default function ServicesPage() {
  return (
    <main className="min-h-screen bg-dark">
      {/* Hero Section */}
      <section className="border-b border-ash/10">
        <div className="max-w-7xl mx-auto px-6 py-32 lg:py-40">
          <div className="grid lg:grid-cols-12 gap-12 items-end">
            <div className="lg:col-span-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-[2px] bg-burgundy" />
                <span className="font-mono text-xs uppercase tracking-widest text-burgundy">
                  Okami Consulting
                </span>
              </div>
              <h1 className="font-playfair text-5xl md:text-7xl lg:text-8xl leading-[1.05] text-off-white">
                Every engagement begins with understanding what's actually happening.
              </h1>
            </div>
            <div className="lg:col-span-4">
              <p className="font-body text-base leading-relaxed text-ash">
                Okami Consulting starts where most consulting skips to the end — with what's
                actually happening. Every engagement begins with <span className="font-playfair italic text-off-white">the Okami Review</span>: a 45-minute
                conversation that produces a full report on how your business runs, where it
                breaks, and what to prioritize.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* The Okami Review — Centerpiece */}
      <section className="border-b border-ash/10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-1/3 h-full bg-gradient-to-l from-burgundy/[0.03] to-transparent pointer-events-none" />

        <div className="max-w-7xl mx-auto px-6 py-24 lg:py-32 relative">
          <div className="grid lg:grid-cols-12 gap-16">
            <div className="lg:col-span-7">
              <h2 className="font-playfair text-4xl md:text-5xl lg:text-6xl leading-[1.1] text-off-white mb-6">
                The Okami Review.
              </h2>

              <p className="font-mono text-lg text-burgundy mb-12">
                The clearest picture of how your business runs.
              </p>

              <div className="space-y-6 mb-12">
                <p className="font-body text-base leading-relaxed text-ash">
                  <span className="font-playfair italic text-off-white">The Okami Review</span> is a 45-minute structured conversation followed by a
                  full report. It maps how your business actually runs, where it breaks, and what
                  to fix first. Not what the org chart says. What actually happens.
                </p>
                <p className="font-body text-base leading-relaxed text-ash">
                  The report tells you exactly where you stand, what's working, what's breaking,
                  and what to address first. Whether that leads to process improvement, system
                  changes, or understanding where technology actually helps.
                </p>
              </div>

              <Button href="/book" variant="consulting" size="lg">
                Request Your Review
              </Button>
            </div>

            <div className="lg:col-span-5">
              <h3 className="font-mono text-xs uppercase tracking-widest text-ash mb-8">
                What's Delivered
              </h3>
              <div className="space-y-3">
                {[
                  'Operational maturity assessment across key business areas',
                  'Systems and data flow inventory with integration gap analysis',
                  'Customer journey mapping with friction point identification',
                  'Bottleneck and revenue leakage documentation',
                  'Prioritized action roadmap with implementation sequencing',
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-4 p-4 border border-ash/10 hover:border-burgundy/30 transition-colors group"
                  >
                    <span className="font-mono text-lg text-burgundy/30 group-hover:text-burgundy transition-colors flex-shrink-0 leading-tight">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <span className="font-body text-sm leading-relaxed text-ash group-hover:text-off-white transition-colors">
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              <div className="mt-8 p-5 bg-burgundy/5 border border-burgundy/10">
                <span className="font-mono text-xs uppercase tracking-widest text-burgundy block mb-2">
                  Output Format
                </span>
                <p className="font-body text-sm leading-relaxed text-ash">
                  A full report that documents findings, analysis, and next-step
                  recommendations. This becomes the baseline for everything that follows.
                  Whether that means partnering with Okami to implement the changes, or taking
                  the findings and acting on them independently.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="border-b border-ash/10">
        <div className="max-w-7xl mx-auto px-6 py-24 lg:py-32">
          <h2 className="font-playfair text-4xl md:text-5xl leading-[1.1] text-off-white mb-6">
            Three steps. No ambiguity.
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-ash/10">
            {[
              {
                num: '01',
                title: 'Talk',
                desc: 'An initial conversation to understand your operational challenges and where growth is getting stuck. This sets the scope for the Okami Review.',
              },
              {
                num: '02',
                title: 'The Okami Review',
                desc: 'A 45-minute structured conversation followed by a full report. Everything mapped. Everything prioritized. Clear next steps regardless of what comes after.',
              },
              {
                num: '03',
                title: 'Your Call',
                desc: 'Take the report and implement the changes yourself. Or partner with Okami to do it together. Either way, you leave with a clear picture of what needs to change.',
              },
            ].map((step) => (
              <div key={step.num} className="bg-dark p-8 lg:p-12 group hover:bg-burgundy/[0.03] transition-colors">
                <span className="font-mono text-7xl lg:text-8xl text-burgundy/10 group-hover:text-burgundy/20 transition-colors block leading-none mb-8">
                  {step.num}
                </span>
                <h3 className="font-mono text-xl text-off-white mb-4">{step.title}</h3>
                <p className="font-body text-sm leading-relaxed text-ash">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Areas of Focus */}
      <section className="border-b border-ash/10">
        <div className="max-w-7xl mx-auto px-6 py-24 lg:py-32">
          <div className="flex items-end justify-between mb-16 flex-wrap gap-4">
            <div>
              <h2 className="font-playfair text-4xl md:text-5xl leading-[1.1] text-off-white mb-4">
                Capability areas, not packaged services.
              </h2>
              <p className="font-body text-base text-ash max-w-xl">
                Every business has different operational needs. These are the zones where Okami
                Consulting typically engages.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-ash/10">
            {[
              {
                title: 'Workflow Optimization',
                body: 'Mapping how work actually moves through teams. Finding where handoffs fail. Removing redundant steps. Documenting processes that currently live only in individual knowledge.',
              },
              {
                title: 'Data & Integration Architecture',
                body: 'Understanding how data flows between systems. Finding integration gaps. Reducing manual data transfer. Building coherent data architectures that support operational needs instead of creating more work.',
              },
              {
                title: 'Process Documentation & Knowledge Systems',
                body: 'Capturing institutional knowledge before it walks out the door. Creating repeatable process documentation. Building internal knowledge bases. Reducing dependency on individual expertise.',
              },
              {
                title: 'Growth Readiness',
                body: 'Identifying what needs to be fixed before you can scale. Finding bottlenecks that will break under volume. Building operational foundations that can handle more without collapsing.',
              },
            ].map((area) => (
              <div key={area.title} className="bg-dark p-8 lg:p-10">
                <div className="w-8 h-[2px] bg-burgundy mb-6" />
                <h3 className="font-mono text-lg text-off-white mb-4">{area.title}</h3>
                <p className="font-body text-sm leading-relaxed text-ash">{area.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* What This Isn't */}
      <section className="border-b border-ash/10 bg-burgundy/[0.03]">
        <div className="max-w-4xl mx-auto px-6 py-24 lg:py-32">
          <h2 className="font-playfair text-4xl md:text-5xl leading-[1.1] text-off-white mb-8">
            What Okami Consulting is not.
          </h2>
          <div className="space-y-6 max-w-2xl">
            <p className="font-body text-base leading-relaxed text-ash">
              This isn't management consulting with templated frameworks and transformation
              roadmaps. It's not a pitch for proprietary software. It's not surface-level advice
              that looks good in presentations but can't be executed.
            </p>
            <p className="font-body text-base leading-relaxed text-ash">
              Okami Consulting is operational work. Detailed. Sometimes tedious. Always focused
              on fixing what's broken. The goal isn't to impress — it's to build systems that
              actually work.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <CTASection
        headline="Start with the Okami Review."
        subheadline="Fifteen minutes to talk through your workflows and see if the review is the right fit. No pitch."
        buttonText="Book your Review"
        buttonHref="/book"
        buttonVariant="consulting"
      />
    </main>
  );
}
