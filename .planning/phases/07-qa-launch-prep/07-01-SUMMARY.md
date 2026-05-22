---
phase: 07-qa-launch-prep
plan: "01"
subsystem: widget
tags: [visual-redesign, css, theming, dark-mode, okami-brand]
dependency_graph:
  requires: []
  provides: [dark-okami-widget-theme]
  affects: [widget/styles/themes.css, widget/styles/widget.css, widget/types/widget.ts]
tech_stack:
  added: []
  patterns: [css-custom-properties, backdrop-filter-progressive-enhancement, dark-only-theme]
key_files:
  created: []
  modified:
    - widget/styles/themes.css
    - widget/styles/widget.css
    - widget/types/widget.ts
decisions:
  - "Dark-only `:root` block with Outfit @import as first line — eliminates all data-widget-theme selector blocks"
  - "Glass card via @supports progressive enhancement — solid rgba fallback for older browsers"
  - "Bot messages bare text (transparent background) matching Notion AI aesthetic"
  - "LIGHT_THEME/DARK_THEME exports removed; dead useWidgetTheme.ts left untouched per plan instruction"
metrics:
  duration: "~4 minutes"
  completed: "2026-05-22"
  tasks_completed: 3
  files_modified: 3
---

# Phase 07 Plan 01: Widget Dark Theme Redesign Summary

Dark Okami brand theme baked into widget CSS and TypeScript: single dark-only `:root` token block with Outfit font, glass card surface, transparent bot bubbles, Slate Blue user bubbles, pill input, and Burgundy error strip.

## What Was Built

Replaced the widget's light-mode, blue-accented theme with a locked dark design matching the Okami brand palette. Three files were modified: `themes.css` (full rewrite to single `:root` block), `widget.css` (8 targeted selector edits), `widget/types/widget.ts` (DEFAULT_CONFIG update, LIGHT/DARK_THEME exports removed).

## Tasks

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Rewrite themes.css to dark-only Okami token block | 32c5807 | widget/styles/themes.css |
| 2 | Apply targeted component redesign in widget.css | a6866fc | widget/styles/widget.css |
| 3 | Bake dark Okami theme into DEFAULT_CONFIG | e0882dd | widget/types/widget.ts |

## Decisions Made

- Outfit @import placed as absolute first line before all comments/rules (Vite silently drops @import that follows any rule block; CSS spec requirement)
- Glass card surface uses `@supports (backdrop-filter: blur(12px))` with solid `rgba(15,15,15,0.95)` fallback — works as IIFE widget on all browsers
- Bot bubble `background-color: transparent` — bare text on glass surface, matches Notion AI pattern
- User bubble text set to `#e8e6e1` explicitly (not `white`) — intentional per spec, single approved hardcode
- `LIGHT_THEME`/`DARK_THEME` exports removed from `widget/types/widget.ts`; they remain referenced in `widget/hooks/useWidgetTheme.ts` (dead code, not imported by any active file) — left untouched per plan instruction

## Deviations from Plan

### Auto-fixed Issues

None — plan executed exactly as written.

### Note on Verification Discrepancy

The plan's Task 3 done criteria states "LIGHT_THEME/DARK_THEME removed with no remaining references in widget/" but also states "Do not edit useWidgetTheme.ts (dead code)." These are contradictory. `useWidgetTheme.ts` contains 3 references to the removed exports. Since the file is confirmed dead code (grep shows zero imports across all active widget files), the safe resolution was to leave it untouched. The active compilation path has no references.

## Known Stubs

None — all CSS variables are fully wired to Okami brand values. DEFAULT_CONFIG propagates through the existing WidgetEmbed merge pattern to ThemeProvider automatically.

## Threat Flags

None — changes are CSS-only (themes.css, widget.css) and TypeScript constants (widget.ts). No new network endpoints, auth paths, or trust boundary changes introduced. The Google Fonts @import CDN surface was pre-approved in the plan's threat model as T-07-01 (accepted).

## Self-Check: PASSED

- widget/styles/themes.css: FOUND (32c5807)
- widget/styles/widget.css: FOUND (a6866fc)
- widget/types/widget.ts: FOUND (e0882dd)
- Outfit @import first line: VERIFIED
- #6878A0 in themes.css: VERIFIED
- No data-widget-theme selectors: VERIFIED
- backdrop-filter in widget.css: VERIFIED
- transparent bot bubble: VERIFIED
- rgba(15,15,15,0.95) in widget.ts: VERIFIED
- brand welcome message: VERIFIED
