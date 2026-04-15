import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms of Service',
  description:
    'Terms of Service for Okami Consulting LLC. Service terms, intellectual property, liability, and governing law.',
  openGraph: {
    title: 'Terms of Service — Okami Labs',
    description:
      'Terms of Service for Okami Consulting LLC. Service terms, intellectual property, liability, and governing law.',
  },
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-dark">
      {/* Hero */}
      <section className="border-b border-ash/10">
        <div className="max-w-7xl mx-auto px-6 py-32 lg:py-40">
          <div className="max-w-4xl">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-12 h-[2px] bg-ash/30" />
              <span className="font-mono text-xs uppercase tracking-widest text-ash">
                Legal
              </span>
            </div>
            <h1 className="font-playfair text-5xl md:text-7xl lg:text-8xl leading-[1.05] text-off-white mb-8">
              Terms &amp; Conditions
            </h1>
            <div className="flex flex-col sm:flex-row gap-6 font-mono text-xs uppercase tracking-widest text-ash/60">
              <span>Effective: January 1, 2025</span>
              <span className="hidden sm:block">·</span>
              <span>Last Updated: April 2026</span>
            </div>
          </div>
        </div>
      </section>

      {/* Intro */}
      <section className="border-b border-ash/10">
        <div className="max-w-4xl mx-auto px-6 py-24 lg:py-32">
          <p className="font-body text-lg leading-[1.8] text-ash max-w-2xl">
            By using okamilabs.com or engaging with Okami Consulting LLC services,
            you agree to the following terms. If you do not agree, do not use the
            site or services.
          </p>
        </div>
      </section>

      {/* Sections */}
      <section className="border-b border-ash/10">
        <div className="max-w-4xl mx-auto px-6 py-24 lg:py-32 space-y-24">

          {/* 1. Services */}
          <div>
            <h2 className="font-playfair text-3xl md:text-4xl leading-[1.1] text-off-white mb-4">
              1. Services
            </h2>
            <div className="w-12 h-[2px] bg-ash/20 mb-8" />
            <p className="font-body text-base leading-[1.8] text-ash">
              Okami Consulting LLC provides operations consulting, business automation
              strategy, custom software development, and access to diagnostic tools and
              digital resources. Services evolve, but always follow a systems-first,
              results-driven approach.
            </p>
          </div>

          {/* 2. Client Responsibilities */}
          <div>
            <h2 className="font-playfair text-3xl md:text-4xl leading-[1.1] text-off-white mb-4">
              2. Client Responsibilities
            </h2>
            <div className="w-12 h-[2px] bg-ash/20 mb-8" />
            <p className="font-body text-base leading-[1.8] text-ash">
              Clients confirm that information provided is accurate and lawful. Clients
              agree not to misuse systems, tools, or analytics in illegal or unethical
              ways. Copying, reverse-engineering, or reselling tools or content without
              written permission is prohibited.
            </p>
          </div>

          {/* 3. Ownership & IP */}
          <div>
            <h2 className="font-playfair text-3xl md:text-4xl leading-[1.1] text-off-white mb-4">
              3. Ownership &amp; Intellectual Property
            </h2>
            <div className="w-12 h-[2px] bg-ash/20 mb-8" />
            <p className="font-body text-base leading-[1.8] text-ash mb-6">
              Work product created for a client belongs to that client, unless
              explicitly stated otherwise in a project agreement.
            </p>
            <p className="font-body text-base leading-[1.8] text-ash">
              All materials on this site — copy, design, tools, and code — belong to
              Okami Consulting LLC and are protected under applicable copyright laws.
            </p>
          </div>

          {/* 4. Payment Terms */}
          <div>
            <h2 className="font-playfair text-3xl md:text-4xl leading-[1.1] text-off-white mb-4">
              4. Payment Terms
            </h2>
            <div className="w-12 h-[2px] bg-ash/20 mb-8" />
            <p className="font-body text-base leading-[1.8] text-ash mb-6">
              <span className="font-playfair">The Okami Review</span> is billed at a fixed rate, payable at the time
              of booking through the provided payment link. Consulting engagements
              beyond the review are scoped and priced individually.
            </p>
            <p className="font-body text-base leading-[1.8] text-ash">
              All payments are processed securely through Stripe. Okami Consulting LLC
              does not store credit card information.
            </p>
          </div>

          {/* 5. Disclaimers */}
          <div>
            <h2 className="font-playfair text-3xl md:text-4xl leading-[1.1] text-off-white mb-4">
              5. Disclaimers
            </h2>
            <div className="w-12 h-[2px] bg-ash/20 mb-8" />
            <p className="font-body text-base leading-[1.8] text-ash mb-6">
              Nothing on this site constitutes a guarantee of future outcomes. Business
              results vary based on implementation, market conditions, and operational
              context.
            </p>
            <p className="font-body text-base leading-[1.8] text-ash">
              <span className="font-playfair">The Okami Review</span> and all consulting output is advisory in nature.
              Clients should consult with appropriate professionals before making major
              decisions based on review findings.
            </p>
          </div>

          {/* 6. Limitation of Liability */}
          <div>
            <h2 className="font-playfair text-3xl md:text-4xl leading-[1.1] text-off-white mb-4">
              6. Limitation of Liability
            </h2>
            <div className="w-12 h-[2px] bg-ash/20 mb-8" />
            <p className="font-body text-base leading-[1.8] text-ash mb-6">
              Okami Consulting LLC is not liable for indirect or consequential losses,
              decisions made based on Okami Review reports, or technical downtime caused by
              third-party services.
            </p>
            <p className="font-mono text-sm text-off-white">
              Maximum liability is limited to the amount paid for services.
            </p>
          </div>

          {/* 7. Governing Law */}
          <div>
            <h2 className="font-playfair text-3xl md:text-4xl leading-[1.1] text-off-white mb-4">
              7. Governing Law
            </h2>
            <div className="w-12 h-[2px] bg-ash/20 mb-8" />
            <p className="font-body text-base leading-[1.8] text-ash">
              This agreement is governed by the laws of the State of Florida, USA.
              Any disputes will be resolved in that jurisdiction.
            </p>
          </div>

          {/* 8. Changes */}
          <div>
            <h2 className="font-playfair text-3xl md:text-4xl leading-[1.1] text-off-white mb-4">
              8. Changes to These Terms
            </h2>
            <div className="w-12 h-[2px] bg-ash/20 mb-8" />
            <p className="font-body text-base leading-[1.8] text-ash">
              These terms may be updated. The current version will always be available on
              this page. Continued use of the site or services after changes constitutes
              acceptance.
            </p>
          </div>

          {/* 9. Contact */}
          <div>
            <h2 className="font-playfair text-3xl md:text-4xl leading-[1.1] text-off-white mb-4">
              9. Contact
            </h2>
            <div className="w-12 h-[2px] bg-ash/20 mb-8" />
            <p className="font-body text-base leading-[1.8] text-ash mb-4">
              Questions about these terms:
            </p>
            <div className="border border-ash/10 p-6 lg:p-8">
              <div className="space-y-3">
                <div>
                  <span className="font-mono text-xs uppercase tracking-widest text-ash/60 block mb-1">Email</span>
                  <span className="font-body text-base text-off-white">hello@okamilabs.com</span>
                </div>
                <div>
                  <span className="font-mono text-xs uppercase tracking-widest text-ash/60 block mb-1">Entity</span>
                  <span className="font-body text-base text-off-white">Okami Consulting LLC</span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* Back to Home */}
      <section className="py-24 md:py-32 border-t border-ash/10">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <Link
            href="/"
            className="font-mono text-sm uppercase tracking-widest text-ash hover:text-off-white transition-colors"
          >
            &larr; Back to Home
          </Link>
        </div>
      </section>
    </main>
  );
}
