import type { Metadata } from 'next';
import { StatusDot, CTASection, NewsletterForm } from '@/components';

export const metadata: Metadata = {
  title: "What We're Building",
  description:
    'Systems built to solve specific operational problems — removing bottlenecks, recovering lost time, and closing gaps that businesses typically patch with manual effort.',
  openGraph: {
    title: "What We're Building — Okami Labs",
    description:
      'AI-powered operational systems built on Okami Agent Core. Removing bottlenecks, recovering lost time, closing gaps businesses patch with manual effort.',
  },
};

export default function BuildingPage() {
  return (
    <main className="min-h-screen bg-dark">
      {/* Hero Section */}
      <section className="border-b border-ash/10">
        <div className="max-w-7xl mx-auto px-6 py-32 lg:py-40">
          <div className="grid lg:grid-cols-12 gap-12 items-end">
            <div className="lg:col-span-8">
              <div className="flex items-center gap-4 mb-8">
                <div className="w-12 h-[2px] bg-slate-blue" />
                <span className="font-mono text-xs uppercase tracking-widest text-slate-blue">
                  Okami Labs
                </span>
              </div>
              <h1 className="font-playfair text-5xl md:text-7xl lg:text-8xl leading-[1.05] text-off-white">
                Business outcomes, not technical details.
              </h1>
            </div>
            <div className="lg:col-span-4">
              <p className="font-body text-base leading-relaxed text-ash">
                These are systems built to solve specific operational problems — the kind that
                show up in almost every <span className="font-playfair">Okami Review</span>. Each one removes a bottleneck, recovers lost
                time, or closes a gap that businesses typically patch with manual effort.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Status Overview */}
      <section className="border-b border-ash/10">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-ash/10">
            <div className="bg-dark p-6 flex items-center gap-4">
              <div className="w-3 h-3 rounded-full bg-green-500 flex-shrink-0" />
              <div>
                <span className="font-mono text-sm text-off-white block">Internal Operations</span>
                <span className="font-mono text-xs text-ash">Live</span>
              </div>
            </div>
            <div className="bg-dark p-6 flex items-center gap-4">
              <div className="w-3 h-3 rounded-full bg-slate-blue flex-shrink-0" />
              <div>
                <span className="font-mono text-sm text-off-white block">Sales & Lead Intake</span>
                <span className="font-mono text-xs text-ash">In Development</span>
              </div>
            </div>
            <div className="bg-dark p-6 flex items-center gap-4">
              <div className="w-3 h-3 rounded-full bg-slate-blue/40 flex-shrink-0" />
              <div>
                <span className="font-mono text-sm text-off-white block">Customer Retention</span>
                <span className="font-mono text-xs text-ash">Planned — Q3 2026</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Scenario 1: Internal Operations */}
      <section className="border-b border-ash/10">
        <div className="max-w-7xl mx-auto px-6 py-24 lg:py-32">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
            <div className="lg:col-span-5">
              <div className="flex items-center gap-3 mb-6">
                <StatusDot status="live" />
              </div>
              <h3 className="font-playfair text-3xl md:text-4xl lg:text-5xl leading-[1.1] text-off-white mb-6">
                An operations manager needs task handoffs to happen without chasing people down.
              </h3>
              <span className="font-mono text-xs uppercase tracking-widest text-slate-blue">
                Internal Ops System
              </span>
            </div>

            <div className="lg:col-span-7">
              <div className="grid md:grid-cols-3 gap-px bg-ash/10">
                <div className="bg-dark p-6">
                  <span className="font-mono text-xs uppercase tracking-widest text-slate-blue block mb-4">Problem</span>
                  <p className="font-body text-sm leading-relaxed text-ash">
                    Tasks between departments require manual coordination — emails, Slack
                    messages, status checks. Work falls through the cracks. No one has full
                    visibility into what's pending or blocked.
                  </p>
                </div>
                <div className="bg-dark p-6">
                  <span className="font-mono text-xs uppercase tracking-widest text-slate-blue block mb-4">Solution</span>
                  <p className="font-body text-sm leading-relaxed text-ash">
                    Internal Ops System monitors task queues, routes assignments based on
                    predefined rules, syncs status across systems, and surfaces blockers before
                    they become urgent.
                  </p>
                </div>
                <div className="bg-dark p-6">
                  <span className="font-mono text-xs uppercase tracking-widest text-slate-blue block mb-4">Outcome</span>
                  <p className="font-body text-sm leading-relaxed text-ash">
                    Faster task completion. Fewer missed handoffs. Operations manager gets
                    real-time dashboards instead of hunting for updates.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Scenario 2: Sales Lead Intake */}
      <section className="border-b border-ash/10 bg-slate-blue/[0.02]">
        <div className="max-w-7xl mx-auto px-6 py-24 lg:py-32">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
            <div className="lg:col-span-7 lg:order-1">
              <div className="grid md:grid-cols-3 gap-px bg-ash/10">
                <div className="bg-dark p-6">
                  <span className="font-mono text-xs uppercase tracking-widest text-slate-blue block mb-4">Problem</span>
                  <p className="font-body text-sm leading-relaxed text-ash">
                    Every inbound lead requires manual review — reading the inquiry, checking
                    qualification criteria, scheduling a call, entering data into the CRM.
                    High-value leads wait too long for response.
                  </p>
                </div>
                <div className="bg-dark p-6">
                  <span className="font-mono text-xs uppercase tracking-widest text-slate-blue block mb-4">Solution</span>
                  <p className="font-body text-sm leading-relaxed text-ash">
                    Sales Intake System evaluates incoming leads, applies qualification logic,
                    books meetings directly on available calendars, and populates CRM records
                    with structured data.
                  </p>
                </div>
                <div className="bg-dark p-6">
                  <span className="font-mono text-xs uppercase tracking-widest text-slate-blue block mb-4">Outcome</span>
                  <p className="font-body text-sm leading-relaxed text-ash">
                    Response time drops from hours to minutes. Sales reps spend time on calls,
                    not admin. No lead sits unaddressed.
                  </p>
                </div>
              </div>
            </div>

            <div className="lg:col-span-5 lg:order-2">
              <div className="flex items-center gap-3 mb-6">
                <StatusDot status="in-development" />
              </div>
              <h3 className="font-playfair text-3xl md:text-4xl lg:text-5xl leading-[1.1] text-off-white mb-6">
                A sales team needs inbound leads qualified and routed without manual triage.
              </h3>
              <span className="font-mono text-xs uppercase tracking-widest text-slate-blue">
                Sales Intake System
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* Scenario 3: Customer Retention */}
      <section className="border-b border-ash/10">
        <div className="max-w-7xl mx-auto px-6 py-24 lg:py-32">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-16">
            <div className="lg:col-span-5">
              <div className="flex items-center gap-3 mb-6">
                <div className="inline-flex items-center gap-2">
                  <div className="relative flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-slate-blue z-10" />
                    <div className="absolute w-2 h-2 rounded-full bg-slate-blue/50 animate-ping" />
                  </div>
                  <span className="font-mono text-xs tracking-wider uppercase text-ash">
                    Planned — Q3 2026
                  </span>
                </div>
              </div>
              <h3 className="font-playfair text-3xl md:text-4xl lg:text-5xl leading-[1.1] text-off-white mb-6">
                A customer success team needs proactive outreach triggered by engagement signals.
              </h3>
              <span className="font-mono text-xs uppercase tracking-widest text-slate-blue">
                Retention System
              </span>
            </div>

            <div className="lg:col-span-7">
              <div className="grid md:grid-cols-3 gap-px bg-ash/10">
                <div className="bg-dark p-6">
                  <span className="font-mono text-xs uppercase tracking-widest text-slate-blue block mb-4">Problem</span>
                  <p className="font-body text-sm leading-relaxed text-ash">
                    Customer churn happens quietly. Usage drops, engagement fades, renewal
                    conversations happen too late. Success teams don't have bandwidth to monitor
                    every account manually.
                  </p>
                </div>
                <div className="bg-dark p-6">
                  <span className="font-mono text-xs uppercase tracking-widest text-slate-blue block mb-4">Solution</span>
                  <p className="font-body text-sm leading-relaxed text-ash">
                    Retention System tracks engagement metrics, identifies decline patterns,
                    triggers personalized check-in sequences, and surfaces at-risk accounts for
                    human intervention.
                  </p>
                </div>
                <div className="bg-dark p-6">
                  <span className="font-mono text-xs uppercase tracking-widest text-slate-blue block mb-4">Outcome</span>
                  <p className="font-body text-sm leading-relaxed text-ash">
                    Churn signals caught early. Renewal conversations happen proactively.
                    Customer success scales without headcount growth.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Technical Transparency */}
      <section className="border-b border-ash/10">
        <div className="max-w-4xl mx-auto px-6 py-24 lg:py-32 text-center">
          <h2 className="font-playfair text-3xl md:text-4xl text-off-white mb-8">
            What's under the hood.
          </h2>
          <p className="font-body text-base leading-relaxed text-ash mb-4 max-w-2xl mx-auto">
            Every scenario above is powered by Okami Agent Core — the shared architecture that
            handles task orchestration, data integration, and decision logic. These systems
            don't replace people. They handle repetitive operational workflows so teams can
            focus on high-judgment work.
          </p>
          <p className="font-body text-base leading-relaxed text-ash max-w-2xl mx-auto">
            Technical implementation details aren't the point. Operational reliability and
            measurable business outcomes are.
          </p>
        </div>
      </section>

      {/* Newsletter */}
      <section className="border-b border-ash/10">
        <div className="max-w-7xl mx-auto px-6 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-12 lg:gap-24 items-center">
            <div>
              <h2 className="font-playfair text-4xl md:text-5xl leading-[1.1] text-off-white mb-6">
                Stay updated on what's shipping.
              </h2>
              <p className="font-body text-base leading-relaxed text-ash">
                Get The Operator&apos;s Blueprint — the same scorecard framework Okami uses in every
                <span className="font-playfair"> Okami Review</span>. Plus ongoing updates on new capabilities and lessons from
                building operational systems in production.
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
        headline="Ready to put a system to work?"
        subheadline="Every Labs engagement starts with the Okami Review — so what gets built fits the business that's actually there."
        buttonText="Book a Consultation"
        buttonHref="/contact"
      />
    </main>
  );
}
