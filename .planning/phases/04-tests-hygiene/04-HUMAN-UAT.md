---
status: partial
phase: 04-tests-hygiene
source: [04-VERIFICATION.md]
started: 2026-05-21T00:15:00Z
updated: 2026-05-21T00:15:00Z
---

## Current Test

[awaiting human testing]

## Tests

### 1. Browser cache validation for /api/availability
expected: DevTools shows `Cache-Control: public, max-age=60, stale-while-revalidate=30` on the `/api/availability` response. A second request within 60 seconds is served from cache (status 304 or "(from cache)" / "(memory cache)" in the Network tab).
result: [pending]

## Summary

total: 1
passed: 0
issues: 0
pending: 1
skipped: 0
blocked: 0

## Gaps
