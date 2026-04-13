# Homepage Hero Redesign

**Date:** 2026-04-06  
**Scope:** Hero section of `app/page.tsx` only  
**Status:** Approved, ready for implementation

---

## What's Changing

Replacing the current two-line question headline ("Your business runs. But could it scale?") and its subheader + dual CTA with a single, declarative headline, no subheader, and one CTA. The new hero is impact-first — the headline carries all the weight.

---

## Layout

- Full viewport height (`min-h-screen`), centered vertically and horizontally
- Three elements stacked with center alignment: eyebrow → headline → CTA
- Spacing between each element is generous (~36px eyebrow→headline, ~52px headline→CTA at mockup scale — roughly 2× the previous values)
- No subheader copy

---

## Elements

### Eyebrow
- Text: `OKAMI`
- Font: JetBrains Mono, uppercase, wide letter-spacing (`0.32em`)
- Color: off-white (`#e8e6e1`)
- Flanked by short horizontal rules in muted off-white (`rgba(232,230,225,0.25)`)
- No division colors (no slate-blue, no burgundy)

### Headline
- Text: `THE SILENT GIANT BEHIND MODERN BUSINESS`
- Font: Playfair Display, weight 400, uppercase, `letter-spacing: 0.04em`, `line-height: 1.1`
- Color: off-white (`#e8e6e1`)
- Breaks naturally across two lines at large sizes
- No subheader follows

### CTA Button
- Text: `Book a Consultation →`
- Font: JetBrains Mono, uppercase, `letter-spacing: 0.18em`
- Color: off-white text, ash arrow (`#9A918A`)
- Style: corner bracket — top-left and bottom-right corners only (`width/height: 10px`), `border: 1px solid rgba(232,230,225,0.5)`. No full border box.
- **Hover state:**
  - Corners expand to `16px × 16px`
  - Corner border brightens to `rgba(232,230,225,0.9)`
  - Arrow translates `4px` right and shifts to off-white
  - All transitions: `0.3s ease`

---

## Background Atmosphere

Two subtle layers added to the hero background (no solid fills, no imagery):

1. **Radial glow** — centered, `75% × 85%` of the section, very low opacity gradient blending burgundy and slate-blue toward transparent. Decorative only, pointer-events none.
2. **Grain texture** — SVG fractalNoise overlay at ~4% opacity. Adds depth without visible pattern.

Both layers are purely atmospheric and should not be perceptible as distinct design elements — only felt.

---

## Animation Sequence

All animations trigger on page load. No scroll trigger.

| Element  | Animation | Duration | Delay | Easing |
|----------|-----------|----------|-------|--------|
| Eyebrow  | Fade + translateY(6px → 0) | 0.8s | 0.15s | ease |
| Headline (transform) | Scale(0.91→1) + translateY(10px→0) + blur(4px→0) | 1.85s | 0.35s | cubic-bezier(0.16, 1, 0.3, 1) |
| Headline (opacity) | 0 → 1 | 2.5s | 0.35s | linear |
| CTA | Fade + translateY(8px → 0) | 0.7s | 1.55s | ease |

The headline uses **two separate CSS animations** — transform/blur and opacity run independently so the slow fade doesn't feel tied to the motion speed.

---

## What's Not Changing

- Navigation and footer are untouched
- All sections below the hero (problem, two arms, diagnostic callout, credibility, philosophy, final CTA) are untouched
- No changes to global CSS, fonts, or color tokens
