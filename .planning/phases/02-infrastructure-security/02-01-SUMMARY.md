---
phase: 02-infrastructure-security
plan: "01"
subsystem: database-migration
tags:
  - migration
  - neon
  - postgres
  - supabase-removal
dependency_graph:
  requires: []
  provides:
    - partial_bookings table via npm run migrate
    - /api/partial-booking writes via Neon sql (no Supabase runtime dep)
  affects:
    - app/api/partial-booking/route.ts
    - db/migrations/
tech_stack:
  added: []
  patterns:
    - Neon sql tagged-template for stored procedure calls (positional SELECT)
    - ::jsonb cast for JSONB params in Neon HTTP driver
key_files:
  created:
    - db/migrations/004_partial_bookings.sql
  modified:
    - app/api/partial-booking/route.ts
  deleted:
    - lib/migrations/001_partial_bookings.sql
decisions:
  - Stored procedure preserved as-is (D-01/D-02): no inline INSERT ON CONFLICT rewrite
  - Empty lib/migrations/ directory removed after last file deleted
  - DATABASE_URL guard kept as belt-and-suspenders despite client.ts throw-on-import behavior
metrics:
  duration: "80s"
  completed_date: "2026-05-19T23:57:42Z"
  tasks_completed: 2
  files_changed: 3
requirements_closed:
  - INF-01
---

# Phase 02 Plan 01: Partial Bookings Migration to Neon Summary

**One-liner:** Moved partial_bookings migration from lib/migrations/ to db/migrations/004 and rewired the beacon route from supabase.rpc to Neon sql tagged template, closing INF-01.

## What Was Done

### Task 1 — Migration file path swap

The SQL file `lib/migrations/001_partial_bookings.sql` was copied verbatim to `db/migrations/004_partial_bookings.sql` (next sequential number after 003_rate_limits.sql). The old file and the now-empty `lib/migrations/` directory were removed.

**Before:** `lib/migrations/001_partial_bookings.sql` — picked up only by a manual Supabase apply step, invisible to `node-pg-migrate -m db/migrations up`.

**After:** `db/migrations/004_partial_bookings.sql` — applied automatically by `npm run migrate` on a fresh database deploy, no manual SQL step required.

### Task 2 — Route call shape change

**Before (supabase.rpc):**
```typescript
import { supabase, isSupabaseConfigured } from '@/lib/supabase';

if (!isSupabaseConfigured() || !supabase) {
  console.warn('[partial-booking] Supabase not configured — beacon discarded.');
  return OK;
}

const { error } = await supabase.rpc('upsert_partial_booking', {
  p_email: email,
  p_service_id: serviceId,
  p_slot_iso: slotIso,
  p_step: step,
  p_step_order: STEP_ORDER[step] ?? 0,
  p_intake: intake,
  p_converted: converted,
});
if (error) { console.error('[partial-booking] Supabase error:', error); }
return OK;
```

**After (Neon sql tagged template):**
```typescript
import { sql } from '@/lib/db/client';

if (!process.env.DATABASE_URL) {
  console.warn('[partial-booking] DATABASE_URL not configured — beacon discarded.');
  return OK;
}

try {
  await sql`
    SELECT upsert_partial_booking(
      ${email},
      ${serviceId},
      ${slotIso},
      ${step},
      ${STEP_ORDER[step] ?? 0},
      ${JSON.stringify(intake)}::jsonb,
      ${converted}
    )
  `;
} catch (err) {
  console.error('[partial-booking] Neon error:', err);
}
return OK;
```

The `::jsonb` cast is required because the Neon HTTP driver sends parameters as text strings; Postgres needs the explicit cast to parse the serialized JSON back into JSONB.

## Threat Model Compliance

Per the plan's threat register:

- **T-02-01 (SQL injection):** Neon tagged-template auto-parameterizes all interpolated values. No user input is concatenated into the SQL string. Mitigated.
- **T-02-02 (DoS):** Existing `isRateLimited(ip, { max: 20, windowMs: 60_000 })` guard remains at the top of POST — preserved unchanged.
- **T-02-03 (error leaks):** Errors are logged server-side only; response is always 200 OK. Accepted behavior preserved.
- **T-02-04 (malformed payload):** `validate()` function with strict allowlists (`VALID_SERVICES`, `VALID_STEPS`, `EMAIL_RE`, ISO-date parse) preserved unchanged.

## Deviations from Plan

None — plan executed exactly as written. All D-01/D-02 constraints honored:
- `lib/supabase.ts` and Supabase env vars in `.env.example` untouched.
- Stored procedure (`upsert_partial_booking`) preserved as-is, not rewritten as inline INSERT ON CONFLICT.
- `lib/db/client.ts` unmodified.

## Verification Results

All 7 phase-level checks pass:

1. `test -f db/migrations/004_partial_bookings.sql` — PASS
2. `! test -f lib/migrations/001_partial_bookings.sql` — PASS
3. `grep -c "CREATE TABLE partial_bookings" db/migrations/004_partial_bookings.sql` — 1
4. `grep -c "CREATE OR REPLACE FUNCTION upsert_partial_booking" db/migrations/004_partial_bookings.sql` — 1
5. `grep -c "from '@/lib/supabase'" app/api/partial-booking/route.ts` — 0
6. `grep -c "from '@/lib/db/client'" app/api/partial-booking/route.ts` — 1
7. `grep -c "upsert_partial_booking" app/api/partial-booking/route.ts` — 1

TypeScript: `npx tsc --noEmit` exits 0 (no type errors).

Beacon-silent paths confirmed: `grep -c "return OK" app/api/partial-booking/route.ts` returns 5 (rate-limited, invalid body, missing DATABASE_URL, Neon success, unexpected error).

## Commits

- `638dd9a` — `chore(02-01): move partial_bookings migration to db/migrations/004`
- `e692ac8` — `feat(02-01): switch /api/partial-booking from supabase.rpc to Neon sql`

## Self-Check: PASSED

- `db/migrations/004_partial_bookings.sql` — FOUND
- `app/api/partial-booking/route.ts` — FOUND (modified)
- `lib/migrations/001_partial_bookings.sql` — correctly absent
- Commit `638dd9a` — exists
- Commit `e692ac8` — exists
