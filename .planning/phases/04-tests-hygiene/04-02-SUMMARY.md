---
phase: 04-tests-hygiene
plan: 02
subsystem: testing
tags: [vitest, unit-tests, booking-flow, package-hygiene]
dependency_graph:
  requires: []
  provides: [TEST-01, HYG-04]
  affects: [lib/booking-flow.ts]
tech_stack:
  added: [vitest@^3.0.0, "@vitest/coverage-v8@^3.0.0"]
  patterns: [vi.mock module isolation, importOriginal to preserve class instances, vi.doMock + vi.resetModules for null-singleton override]
key_files:
  created:
    - vitest.config.ts
    - lib/booking-flow.test.ts
  modified:
    - package.json
decisions:
  - "Used importOriginal in cal-bookings mock to preserve CalBookingError class so instanceof checks in source work correctly"
  - "Used vi.doMock + vi.resetModules + dynamic import for not_configured test because stripe is a const bound at module load time"
  - "Inlined toRef implementation in stripe mock rather than importing real lib/stripe.ts to avoid Stripe SDK constructor running in tests"
metrics:
  duration: "~8 minutes"
  completed: "2026-05-20"
  tasks_completed: 3
  files_created: 2
  files_modified: 1
---

# Phase 04 Plan 02: Vitest harness + booking-flow unit tests Summary

**One-liner:** Vitest test harness with 6 unit tests covering all reconcileBookingFromIntent exit paths (happy, idempotent, cal_failure, not_configured, payment_not_succeeded, metadata_missing), plus pinned AI SDK versions in package.json.

## Tasks Completed

| # | Name | Commit | Files |
|---|------|--------|-------|
| 1 | HYG-04 — Pin AI SDK versions, add Vitest | 49b12ea | package.json, package-lock.json |
| 2 | TEST-01 — Create vitest.config.ts | 0e2c02d | vitest.config.ts |
| 3 | TEST-01 — Write booking-flow.test.ts | a24e648 | lib/booking-flow.test.ts |

## Verification

- `npm test` exits 0 with 6 tests passing, 1 test file
- `node -e "..."` confirms `@ai-sdk/anthropic` = `2.0.0`, `ai` = `5.0.0`, `scripts.test` = `vitest run`, vitest in devDependencies
- `git diff --quiet lib/booking-flow.ts` — source file unmodified
- All 6 test cases cover the required paths:
  - happy path (PI succeeded, createBooking resolves)
  - idempotent path (bookingId already in metadata, createBooking not called)
  - BOOKING_FAILED_POST_CHARGE / cal_failure (createBooking rejects CalBookingError, Sentry.captureException called)
  - not_configured (stripe null)
  - payment_not_succeeded (PI status not succeeded)
  - metadata_missing (required fields absent: slotIso, name, email, challenge)

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None — the tests exercise real production logic with mocked I/O boundaries; no placeholder assertions.

## Threat Flags

None — no new network endpoints, auth paths, file access patterns, or schema changes introduced. Test fixtures use synthetic PII (jane@example.com) with no real customer data (T-04-06 accepted).

## Self-Check: PASSED

- vitest.config.ts exists: FOUND
- lib/booking-flow.test.ts exists: FOUND
- Commit 49b12ea exists: FOUND (package.json + lockfile)
- Commit 0e2c02d exists: FOUND (vitest.config.ts)
- Commit a24e648 exists: FOUND (booking-flow.test.ts)
- npm test: 6 passed, 0 failed
- Source lib/booking-flow.ts: unchanged
