---
phase: 05-foundation-live-ai
plan: 01
subsystem: api
tags: [ai-sdk, typescript, tools, widget]

# Dependency graph
requires: []
provides:
  - "lib/ai/tools.ts: v5-compatible tool definitions (captureLeadInfo, lookupService)"
  - "widget/types/widget.ts: cleaned widget types without retired ToolCallDisplay"
affects: [05-02, 05-03]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "AI SDK v5: use inputSchema: in tool() calls, not parameters:"

key-files:
  created: []
  modified:
    - lib/ai/tools.ts
    - lib/ai/system-prompt.ts
    - widget/types/widget.ts

key-decisions:
  - "bookDiscoveryCall removed: created orphaned DB rows outside Stripe payment flow (D-02)"
  - "parameters: renamed to inputSchema: per AI SDK v5 tool() API surface"
  - "ToolCallDisplay removed: unused interface, no runtime behavior change"

patterns-established:
  - "AI SDK v5 tool pattern: tool({ description, inputSchema: z.object({...}), execute })"

requirements-completed: [CONV-01]

# Metrics
duration: 8min
completed: 2026-05-21
---

# Phase 5 Plan 01: AI SDK v5 Tool Migration Summary

**AI SDK v5 migration: removed bookDiscoveryCall tool and renamed parameters to inputSchema in captureLeadInfo and lookupService, unblocking Wave 2 route replacement**

## Performance

- **Duration:** ~8 min
- **Started:** 2026-05-21T14:23:00Z
- **Completed:** 2026-05-21T14:31:32Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments

- Removed bookDiscoveryCall tool that created orphaned pending booking rows outside the Stripe payment flow
- Renamed `parameters:` to `inputSchema:` in both remaining tools (captureLeadInfo, lookupService) to match AI SDK v5 API
- Removed stale `bookDiscoveryCall` reference from system-prompt.ts guidelines
- Removed unused ToolCallDisplay interface from widget/types/widget.ts
- TypeScript compiles clean on all modified files

## Task Commits

Each task was committed atomically:

1. **Task 1: Remove bookDiscoveryCall and rename parameters to inputSchema** - `456959b` (feat)
2. **Task 2: Remove ToolCallDisplay interface from widget/types/widget.ts** - `e1e4c36` (chore)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `lib/ai/tools.ts` - Removed bookDiscoveryCall tool entirely; renamed `parameters:` to `inputSchema:` in captureLeadInfo and lookupService
- `lib/ai/system-prompt.ts` - Removed "For booking requests, use the bookDiscoveryCall tool" line from guidelines
- `widget/types/widget.ts` - Removed ToolCallDisplay interface (section comment + interface declaration)

## Decisions Made

None - followed plan as specified. Both changes (v5 migration, interface removal) were mechanical as described.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- lib/ai/tools.ts now exports getTools() returning exactly `{ captureLeadInfo, lookupService }` with v5-compatible inputSchema fields
- TypeScript compilation gate is clear — Wave 2 route replacement (Plan 02) can proceed
- No blockers

---
*Phase: 05-foundation-live-ai*
*Completed: 2026-05-21*
