---
phase: 04-tests-hygiene
plan: "01"
subsystem: hygiene
tags: [documentation, caching, query-safety]
dependency_graph:
  requires: []
  provides: [HYG-01, HYG-02, HYG-03]
  affects: [CLAUDE.md, api/availability, admin/conversations]
tech_stack:
  added: []
  patterns:
    - Cache-Control public header on success-path API response
    - LIMIT bound on admin sub-query to prevent unbounded fetch
key_files:
  created: []
  modified:
    - CLAUDE.md
    - app/api/availability/route.ts
    - app/admin/conversations/route.ts
decisions:
  - "LIMIT 100 applied as bare SQL literal in Neon tagged template — no interpolation needed"
  - "Cache-Control only on success path; all error returns remain uncached"
  - "Both newsletter /tmp occurrences removed (tech-stack line + env-setup line)"
metrics:
  duration: "1m"
  completed: "2026-05-21T00:06:50Z"
  tasks_completed: 3
  tasks_total: 3
  files_modified: 3
---

# Phase 04 Plan 01: Code Hygiene Fixes Summary

Three independent one-file hygiene fixes: CLAUDE.md newsletter 503 correction, Cache-Control header on availability success path, and LIMIT 100 on admin messages sub-query.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | HYG-01: Correct CLAUDE.md newsletter description | ed32789 | CLAUDE.md |
| 2 | HYG-02: Add Cache-Control to /api/availability success | 628fb7e | app/api/availability/route.ts |
| 3 | HYG-03: Bound admin messages sub-query with LIMIT 100 | 46f1c94 | app/admin/conversations/route.ts |

## What Was Built

**HYG-01 (CLAUDE.md):** Removed false `/tmp` fallback claim from two locations — the tech-stack bullet and the env-setup optional vars line. Both now accurately state that the newsletter endpoint returns 503 when Beehiiv keys are absent.

**HYG-02 (/api/availability):** Added `Cache-Control: public, max-age=60, stale-while-revalidate=30` header to the single success-path return. The header uses the two-argument `NextResponse.json(body, { headers })` form. All error-path returns (503, 400, 400, 502) remain header-free. The existing `next: { revalidate: 60 }` ISR option on the internal Cal.com fetch is untouched.

**HYG-03 (admin/conversations):** Added `LIMIT 100` as a bare SQL literal to the messages sub-query inside the `if (conversationIds.length > 0)` block. The conversations query `LIMIT ${limit}` (parameterized, max 50) is unchanged.

## Verification Results

All three acceptance criteria groups passed:
- `grep -i newsletter CLAUDE.md` shows 503 wording, no `/tmp` occurrence
- `grep -c 'public, max-age=60, stale-while-revalidate=30' app/api/availability/route.ts` = 1
- `grep -c 'Cache-Control' app/api/availability/route.ts` = 1 (success path only)
- `grep -c 'LIMIT 100' app/admin/conversations/route.ts` = 1 (inside messages sub-query)
- `npx tsc --noEmit` passed with no new errors

## Deviations from Plan

None — plan executed exactly as written.

## Known Stubs

None.

## Threat Flags

None. All changes were within the threat model:
- T-04-01 (Cache-Control on public availability) — accepted; non-PII data, bounded staleness
- T-04-02 (LIMIT 100 on messages) — mitigated by HYG-03
- T-04-03 (CLAUDE.md accuracy) — documentation-only, no runtime surface
- T-04-04 (max-age 60s) — accepted; matches existing ISR revalidate window

## Self-Check: PASSED

Files exist:
- CLAUDE.md — modified, contains 503 wording, no /tmp in newsletter context
- app/api/availability/route.ts — modified, contains stale-while-revalidate=30
- app/admin/conversations/route.ts — modified, contains LIMIT 100

Commits exist:
- ed32789 — docs(04-01): correct newsletter 503 behavior in CLAUDE.md
- 628fb7e — feat(04-01): add Cache-Control header to availability success response
- 46f1c94 — fix(04-01): bound admin messages sub-query with LIMIT 100
