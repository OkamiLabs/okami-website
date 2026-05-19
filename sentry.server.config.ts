import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  // Exception capture only — no performance tracing or session replay in Phase 1.
  tracesSampleRate: 0,
  environment: process.env.NODE_ENV,
});
