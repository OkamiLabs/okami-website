import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  // Exception capture only — no session replay (per RESEARCH.md anti-patterns).
  tracesSampleRate: 0,
  environment: process.env.NODE_ENV,
});
