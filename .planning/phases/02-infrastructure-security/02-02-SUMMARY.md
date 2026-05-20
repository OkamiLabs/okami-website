---
phase: 02-infrastructure-security
plan: 02
subsystem: security-hardening
tags:
  - security
  - timing-safe
  - csp
  - cleanup
  - infra

dependency_graph:
  requires: []
  provides:
    - reconciled-token-cleanup
    - timing-safe-username-compare
    - documented-csp-override
  affects:
    - lib/rate-limit-chat.ts
    - proxy.ts
    - next.config.ts

tech_stack:
  added:
    - node:crypto (built-in, no new install)
  patterns:
    - timingSafeEqual with equal-length padded Buffers for constant-time compare
    - Opportunistic cleanup with probabilistic 10% gate

key_files:
  modified:
    - lib/rate-limit-chat.ts
    - proxy.ts
    - next.config.ts
  created: []

decisions:
  - "INF-02: 7-day threshold for reconciled token_reservations cleanup is fixed per D-03 (no config var)"
  - "SEC-01: mismatch-byte injection at a[0] ^ 0xff ensures length divergence returns false without early exit"
  - "SEC-02: comment wording covers all three required facts (admin override, effective policy, basic-auth mitigation)"

metrics:
  duration: "~8 minutes"
  completed: "2026-05-19"
  tasks_completed: 3
  tasks_total: 3
  files_modified: 3
---

# Phase 02 Plan 02: Security and Infrastructure Hardening Summary

Three surgical fixes landing together as a single hardening pass: reconciled token_reservations cleanup (INF-02), timing-safe admin username comparison using timingSafeEqual (SEC-01), and documented CSP frame-ancestors override explaining the basic-auth mitigation (SEC-02).

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Add reconciled-row cleanup to opportunisticCleanup() (INF-02) | d531483 | lib/rate-limit-chat.ts |
| 2 | Replace XOR username compare with timingSafeEqual (SEC-01) | f1d7bee | proxy.ts |
| 3 | Document CSP frame-ancestors admin override (SEC-02) | 4f329cc | next.config.ts |

## Changes in Detail

### INF-02 — Reconciled token_reservations Cleanup

**File:** `lib/rate-limit-chat.ts`

Added a third DELETE statement to `opportunisticCleanup()` inside the existing try block:

```typescript
await sql`DELETE FROM token_reservations WHERE reconciled = TRUE AND reserved_at < NOW() - INTERVAL '7 days'`;
```

Final shape of `opportunisticCleanup()`:

```typescript
export async function opportunisticCleanup(): Promise<void> {
  if (Math.random() > 0.1) return;
  try {
    await sql`DELETE FROM rate_limit_buckets WHERE expires_at < NOW()`;
    await sql`DELETE FROM token_reservations WHERE reserved_at < NOW() - INTERVAL '5 minutes' AND NOT reconciled`;
    await sql`DELETE FROM token_reservations WHERE reconciled = TRUE AND reserved_at < NOW() - INTERVAL '7 days'`;
  } catch {
    // Never block a request on cleanup failure.
  }
}
```

The 10% probabilistic gate is unchanged. The new statement inherits the same error-swallowing behavior as the existing two DELETEs.

### SEC-01 — Timing-Safe Admin Username Comparison

**File:** `proxy.ts`

**Before (username block, lines 66-72):**
```typescript
// Constant-time user compare (length mismatch short-circuits — fine for usernames).
if (user.length !== expectedUser.length) return false;
let userOk = 0;
for (let i = 0; i < user.length; i++) {
  userOk |= user.charCodeAt(i) ^ expectedUser.charCodeAt(i);
}
if (userOk !== 0) return false;
```

**After:**
```typescript
import { timingSafeEqual } from 'node:crypto';

// Constant-time username compare using timingSafeEqual.
// Pad both sides to equal length so length alone reveals nothing; if lengths
// differ we inject a guaranteed mismatch byte so the compare returns false.
{
  const userBuf = Buffer.from(user, 'utf8');
  const expectedBuf = Buffer.from(expectedUser, 'utf8');
  const len = Math.max(userBuf.length, expectedBuf.length);
  const a = Buffer.alloc(len, 0);
  const b = Buffer.alloc(len, 0);
  userBuf.copy(a);
  expectedBuf.copy(b);
  // If original lengths differ, force a mismatch byte at position 0 of `a`
  // so timingSafeEqual returns false regardless of contents.
  if (userBuf.length !== expectedBuf.length) {
    a[0] = a[0] ^ 0xff;
  }
  if (!timingSafeEqual(a, b)) return false;
}
```

The password HMAC block (`crypto.subtle.importKey` through `return hashOk === 0`) is byte-for-byte unchanged.

### SEC-02 — Documented CSP frame-ancestors Override

**File:** `next.config.ts`

Added a multi-line comment immediately above the `"frame-ancestors 'self'"` CSP directive covering all three required facts:

```typescript
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
```

The CSP directive value is unchanged. No other directives were touched.

## Verification Results

```
INF-02:
  reconciled DELETE present (count 1):    PASS
  inside try block:                        PASS
  10% gate preserved:                      PASS

SEC-01:
  timingSafeEqual import (count 1):       PASS
  old length short-circuit gone (count 0): PASS
  old XOR loop gone (count 0):             PASS
  timingSafeEqual(a, b) (count 1):        PASS
  Buffer.alloc(len, 0) (count 2):         PASS
  mismatch injection a[0]^0xff (count 1): PASS
  crypto.subtle.importKey preserved:      PASS
  hashOk === 0 preserved:                 PASS

SEC-02:
  frame-ancestors 'self' value unchanged (count 1): PASS
  SEC-02 marker present:                   PASS
  Basic Auth mention:                      PASS
  admin mention:                           PASS
  override mention:                        PASS
  comment immediately above directive:     PASS

Cross-cutting:
  npx tsc --noEmit:                        PASS (exit 0)
  npm run build:                           DATABASE_URL missing (pre-existing, see note)
  npm run lint:                            worktree path resolution issue (pre-existing)
```

**Note on build:** `npm run build` fails with `DATABASE_URL missing` — this is a pre-existing infrastructure constraint in the worktree environment (no DB credentials). The failure is in `lib/db/client.ts` page data collection, not in any file touched by this plan. TypeScript compilation (`npx tsc --noEmit`) passes cleanly, confirming no type errors were introduced.

## Deviations from Plan

None — plan executed exactly as written. All three D-03, D-04, D-05 decisions implemented as specified.

## Threat Surface Scan

No new network endpoints, auth paths, file access patterns, or schema changes introduced. This plan only hardens existing paths and adds documentation.

## Self-Check: PASSED

| Item | Status |
|------|--------|
| lib/rate-limit-chat.ts exists | FOUND |
| proxy.ts exists | FOUND |
| next.config.ts exists | FOUND |
| 02-02-SUMMARY.md exists | FOUND |
| Commit d531483 (Task 1) | FOUND |
| Commit f1d7bee (Task 2) | FOUND |
| Commit 4f329cc (Task 3) | FOUND |
