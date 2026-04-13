# Homepage Hero Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing homepage hero with a full-viewport animated hero featuring a centered headline, atmospheric background, and a corner-bracket CTA button.

**Architecture:** A `HeroSection` client component owns the animation trigger (adds `.hero-playing` class on mount via `useEffect`). Animation keyframes live in `globals.css`. The component is self-contained — no props, no shared state.

**Tech Stack:** Next.js 14 App Router, Tailwind CSS v4, CSS keyframe animations, TypeScript

---

## Session Context (read before starting)

This plan was written after a brainstorming + design session. Several files were written during that session as a rough draft. **Treat all existing implementations as drafts to verify against this plan, not as completed work.**

Files written in-session (verify each against the spec):
- `app/globals.css` — animation keyframes added
- `components/HeroSection.tsx` — hero client component
- `components/index.ts` — HeroSection exported
- `app/page.tsx` — imports HeroSection, updated copy throughout

Design spec: `docs/superpowers/specs/2026-04-06-homepage-hero-design.md`

---

## File Map

| File | Action | Responsibility |
|------|--------|----------------|
| `app/globals.css` | Modify | Hero animation keyframes + base opacity state |
| `components/HeroSection.tsx` | Create/verify | Animated hero markup, animation trigger |
| `components/index.ts` | Modify | Export HeroSection |
| `app/page.tsx` | Modify | Replace old hero section with `<HeroSection />` |

---

## Task 1: Animation keyframes in globals.css

**Files:**
- Modify: `app/globals.css`

- [ ] **Step 1: Open globals.css and verify (or add) the following keyframes and classes.** They must appear before `@layer base`. The complete block:

```css
/* ── Hero animation ── */
@keyframes hero-surge-transform {
  0%   { transform: scale(0.91) translateY(10px); filter: blur(4px); }
  55%  { filter: blur(0.5px); }
  100% { transform: scale(1) translateY(0); filter: blur(0); }
}
@keyframes hero-surge-fade {
  0%   { opacity: 0; }
  100% { opacity: 1; }
}
@keyframes hero-eyebrow-in {
  0%   { opacity: 0; transform: translateY(6px); }
  100% { opacity: 1; transform: translateY(0); }
}
@keyframes hero-cta-in {
  0%   { opacity: 0; transform: translateY(8px); }
  100% { opacity: 1; transform: translateY(0); }
}

/* Elements start invisible — JS adds .hero-playing to trigger animations */
.hero-eyebrow,
.hero-headline,
.hero-cta {
  opacity: 0;
}

.hero-playing .hero-eyebrow {
  animation: hero-eyebrow-in 0.8s ease forwards 0.15s;
}
.hero-playing .hero-headline {
  animation:
    hero-surge-transform 1.85s cubic-bezier(0.16, 1, 0.3, 1) forwards 0.35s,
    hero-surge-fade 2.5s linear forwards 0.35s;
}
.hero-playing .hero-cta {
  animation: hero-cta-in 0.7s ease forwards 1.55s;
}
```

- [ ] **Step 2: Verify the file compiles without error**

```bash
cd /Users/lucas/projects/website-v3
npm run build 2>&1 | head -30
```

Expected: no CSS parse errors.

- [ ] **Step 3: Commit**

```bash
git add app/globals.css
git commit -m "add hero animation keyframes to globals.css"
```

---

## Task 2: HeroSection component

**Files:**
- Create/verify: `components/HeroSection.tsx`

