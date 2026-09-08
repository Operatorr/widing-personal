# Site design: Descent

The live site is Descent: Ledger's type and layouts in Depth's dark water.
Scrolling the résumé is a descent. A metre gauge tracks the scroll, and the
hero is a WebGL light-shaft plane. Print stays at `/cv`.

Ledger, Depth, and Blueprint were candidate redesigns. They were removed when
Descent was promoted to `/`.

## Direction

- Thesis: Alexander coaches freedivers to national records and owns systems
  from selection to production. Scrolling the page is a descent.
- Type and layout from Ledger: Fraunces / Instrument Sans / IBM Plex Mono,
  nav strip, masthead, year rail, project grid, and classified skills index.
- Atmosphere from Depth: surface-to-abyss zone darkening, cyan accent with
  coral CTAs, the fixed metre gauge, per-section depths, and the Three.js
  light-shaft canvas behind the masthead, with the same safeguards and
  poster fallback.
- Palette: surface `#06101c`, abyss `#020509`, foam `#e6f1f5`, cyan `#5fd3ff`,
  coral `#ff7a59` for CTAs. Dark theme only.

## Stack

- Astro + Tailwind v4 + TypeScript. Site tokens live in `src/styles/site.css`.
- GSAP for animation. Lenis is the only smooth-scroll engine, wired to
  ScrollTrigger once per page and destroyed on `astro:before-swap` / `pagehide`.
- `prefers-reduced-motion: reduce` skips Lenis, skips scrubbed and pinned
  timelines, and renders final states immediately.
- Icons: Solar set through `astro-icon`.
