import type { Metadata } from 'next';
import { CTASection, Button } from '@/components';

export const metadata: Metadata = {
  title: 'Products — Okami Labs',
  description:
    'Okami Labs is the build arm of Okami. Where Okami Consulting diagnoses, Okami Labs constructs. Every Okami Labs engagement starts with the Okami Review.',
  openGraph: {
    title: 'Okami Labs — Products',
    description:
      'Okami Labs builds operational systems for businesses whose work keeps expanding while the returns flatten. Every engagement starts with the Okami Review.',
  },
};

export default function ProductsPage() {
  return (
    <main className="min-h-screen bg-dark">
      {/* Hero */}
      <section className="border-b border-ash/10">
        <div className="max-w-7xl mx-auto px-6 py-32 lg:py-40">
          <div className="max-w-4xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-[2px] bg-slate-blue" />
              <span className="font-mono text-xs uppercase tracking-widest text-slate-blue">
                Okami Labs
              </span>
            </div>
            <h1 className="font-playfair text-5xl md:text-7xl lg:text-8xl leading-[1.05] text-off-white mb-10">
              You&apos;re working harder than the business is growing.
            </h1>
            <div className="space-y-6 max-w-2xl mb-12">
              <p className="font-body text-lg md:text-xl leading-relaxed text-ash">
                More revenue. More hours. More tools. Same margins, or worse. The work keeps
                expanding while the returns flatten.
              </p>
              <p className="font-body text-lg md:text-xl leading-relaxed text-ash">
                The gap between effort and outcome is not a motivation problem. It is a system
                problem. And systems are fixable.
              </p>
            </div>
            <Button href="/book" variant="primary" size="lg">
              Book your Review
            </Button>
            <p className="mt-8 font-playfair italic text-base md:text-lg text-off-white/70">
              Okami Labs ships what Okami Labs runs.
            </p>
          </div>
        </div>
      </section>

      {/* The Mountain */}
      <section className="border-b border-ash/10">
        <div className="max-w-7xl mx-auto px-6 py-24 lg:py-32">
          <div className="grid lg:grid-cols-12 gap-16">
            <div className="lg:col-span-4">
              <h2 className="font-playfair text-4xl md:text-5xl leading-[1.1] text-off-white mb-6">
                The mountain.
              </h2>
              <div className="w-12 h-[2px] bg-slate-blue/40" />
            </div>

            <div className="lg:col-span-8">
              <p className="font-body text-base md:text-lg leading-[1.8] text-ash mb-12 max-w-2xl">
                Most owners running a growing business can name the friction without being asked.
                It sounds like this:
              </p>

              <div className="max-w-2xl divide-y divide-ash/10 border-y border-ash/10">
                {[
                  {
                    num: '01',
                    title: 'Everything routes through one person.',
                    body: 'Decisions, approvals, customer questions, the things nobody else knows how to handle. The business works because the owner is in every loop.',
                    icon: (
                      <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="square">
                        <circle cx="20" cy="20" r="3" />
                        <circle cx="6" cy="6" r="2" />
                        <circle cx="34" cy="6" r="2" />
                        <circle cx="6" cy="34" r="2" />
                        <circle cx="34" cy="34" r="2" />
                        <path d="M20 17 L7 7 M20 17 L33 7 M20 23 L7 33 M20 23 L33 33" />
                      </svg>
                    ),
                  },
                  {
                    num: '02',
                    title: 'Tools were supposed to help.',
                    body: 'Instead there is a stack of subscriptions, a few automations that half-work, data in five places, and nobody sure which system is the source of truth.',
                    icon: (
                      <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="square">
                        <rect x="4" y="12" width="18" height="14" />
                        <rect x="12" y="6" width="18" height="14" />
                        <rect x="20" y="18" width="16" height="14" />
                      </svg>
                    ),
                  },
                  {
                    num: '03',
                    title: "The team is busy. The output isn't proportional.",
                    body: 'Work gets done. Things still fall through. Handoffs between people or departments lose information every time.',
                    icon: (
                      <svg viewBox="0 0 40 40" fill="none" stroke="currentColor" strokeWidth="1.25" strokeLinecap="square">
                        <rect x="3" y="14" width="12" height="12" />
                        <rect x="25" y="14" width="12" height="12" />
                        <path d="M15 20 L19 20 M23 20 L25 20" strokeDasharray="1 3" />
                        <path d="M21 17 L25 20 L21 23" />
                      </svg>
                    ),
                  },
                ].map((item) => (
                  <div key={item.num} className="grid grid-cols-[auto_1fr] gap-6 py-8">
                    <div className="flex flex-col items-center gap-4">
                      <span className="font-mono text-xs tracking-widest text-slate-blue/70">
                        {item.num}
                      </span>
                      <div className="w-10 h-10 text-slate-blue/50">{item.icon}</div>
                    </div>
                    <div>
                      <h3 className="font-playfair text-xl text-off-white mb-3">
                        {item.title}
                      </h3>
                      <p className="font-body text-base leading-[1.8] text-ash">{item.body}</p>
                    </div>
                  </div>
                ))}
              </div>

              <p className="font-body text-base md:text-lg leading-[1.8] text-ash mt-12 max-w-2xl">
                None of this is a sign of a bad business. It is a sign of a business that outgrew
                its original structure and hasn&apos;t rebuilt yet.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Most AI Experiments Didn't Stick */}
      <section className="border-b border-ash/10 bg-slate-blue/[0.02]">
        <div className="max-w-7xl mx-auto px-6 py-24 lg:py-32">
          <div className="max-w-3xl mb-16">
            <h2 className="font-playfair text-4xl md:text-5xl leading-[1.1] text-off-white mb-6">
              Why most AI experiments didn&apos;t stick.
            </h2>
            <div className="w-12 h-[2px] bg-slate-blue/40 mb-8" />
            <p className="font-body text-base md:text-lg leading-[1.8] text-ash">
              The businesses that tried AI first and operations second usually have a story to
              tell. It rarely ends well. The research explains why.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-ash/10 mb-16">
            {[
              {
                stat: '10–25%',
                label: 'Productivity gain from foundation work alone',
                body: 'Cleaning up processes, handoffs, and data flow before any AI is introduced. No model, agent, or automation required. The structure itself is the leverage.',
                source: 'Cadre AI',
              },
              {
                stat: '38%',
                label: 'Of small businesses already using AI',
                body: 'Most without a structural plan behind the adoption. The tools arrived. The returns didn’t follow. The problem wasn’t the AI. The problem was underneath it.',
                source: 'Verizon',
              },
              {
                stat: '$250k–$1M',
                label: 'Typical full AI implementation cost',
                body: 'Businesses that skip the foundation tend to spend that money twice. Once on the first attempt, and again on the rebuild when the first attempt collapses.',
                source: 'PwC',
              },
            ].map((card) => (
              <div key={card.source} className="bg-dark p-8 lg:p-10 flex flex-col">
                <div className="w-8 h-[2px] bg-slate-blue mb-6" />
                <div className="font-playfair text-4xl md:text-5xl text-off-white mb-3 leading-none">
                  {card.stat}
                </div>
                <div className="font-mono text-xs uppercase tracking-widest text-slate-blue/80 mb-6">
                  {card.label}
                </div>
                <p className="font-body text-sm leading-relaxed text-ash mb-6 flex-1">
                  {card.body}
                </p>
                <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-ash/50">
                  Source — {card.source}
                </div>
              </div>
            ))}
          </div>

          <p className="font-playfair italic text-2xl md:text-3xl leading-relaxed text-off-white text-center max-w-2xl mx-auto">
            Operations first. AI second, if at all.
          </p>
        </div>
      </section>

      {/* What Okami Labs Is */}
      <section className="border-b border-ash/10">
        <div className="max-w-3xl mx-auto px-6 py-24 lg:py-32 text-center">
          <div className="flex items-center justify-center gap-4 mb-8">
            <div className="w-8 h-[2px] bg-slate-blue/40" />
            <span className="font-mono text-xs uppercase tracking-widest text-slate-blue">
              What Okami Labs is
            </span>
            <div className="w-8 h-[2px] bg-slate-blue/40" />
          </div>

          <p className="font-playfair text-2xl md:text-3xl leading-[1.4] text-off-white mb-10">
            The build arm of Okami. Where Okami Consulting diagnoses,
            Okami Labs constructs.
          </p>

          <div className="space-y-6 max-w-2xl mx-auto">
            <p className="font-body text-base md:text-lg leading-[1.8] text-ash">
              The two arms operate independently, but Okami Labs only builds what a Review has
              validated is worth building, because the fastest way to waste money on a system is
              to build one the business wasn&apos;t ready for.
            </p>
            <p className="font-body text-base md:text-lg leading-[1.8] text-ash">
              Built by a founder who came up through web development and IT operations. The agent
              infrastructure Okami Labs builds for clients is the same infrastructure running
              Okami&apos;s own operations.
            </p>
          </div>
        </div>
      </section>

      {/* What Okami Labs Builds */}
      <section className="border-b border-ash/10">
        <div className="max-w-7xl mx-auto px-6 py-24 lg:py-32">
          <div className="grid lg:grid-cols-12 gap-16 mb-16">
            <div className="lg:col-span-4">
              <h2 className="font-playfair text-4xl md:text-5xl leading-[1.1] text-off-white mb-6">
                What Okami Labs builds.
              </h2>
              <div className="w-12 h-[2px] bg-slate-blue/40" />
            </div>
            <div className="lg:col-span-8">
              <p className="font-body text-base md:text-lg leading-[1.8] text-ash max-w-2xl">
                When a Review surfaces something worth building, Okami Labs is the arm that builds
                it. These are the patterns that come up most often:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-ash/10 mb-16">
            {[
              {
                title: 'The owner-in-every-loop pattern.',
                body: 'Internal coordination systems that route work, track handoffs, and surface blockers without a person having to chase status. Common after Reviews that reveal the owner has become the coordination layer.',
              },
              {
                title: 'The slow-inbound pattern.',
                body: 'Lead intake systems that qualify, route, and book meetings without manual triage. Common for businesses losing deals to response-time gaps.',
              },
              {
                title: 'The quiet-churn pattern.',
                body: 'Retention systems that watch for engagement decline and trigger outreach before customers disappear. Common for service businesses with recurring revenue and no structured renewal process.',
              },
            ].map((pattern) => (
              <div key={pattern.title} className="bg-dark p-8 lg:p-10">
                <div className="w-8 h-[2px] bg-slate-blue mb-6" />
                <h3 className="font-playfair text-xl text-off-white mb-4">{pattern.title}</h3>
                <p className="font-body text-sm leading-relaxed text-ash">{pattern.body}</p>
              </div>
            ))}
          </div>

          <div className="max-w-2xl mx-auto text-center space-y-4">
            <p className="font-body text-base md:text-lg leading-[1.8] text-ash">
              Each build is scoped to what the Review uncovered. No pre-built packages. No shelf
              products.
            </p>
            <p className="font-body text-base md:text-lg leading-[1.8] text-off-white">
              Every Okami Labs engagement starts with the Okami Review.
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <CTASection
        headline="Silent systems, built to run."
        buttonText="Book your Review"
        buttonHref="/book"
      />
    </main>
  );
}
