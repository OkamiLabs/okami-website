# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Okami Labs Website (okamilabs.com)** - A credibility anchor and trust signal for outreach, not a sales funnel. Primary goal: visitors understand what Okami is and book a consultation.

**Tech Stack:**

- Next.js on Vercel
- Cal.com for booking integration
- Domain: okamilabs.com

## Brand Identity & Design Requirements

### Core Philosophy

- **"Silent Business"** - fixing operational foundations before implementing AI
- **"Silent Giant"** - massive impact without noise
- Named after the wolf (Okami = wolf in Japanese)

### Visual Identity

- **Logo:** Wolf head on black background
- **Fonts:**
  - JetBrains Mono (technical, monospaced)
  - Playfair Display (editorial, sophisticated)
- **Backgrounds:** Dark (#0a0a0a)
- **No imagery:** No hero photos, stock images, or abstract graphics. Typography and whitespace do the visual work.

### Color Palette

| Color      | Hex       | Role                                                         |
| ---------- | --------- | ------------------------------------------------------------ |
| Slate Blue | `#6878A0` | Primary accent — buttons, links, hover states, Labs identity |
| Burgundy   | `#8B3A3A` | Secondary accent — Consulting identity, emphasis moments     |
| Ash        | `#9A918A` | Body text, secondary labels, ghost buttons, neutral layer    |
| Off-white  | `#e8e6e1` | Headings, logo, high-emphasis text                           |

**Important:** No gold, teal, or bright/saturated colors.

### Design Principles

- Stripped-back aesthetic using typography and whitespace
- Every element earns its place - no carousels, stock photos, or filler
- Generous whitespace with strong typography hierarchy
- Minimal animations (one or two subtle fade-on-scroll at most)
- **Color coding:** Consulting sections use Burgundy accents, Labs sections use Slate Blue

## Site Structure

Six pages total:

1. **Home** - Does 80% of the work, most visitors won't go deeper
2. **About** - Human story, philosophy, founder background
3. **Services (Consulting)** - Consulting approach, The Okami Review as centerpiece
4. **Products (Labs)** - Okami Agent Core platform, capability areas
5. **What We're Building** - Shows momentum, business outcomes (not technical details)
6. **Contact** - Cal.com embed only, no contact form or direct email

### Global Elements

- **Navigation:** Wolf logo (left) + page links (right). JetBrains Mono, small caps/uppercase
- **Footer:** Minimal copyright and domain
- **CTA Pattern:** Every page ends with a call to action routing to booking

## Key Content Guidelines

### Voice & Tone

- **Brand voice** throughout (not first person) - "Okami was founded on..." not "I built Okami..."
- Present but understated - company feels bigger without pretending
- Confident statements, not sales pitches
- Frame around business outcomes, not technical details

### Critical Content Points

**Home Page:**

- Hero captures Silent Business philosophy
- Problem section: noisy AI adoption without operational change
- Two Arms section: Consulting (Burgundy) + Labs (Slate Blue)
- The Okami Review callout as tangible starting point
- Credibility signal: web dev + IT ops + AI systems background
- Philosophy anchor as pull quote

**Services Page (Consulting):**

- The Okami Review is the centerpiece - where every engagement starts
- Placeholder for slide deck preview (swap in real output when ready)
- Areas of focus are capability zones, not packaged services
- Simple three-step flow: Talk → Diagnose → Recommend

**Products Page (Labs):**

- Okami Agent Core as platform, not collection of tools
- Shared base architecture, agents extend through configuration
- Three capability cards: Internal ops, Sales/lead intake, Retention/customer follow-up
- Each card shows status indicator and "Powered by Okami Agent Core"
- Simple architecture diagram showing Agent Core at center

**What We're Building:**

- Three business scenarios with status indicators
- Agents stay invisible - only business outcomes are visible
- Newsletter placeholder (can be non-functional at launch)

**Contact:**

- Single conversion path: Cal.com booking only
- No contact form, no direct email displayed
- Newsletter placeholder for future updates

## Architecture Notes

### Platform Model

- **Okami Agent Core:** Shared base architecture for all agents
- All agents extend through configuration, not custom builds
- Deployable and repeatable across capability areas
- Platform-first positioning: show the system, not individual tools

### Integration Requirements

- Cal.com embedded on Contact page
- Cal.com booking buttons linked from CTAs across all pages
- Dark theme styling must match site background

## Development Priorities

1. Typography hierarchy must be impeccable (Playfair Display + JetBrains Mono)
2. Whitespace is a design element, not empty space
3. Burgundy vs Slate Blue color coding must be consistent (Consulting vs Labs)
4. Minimal animations - restraint is more important than polish
5. Mobile responsiveness required
6. No feature bloat - every element must earn its place

## Git Commit Guidelines

- Never include references to Claude, AI assistance, or co-authorship in commit messages
- Keep commit messages focused on the change itself, not the tooling used to make it

## Tools & Plugins

- Use the `frontend-designer` MCP plugin for all UI component generation, layout decisions, and design system work. Do not generate frontend code without consulting it first.

## Reference Document

Complete design and content decisions are documented in `okami-website-spec_1.md`. Refer to this spec for all page-specific content, section ordering, and detailed copy guidance.
