import * as Sentry from "@sentry/nextjs";

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    // sentry.edge.config not provided in Phase 1 — no edge routes use Sentry yet.
    // The import is intentionally guarded so adding it later requires no change here.
  }
}

export const onRequestError = Sentry.captureRequestError;