The component must:
- Be a `'use client'` component
- Use `useRef` to get a reference to the section element
- Use `useEffect` to add `hero-playing` class on mount via `requestAnimationFrame`
- Render three children with the correct class names: `.hero-eyebrow`, `.hero-headline`, `.hero-cta`
- Use the corner-bracket CTA pattern (two pseudo-elements via Tailwind `before:`/`after:` — but since pseudo-elements can't be transitioned in Tailwind easily, use two explicit `<span>` elements with absolute positioning)

- [ ] **Step 1: Write the component**

```tsx
'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';

export default function HeroSection() {
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (el) requestAnimationFrame(() => el.classList.add('hero-playing'));
  }, []);

  return (
    <section
      ref={ref}
      className="min-h-screen flex items-center justify-center px-6 lg:px-8 relative overflow-hidden"
    >
      {/* Atmosphere: dual radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 75% 85% at 50% 50%, rgba(139,58,58,0.045) 0%, rgba(104,120,160,0.04) 40%, transparent 70%)',
        }}
      />
      {/* Grain texture */}
      <div
        className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.025'/%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center">
        {/* Eyebrow */}
        <div className="hero-eyebrow flex items-center gap-3 mb-9 font-mono text-xs tracking-[0.32em] uppercase text-off-white">
          <span className="block w-5 h-px bg-off-white/25" />
          Okami
          <span className="block w-5 h-px bg-off-white/25" />
        </div>

        {/* Headline */}
        <h1 className="hero-headline font-playfair text-5xl md:text-7xl lg:text-8xl text-off-white leading-[1.1] tracking-[0.04em] uppercase max-w-5xl">
          The Silent Giant
          <br />
          Behind Modern Business
        </h1>

        {/* CTA */}
        <div className="hero-cta mt-[52px]">
          <Link
            href="/contact"
            className="group relative inline-flex items-center gap-3 px-[22px] py-3 font-mono text-sm tracking-[0.18em] uppercase text-off-white"
          >
            {/* Top-left corner bracket */}
            <span className="absolute top-0 left-0 w-[10px] h-[10px] border-t border-l border-off-white/50 transition-all duration-300 group-hover:w-4 group-hover:h-4 group-hover:border-off-white/90" />
            {/* Bottom-right corner bracket */}
            <span className="absolute bottom-0 right-0 w-[10px] h-[10px] border-b border-r border-off-white/50 transition-all duration-300 group-hover:w-4 group-hover:h-4 group-hover:border-off-white/90" />
            Book a Consultation
            <span className="text-ash transition-transform duration-300 group-hover:translate-x-1 group-hover:text-off-white">
              →
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
npx tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add components/HeroSection.tsx
git commit -m "add HeroSection client component with surge animation"
```

---

## Task 3: Export HeroSection from components index

**Files:**
- Modify: `components/index.ts`

- [ ] **Step 1: Verify HeroSection is exported**

`components/index.ts` must contain:

```ts
export { default as HeroSection } from './HeroSection';
```

Add it if missing.

- [ ] **Step 2: Commit if changed**

```bash
git add components/index.ts
git commit -m "export HeroSection from components index"
```

---

## Task 4: Wire HeroSection into homepage

**Files:**
- Modify: `app/page.tsx`

- [ ] **Step 1: Replace the old hero section**

Remove the existing `<section className="min-h-screen flex flex-col items-center justify-center ...">` block and replace with:

```tsx
import { HeroSection, Card, CTASection, FadeIn, NewsletterForm } from '@/components';

// Inside <main>:
<HeroSection />
```

The rest of `page.tsx` (problem section, two arms, etc.) remains unchanged.

- [ ] **Step 2: Start the dev server and verify visually**

```bash
npm run dev
```

Open `http://localhost:3000`. Check:
- Page loads with all three elements invisible
- Eyebrow ("OKAMI") fades up first (~0.15s delay)
- Headline surges in over ~2.5s (slow opacity fade, faster scale+blur)
- CTA appears ~1.55s after page load
- Hovering the CTA: corner brackets expand + brighten, arrow slides right

- [ ] **Step 3: Check mobile**

Resize to 375px wide. Verify:
- Headline wraps cleanly to two lines
- CTA button text doesn't overflow
- Spacing feels proportional

- [ ] **Step 4: Commit**

```bash
git add app/page.tsx
git commit -m "replace homepage hero with animated HeroSection component"
```

---

## Self-Review

**Spec coverage:**
- ✅ Centered layout, full viewport height
- ✅ Eyebrow: "OKAMI", JetBrains Mono, off-white, flanked by rules, `tracking-[0.32em]`
- ✅ Headline: Playfair Display, uppercase, `letter-spacing: 0.04em`, 2-line break
- ✅ No subheader
- ✅ CTA: corner bracket (top-left + bottom-right), off-white corners, arrow, hover state
- ✅ Hover: corners expand to 16px, brighten to 0.9 opacity, arrow translates 4px right
- ✅ Atmosphere: dual radial glow + grain texture
- ✅ Animation sequence and timing (see spec table)
- ✅ Two separate animations on headline (transform/blur decoupled from opacity)
- ✅ No division colors (no slate-blue, no burgundy) in hero

**Placeholder scan:** None found.

**Type consistency:** `ref` typed as `HTMLElement`, `useRef<HTMLElement>(null)` — consistent with `<section ref={ref}>`.
