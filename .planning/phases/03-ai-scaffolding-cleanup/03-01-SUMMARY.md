---
plan: 03-01
phase: 03-ai-scaffolding-cleanup
status: complete
self_check: PASSED
key-files:
  created: []
  modified:
    - lib/ai/tools.ts
---

## Summary

Fixed `lib/ai/tools.ts` so it is import-correct and runtime-correct. The file had two broken imports and seven `db.query()` call sites using a pg-style API that does not exist on the Neon HTTP client.

## What Was Built

**Import fixes (D-01, D-02):**
- `import db from '../db/client.js'` → `import { sql } from '../db/client.js'` (named export, not default)
- `import { sendSlackNotification } from '../lib/notifications.js'` → `import { sendSlackNotification } from '../notifications.js'` (path without the extra `lib/` segment)

**db.query() → sql tagged template conversions (D-03, 7 sites):**

| Handler | Site | Change |
|---------|------|--------|
| bookDiscoveryCall | SELECT id FROM bookings | `db.query(sql, [])` → `` sql`...${visitorId}...` `` |
| bookDiscoveryCall | INSERT INTO bookings | `db.query(sql, [])` → `` sql`...` `` |
| bookDiscoveryCall | SELECT role/content FROM messages | `db.query<T>(sql, [])` → `` sql`...` as Array<T> `` |
| captureLeadInfo | SELECT COUNT(*) FROM leads | `db.query<T>(sql, [])` → `` const [captureCount] = (await sql`...`) as Array<T> `` |
| captureLeadInfo | SELECT id FROM leads (dedup) | `db.query(sql, [])` → `` sql`...` as Array<T> `` |
| captureLeadInfo | INSERT INTO leads | `db.query(sql, [])` → `` sql`...` `` |
| lookupService | SELECT name/desc/price/duration FROM services | `db.query<T>(sql, [params])` → `` sql`... ILIKE ${`%${query}%`}...` as Array<T> `` |

**`.rows` accessor removals:** All `result.rows.*` / `existing.rows.*` / `recentMessages.rows.*` replaced with direct array access (Neon HTTP driver returns a plain array, not `{ rows: [...] }`).

## Deviations

None. All changes match the plan's prescribed body exactly.

## Self-Check

- [x] `grep -c "db.query" lib/ai/tools.ts` → 0
- [x] `grep -c "\.rows" lib/ai/tools.ts` → 0
- [x] `grep -c "await sql\`" lib/ai/tools.ts` → 7
- [x] `import { sql } from '../db/client.js'` present
- [x] `import { sendSlackNotification } from '../notifications.js'` present
- [x] No `import db from` present
- [x] No `from '../lib/notifications` present
