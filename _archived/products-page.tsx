// Archived — Products page (Okami Labs / Agent Core)
// Status: ON HOLD until products are ready to demonstrate.
// Restore by moving back to app/products/page.tsx.
// Last archived: 2026-04-07

import type { Metadata } from 'next';
import { StatusDot, CTASection } from '@/components';

export const metadata: Metadata = {
  title: 'Products | Okami Labs',
  description:
    'Okami Agent Core powers systems that handle operational workflows automatically. One unified platform that extends through configuration.',
};

export default function ProductsPage() {
  return (
    <main className="min-h-screen bg-dark">
      {/* Hero Section — asymmetric layout */}
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
              <h1 className="font-playfair text-5xl md:text-7xl lg:text-8xl leading-[1.05] text-off-white mb-8">
                One platform.
                <br />
                <span className="text-slate-blue">Multiple problems solved.</span>
              </h1>
            </div>
            <div className="lg:col-span-4">
              <p className="font-body text-base leading-relaxed text-ash">
                Okami Agent Core powers systems that handle operational workflows
                automatically. Not custom builds for every use case. One unified platform that
                extends through configuration.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Overview */}
      <section className="border-b border-ash/10">
        <div className="max-w-7xl mx-auto px-6 py-24 lg:py-32">
          <div className="grid lg:grid-cols-2 gap-16 lg:gap-24 items-start">
            <div>
              <h2 className="font-playfair text-4xl md:text-5xl lg:text-6xl leading-[1.1] text-off-white mb-8">
                Okami Agent Core.
              </h2>
              <p className="font-mono text-lg text-slate-blue mb-8">
                The foundation for every operational system.
              </p>
              <div className="space-y-6">
                <p className="font-body text-base leading-relaxed text-ash">
                  Okami Agent Core is the shared architecture that powers all operational
                  systems built by Okami Labs. Instead of creating bespoke solutions for every
                  problem, every system extends from the same core platform.
                </p>
                <p className="font-body text-base leading-relaxed text-ash">
                  Faster deployment. Consistent behavior. The ability to scale across operational
                  domains without rebuilding from scratch.
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <h3 className="font-mono text-xs uppercase tracking-widest text-ash mb-6">
                Key Characteristics
              </h3>
              {[
                { num: '01', text: 'Shared base layer with extensible configuration' },
                { num: '02', text: 'Deployable across internal ops, sales, and retention workflows' },
                { num: '03', text: 'Built for operational reliability, not technical showcase' },
                { num: '04', text: 'Designed to integrate with existing systems, not replace them' },
              ].map((item) => (
                <div
                  key={item.num}
                  className="flex items-start gap-6 p-5 border border-ash/10 hover:border-slate-blue/30 transition-colors group"
                >
                  <span className="font-mono text-2xl text-slate-blue/40 group-hover:text-slate-blue transition-colors flex-shrink-0">
                    {item.num}
                  </span>
                  <span className="font-body text-sm leading-relaxed text-ash group-hover:text-off-white transition-colors">
                    {item.text}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Architecture Diagram */}
      <section className="border-b border-ash/10 overflow-hidden">
        <div className="max-w-5xl mx-auto px-6 py-24 lg:py-32">
          <h2 className="font-playfair text-3xl md:text-4xl text-off-white mb-4 text-center">
            Platform architecture.
          </h2>
          <p className="font-body text-sm text-ash text-center mb-16 max-w-xl mx-auto">
            One shared foundation. Systems extend through configuration to solve specific
            operational problems.
          </p>

          <div className="relative">
            <div className="absolute left-1/2 top-[140px] w-px h-[60px] bg-gradient-to-b from-slate-blue/60 to-slate-blue/20 hidden md:block" />
            <div className="absolute left-1/2 top-[200px] w-[70%] h-px bg-slate-blue/20 -translate-x-1/2 hidden md:block" />
            <div className="absolute left-[15%] top-[200px] w-px h-[40px] bg-slate-blue/20 hidden md:block" />
            <div className="absolute left-[50%] top-[200px] w-px h-[40px] bg-slate-blue/20 hidden md:block" />
            <div className="absolute left-[85%] top-[200px] w-px h-[40px] bg-slate-blue/20 hidden md:block" />

            <div className="flex justify-center mb-16 md:mb-24">
              <div className="relative">
                <div className="absolute inset-0 bg-slate-blue/10 blur-xl rounded-full scale-150" />
                <div className="relative border-2 border-slate-blue bg-dark px-10 py-8 text-center">
                  <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-slate-blue block mb-2">Core</span>
                  <span className="font-mono text-base text-off-white block">Okami Agent Core</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {[
                { label: 'Internal Operations', status: 'Active' },
                { label: 'Sales & Lead Intake', status: 'Building' },
                { label: 'Customer Retention', status: 'Planned' },
              ].map((node) => (
                <div key={node.label} className="flex flex-col items-center">
                  <div className="border border-slate-blue/30 bg-slate-blue/5 px-6 py-5 text-center w-full hover:border-slate-blue/60 hover:bg-slate-blue/10 transition-all">
                    <span className="font-mono text-sm text-off-white block mb-1">{node.label}</span>
                    <span className="font-mono text-[10px] uppercase tracking-widest text-slate-blue">{node.status}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Capability Cards */}
      <section className="border-b border-ash/10">
        <div className="max-w-7xl mx-auto px-6 py-24 lg:py-32">
          <div className="flex items-end justify-between mb-16 flex-wrap gap-4">
            <h2 className="font-playfair text-4xl md:text-5xl leading-[1.1] text-off-white">
              Three capability areas.
            </h2>
            <span className="font-mono text-xs uppercase tracking-widest text-ash">One platform</span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-px bg-ash/10">
            <div className="bg-dark p-8 lg:p-10 flex flex-col group hover:bg-slate-blue/[0.03] transition-colors">
              <div className="flex items-start justify-between gap-4 mb-8">
                <span className="font-mono text-6xl lg:text-7xl text-slate-blue/15 group-hover:text-slate-blue/25 transition-colors leading-none">01</span>
                <StatusDot status="live" />
              </div>
              <h3 className="font-mono text-lg text-off-white mb-2 tracking-tight">Internal Ops System</h3>
              <p className="font-body text-sm leading-relaxed text-ash mb-8 flex-grow">
                Handles internal operational workflows — task routing, data sync, process
                orchestration, and system integration. Reduces manual administrative overhead.
                Improves cross-team coordination.
              </p>
              <div className="pt-6 border-t border-ash/10">
                <span className="font-mono text-[10px] uppercase tracking-widest text-slate-blue">Powered by Okami Agent Core</span>
              </div>
            </div>

            <div className="bg-dark p-8 lg:p-10 flex flex-col group hover:bg-slate-blue/[0.03] transition-colors">
              <div className="flex items-start justify-between gap-4 mb-8">
                <span className="font-mono text-6xl lg:text-7xl text-slate-blue/15 group-hover:text-slate-blue/25 transition-colors leading-none">02</span>
                <StatusDot status="in-development" />
              </div>
              <h3 className="font-mono text-lg text-off-white mb-2 tracking-tight">Sales Intake System</h3>
              <p className="font-body text-sm leading-relaxed text-ash mb-8 flex-grow">
                Handles inbound lead qualification, meeting scheduling, CRM data entry, and
                follow-up sequencing. Works as the first layer of sales operations. No lead falls
                through the cracks.
              </p>
              <div className="pt-6 border-t border-ash/10">
                <span className="font-mono text-[10px] uppercase tracking-widest text-slate-blue">Powered by Okami Agent Core</span>
              </div>
            </div>

            <div className="bg-dark p-8 lg:p-10 flex flex-col group hover:bg-slate-blue/[0.03] transition-colors">
              <div className="flex items-start justify-between gap-4 mb-8">
                <span className="font-mono text-6xl lg:text-7xl text-slate-blue/15 group-hover:text-slate-blue/25 transition-colors leading-none">03</span>
                <div className="inline-flex items-center gap-2">
                  <div className="relative flex items-center justify-center">
                    <div className="w-2 h-2 rounded-full bg-slate-blue z-10" />
                    <div className="absolute w-2 h-2 rounded-full bg-slate-blue/50 animate-ping" />
                  </div>
                  <span className="font-mono text-xs tracking-wider uppercase text-ash">Planned</span>
                </div>
              </div>
              <h3 className="font-mono text-lg text-off-white mb-2 tracking-tight">Retention System</h3>
              <p className="font-body text-sm leading-relaxed text-ash mb-8 flex-grow">
                Monitors customer engagement signals, triggers proactive outreach, manages renewal
                workflows, and surfaces churn risk. Keeps customer relationships active without
                manual tracking.
              </p>
              <div className="pt-6 border-t border-ash/10">
                <span className="font-mono text-[10px] uppercase tracking-widest text-slate-blue">Powered by Okami Agent Core</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Platform Benefits */}
      <section className="border-b border-ash/10">
        <div className="max-w-7xl mx-auto px-6 py-24 lg:py-32">
          <h2 className="font-playfair text-4xl md:text-5xl leading-[1.1] text-off-white mb-16">
            Why a platform approach matters.
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-ash/10">
            {[
              { title: 'Faster Deployment', body: 'Every system extends from the same core architecture. New capability areas deploy faster. No starting from scratch.' },
              { title: 'Operational Consistency', body: 'Shared architecture means consistent behavior, easier maintenance, and reduced complexity across deployed systems.' },
              { title: 'Scalability Without Rebuilding', body: 'As operational needs expand, new systems can be configured and deployed without re-architecting the underlying platform.' },
            ].map((b) => (
              <div key={b.title} className="bg-dark p-8 lg:p-10">
                <div className="w-12 h-[2px] bg-slate-blue mb-8" />
                <h3 className="font-mono text-lg text-off-white mb-4">{b.title}</h3>
                <p className="font-body text-sm leading-relaxed text-ash">{b.body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <CTASection
        headline="See what's being built."
        subheadline="Okami Agent Core is live and running real operational workflows. Learn more about deployment timelines and capability roadmaps."
        buttonText="Explore What We're Building"
        buttonHref="/building"
      />
    </main>
  );
}
