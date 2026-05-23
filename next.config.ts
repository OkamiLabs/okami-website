import type { NextConfig } from "next";
import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  poweredByHeader: false,

  async redirects() {
    return [
      // Old /contact surface is gone — all booking lives at /book now.
      { source: '/contact', destination: '/book', permanent: true },
      // /building renamed to /products.
      { source: '/building', destination: '/products', permanent: true },
    ];
  },

  async headers() {
    const isDev = process.env.NODE_ENV !== 'production';
    const isPreview = process.env.VERCEL_ENV === 'preview';
    const scriptSrc = isDev
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.stripe.com https://va.vercel-scripts.com"
      : isPreview
      ? "script-src 'self' 'unsafe-inline' https://js.stripe.com https://va.vercel-scripts.com https://vercel.live"
      : "script-src 'self' 'unsafe-inline' https://js.stripe.com https://va.vercel-scripts.com";

    const connectSrc = isPreview
      ? "connect-src 'self' https://api.stripe.com https://api.beehiiv.com https://va.vercel-scripts.com https://vitals.vercel-insights.com https://o*.ingest.sentry.io https://vercel.live wss://ws-us3.pusher.com https://sockjs-us3.pusher.com"
      : "connect-src 'self' https://api.stripe.com https://api.beehiiv.com https://va.vercel-scripts.com https://vitals.vercel-insights.com https://o*.ingest.sentry.io";

    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'SAMEORIGIN' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=()' },
          { key: 'Strict-Transport-Security', value: 'max-age=63072000; includeSubDomains; preload' },
          { key: 'X-DNS-Prefetch-Control', value: 'on' },
          {
            key: 'Content-Security-Policy',
            value: [
              "default-src 'self'",
              scriptSrc,
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: https:",
              "font-src 'self' https://fonts.gstatic.com",
              "frame-src https://js.stripe.com https://hooks.stripe.com",
              connectSrc,
              "worker-src 'self' blob:",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              // SEC-02: This site-wide CSP overrides any route-handler `frame-ancestors`
              // header. `app/admin/conversations/route.ts` sets `frame-ancestors 'none'`,
              // but that route-level header is replaced by this `'self'` value at the
              // edge — same-origin framing of /admin/* is therefore allowed in practice.
              // Mitigation: admin routes are gated by HTTP Basic Auth in `proxy.ts`, so
              // any same-origin framer would still hit the auth challenge before reaching
              // protected data. Do NOT change `'self'` to `'none'` here without first
              // moving admin under its own host (e.g. admin.okamilabs.com) or accepting
              // that all framing across the site breaks — including any internal preview
              // tooling that frames the public site.
              "frame-ancestors 'self'",
            ].join('; '),
          },
        ],
      },
    ];
  },
};

export default withSentryConfig(nextConfig, {
  org: process.env.SENTRY_ORG,
  project: process.env.SENTRY_PROJECT,
  authToken: process.env.SENTRY_AUTH_TOKEN,
  tunnelRoute: "/sentry-tunnel",
  silent: !process.env.CI,
});
