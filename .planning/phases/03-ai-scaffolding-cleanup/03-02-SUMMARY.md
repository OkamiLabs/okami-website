---
plan: 03-02
phase: 03-ai-scaffolding-cleanup
status: complete
self_check: PASSED
key-files:
  created: []
  modified:
    - lib/ai/system-prompt.ts
    - db/migrations/002_seed_services.sql
---

## Summary

Two small, independent fixes to AI scaffolding files: domain string correction in the system prompt and seed migration rewrite with the two live service offerings.

## What Was Built

**Task 1 — AI-02: Fix domain in lib/ai/system-prompt.ts**

Replaced the single occurrence of `okami.com` with `okamilabs.com` in the `getSystemPrompt()` template string (line 8). One-token change — no structural modifications.

Before: `You are Okami's website assistant on okami.com.`
After: `You are Okami's website assistant on okamilabs.com.`

**Task 2 — AI-03: Rewrite db/migrations/002_seed_services.sql**

Replaced the three stale service offerings (AI Strategy Consultation, Custom AI Development, WhatsApp Automation) with the two live offerings:

| Service | Price | Duration | sort_order |
|---------|-------|----------|------------|
| The Okami Review | $299 | 45–60 min | 1 |
| Discovery Call | Free | 15 min | 2 |

Key details:
- Discovery Call description matches `components/book/BookFlow.tsx` SUMMARY_SERVICE.discovery.description exactly (canonical source of truth)
- SQL apostrophe in `what''s slowing you down` correctly double-escaped per SQL string literal convention
- En-dash in `45–60 min` is U+2013 (not a regular hyphen)
- Down migration deletes by the new name set only

## Deviations

None. Both changes match prescribed plan exactly.

## Self-Check

- [x] `lib/ai/system-prompt.ts` contains `okamilabs.com`
- [x] No bare `okami.com` in system-prompt.ts (only `okamilabs.com`)
- [x] `002_seed_services.sql` contains exactly one `INSERT INTO services`
- [x] Two value rows: `'The Okami Review'` and `'Discovery Call'`
- [x] No stale service names (AI Strategy Consultation, Custom AI Development, WhatsApp Automation)
- [x] Apostrophe correctly escaped as `what''s`
- [x] Down migration deletes the two new names
