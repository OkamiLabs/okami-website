import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Privacy Policy',
  description:
    'Privacy Policy for Okami Consulting LLC. How we collect, use, and protect your information.',
  openGraph: {
    title: 'Privacy Policy — Okami Labs',
    description:
      'Privacy Policy for Okami Consulting LLC. How we collect, use, and protect your information.',
  },
};

export default function PrivacyPage() {
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
              Privacy Policy
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
            Okami Consulting LLC collects only what is necessary to deliver value.
            This policy outlines how information is collected, used, and protected
            across consulting services, automation products, and diagnostic tools.
          </p>
        </div>
      </section>

      {/* Sections */}
      <section className="border-b border-ash/10">
        <div className="max-w-4xl mx-auto px-6 py-24 lg:py-32 space-y-24">

          {/* 1. What We Collect */}
          <div>
            <h2 className="font-playfair text-3xl md:text-4xl leading-[1.1] text-off-white mb-4">
              1. What We Collect
            </h2>
            <div className="w-12 h-[2px] bg-ash/20 mb-8" />

            <h3 className="font-mono text-sm uppercase tracking-widest text-off-white mb-4">
              Information You Provide
            </h3>
            <div className="space-y-4 mb-10">
              <p className="font-body text-base leading-[1.8] text-ash">
                Name, email, and company information when booking a consultation,
                submitting a form, or starting a review. Okami Review answers provided
                during the Okami Review engagement. Any additional context shared
                about workflows, systems, or automation goals.
              </p>
            </div>

            <h3 className="font-mono text-sm uppercase tracking-widest text-off-white mb-4">
              Information Collected Automatically
            </h3>
            <div className="space-y-4">
              <p className="font-body text-base leading-[1.8] text-ash">
                Basic usage data including IP address, browser type, referring URLs, and
                timestamps. Site analytics to understand how visitors navigate the site and
                identify areas for improvement. Cookies used for performance purposes, not
                personalization.
              </p>
            </div>
          </div>

          {/* 2. How We Use It */}
          <div>
            <h2 className="font-playfair text-3xl md:text-4xl leading-[1.1] text-off-white mb-4">
              2. How We Use It
            </h2>
            <div className="w-12 h-[2px] bg-ash/20 mb-8" />
            <div className="space-y-4">
              <p className="font-body text-base leading-[1.8] text-ash">
                To deliver the services requested. To improve products, tools, and the site
                itself. To communicate about consultations, Okami Review results, or project
                updates. To monitor performance and security.
              </p>
              <p className="font-mono text-sm text-off-white mt-6">
                Okami does not sell or rent data. Ever.
              </p>
            </div>
          </div>

          {/* 3. Who Has Access */}
          <div>
            <h2 className="font-playfair text-3xl md:text-4xl leading-[1.1] text-off-white mb-4">
              3. Who Has Access
            </h2>
            <div className="w-12 h-[2px] bg-ash/20 mb-8" />
            <p className="font-body text-base leading-[1.8] text-ash">
              Data is only accessed by the internal team on a strict need-to-know basis,
              and by trusted service providers (analytics, scheduling, email delivery)
              operating under data-processing agreements with confidentiality and security
              obligations.
            </p>
          </div>

          {/* 4. Your Rights */}
          <div>
            <h2 className="font-playfair text-3xl md:text-4xl leading-[1.1] text-off-white mb-4">
              4. Your Rights
            </h2>
            <div className="w-12 h-[2px] bg-ash/20 mb-8" />
            <p className="font-body text-base leading-[1.8] text-ash mb-6">
              You may request access to what has been collected, request corrections or
              deletions, and opt out of communications at any time.
            </p>
            <p className="font-body text-base leading-[1.8] text-ash">
              To exercise any of these rights, email{' '}
              <span className="text-off-white">hello@okamilabs.com</span> with the
              subject line{' '}
              <span className="font-mono text-sm text-off-white">Privacy Request</span>.
            </p>
          </div>

          {/* 5. Data Storage & Security */}
          <div>
            <h2 className="font-playfair text-3xl md:text-4xl leading-[1.1] text-off-white mb-4">
              5. Data Storage &amp; Security
            </h2>
            <div className="w-12 h-[2px] bg-ash/20 mb-8" />
            <p className="font-body text-base leading-[1.8] text-ash">
              All data is stored using encrypted tools and trusted third-party providers.
              Industry-standard measures are used to prevent unauthorized access,
              including encryption in transit and at rest for sensitive data.
            </p>
          </div>

          {/* 6. Cookie Policy */}
          <div id="cookies">
            <h2 className="font-playfair text-3xl md:text-4xl leading-[1.1] text-off-white mb-4">
              6. Cookie Policy
            </h2>
            <div className="w-12 h-[2px] bg-ash/20 mb-8" />

            <p className="font-body text-base leading-[1.8] text-ash mb-8">
              This site uses cookies and similar tracking technologies to improve the
              visitor experience.
            </p>

            <h3 className="font-mono text-sm uppercase tracking-widest text-off-white mb-4">
              Types of Cookies
            </h3>
            <p className="font-body text-base leading-[1.8] text-ash mb-8">
              Essential cookies required for site functionality, including session
              management and security. Analytics cookies that help understand how visitors
              interact with the site (page views, session duration). Performance cookies
              that monitor loading speed and identify technical issues.
            </p>

            <h3 className="font-mono text-sm uppercase tracking-widest text-off-white mb-4">
              Third-Party Cookies
            </h3>
            <p className="font-body text-base leading-[1.8] text-ash mb-8">
              Third-party services used on this site may set their own cookies, including
              analytics providers and scheduling tools (Cal.com).
            </p>

            <h3 className="font-mono text-sm uppercase tracking-widest text-off-white mb-4">
              Managing Cookies
            </h3>
            <p className="font-body text-base leading-[1.8] text-ash">
              Cookies can be controlled through browser settings, including blocking all
              cookies (which may affect site functionality), deleting existing cookies, or
              allowing cookies from specific sites only. Most browsers accept cookies by
              default.
            </p>
          </div>

          {/* 7. Data Retention */}
          <div>
            <h2 className="font-playfair text-3xl md:text-4xl leading-[1.1] text-off-white mb-4">
              7. Data Retention &amp; Deletion
            </h2>
            <div className="w-12 h-[2px] bg-ash/20 mb-8" />
            <p className="font-body text-base leading-[1.8] text-ash mb-6">
              Personal information is retained only as long as necessary. Active accounts
              and leads are retained while engaged with services. Okami Review submissions
              are retained for 24 months after submission. Email subscribers are retained
              until they unsubscribe. Analytics data follows standard retention periods.
            </p>
            <p className="font-body text-base leading-[1.8] text-ash">
              Inactive accounts and expired data are automatically purged. Immediate
              deletion can be requested at any time.
            </p>
          </div>

          {/* 8. Legal Rights (GDPR & CCPA) */}
          <div>
            <h2 className="font-playfair text-3xl md:text-4xl leading-[1.1] text-off-white mb-4">
              8. Your Legal Rights
            </h2>
            <div className="w-12 h-[2px] bg-ash/20 mb-8" />

            <p className="font-body text-base leading-[1.8] text-ash mb-8">
              Under GDPR (EU residents) and CCPA (California residents), the following
              rights apply:
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-ash/10">
              {[
                { title: 'Right to Access', desc: 'Request a copy of all personal data held, in a portable format.' },
                { title: 'Right to Rectification', desc: 'Correct inaccurate or incomplete information.' },
                { title: 'Right to Erasure', desc: 'Request deletion of personal data, subject to legal retention requirements.' },
                { title: 'Right to Portability', desc: 'Receive data in a structured, machine-readable format.' },
                { title: 'Right to Object', desc: 'Object to processing based on legitimate interests or for direct marketing.' },
                { title: 'Right to Restrict', desc: 'Limit how data is used while resolving a dispute or verifying information.' },
              ].map((right) => (
                <div key={right.title} className="bg-dark p-6 lg:p-8">
                  <h3 className="font-mono text-sm text-off-white mb-2">{right.title}</h3>
                  <p className="font-body text-sm leading-relaxed text-ash">{right.desc}</p>
                </div>
              ))}
            </div>

            <p className="font-body text-base leading-[1.8] text-ash mt-8">
              Requests are responded to within 30 days (GDPR) or 45 days (CCPA). Complex
              requests may be extended by an additional 30 days with notification. No fee
              is charged unless requests are manifestly unfounded or excessive.
            </p>
          </div>

          {/* 9. Third-Party Sharing */}
          <div>
            <h2 className="font-playfair text-3xl md:text-4xl leading-[1.1] text-off-white mb-4">
              9. Third-Party Data Sharing
            </h2>
            <div className="w-12 h-[2px] bg-ash/20 mb-8" />
            <p className="font-body text-base leading-[1.8] text-ash mb-6">
              Data is shared only when necessary and under strict agreements. Service
              providers (analytics, email delivery, scheduling, CRM) operate under
              data-processing agreements. Data may be disclosed when required by law,
              court order, or government regulation. In the event of a merger or
              acquisition, data may be transferred with advance notice and equivalent
              protections.
            </p>
            <p className="font-mono text-sm text-off-white">
              Okami does not sell data, share data for marketing without explicit consent,
              or use data for purposes unrelated to its services.
            </p>
          </div>

          {/* 10. Children's Privacy */}
          <div>
            <h2 className="font-playfair text-3xl md:text-4xl leading-[1.1] text-off-white mb-4">
              10. Children&apos;s Privacy
            </h2>
            <div className="w-12 h-[2px] bg-ash/20 mb-8" />
            <p className="font-body text-base leading-[1.8] text-ash">
              Services are not directed to individuals under 18. Personal information is
              not knowingly collected from children. If such information is discovered, it
              will be deleted immediately. Contact{' '}
              <span className="text-off-white">hello@okamilabs.com</span> with any
              concerns.
            </p>
          </div>

          {/* 11. International Transfers */}
          <div>
            <h2 className="font-playfair text-3xl md:text-4xl leading-[1.1] text-off-white mb-4">
              11. International Data Transfers
            </h2>
            <div className="w-12 h-[2px] bg-ash/20 mb-8" />
            <p className="font-body text-base leading-[1.8] text-ash">
              Okami Consulting LLC operates remotely and may process data across
              jurisdictions. Adequate protection is ensured through Standard Contractual
              Clauses, hosting with GDPR-compliant providers, and encryption in transit
              and at rest.
            </p>
          </div>

          {/* 12. Changes */}
          <div>
            <h2 className="font-playfair text-3xl md:text-4xl leading-[1.1] text-off-white mb-4">
              12. Changes to This Policy
            </h2>
            <div className="w-12 h-[2px] bg-ash/20 mb-8" />
            <p className="font-body text-base leading-[1.8] text-ash">
              This policy is updated when necessary. The latest version will always be
              available on this page. Material changes will be noted visibly on the site.
            </p>
          </div>

          {/* 13. Contact */}
          <div>
            <h2 className="font-playfair text-3xl md:text-4xl leading-[1.1] text-off-white mb-4">
              13. Contact
            </h2>
            <div className="w-12 h-[2px] bg-ash/20 mb-8" />
            <p className="font-body text-base leading-[1.8] text-ash mb-4">
              For privacy-related questions, data subject requests, or to exercise GDPR/CCPA
              rights:
            </p>
            <div className="border border-ash/10 p-6 lg:p-8">
              <div className="space-y-3">
                <div>
                  <span className="font-mono text-xs uppercase tracking-widest text-ash/60 block mb-1">Email</span>
                  <span className="font-body text-base text-off-white">hello@okamilabs.com</span>
                </div>
                <div>
                  <span className="font-mono text-xs uppercase tracking-widest text-ash/60 block mb-1">Subject</span>
                  <span className="font-mono text-sm text-off-white">Privacy Request</span>
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
