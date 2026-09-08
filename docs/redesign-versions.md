# Site design: Depth

The live site is the Depth design: scrolling the résumé is a descent. Depth
increases with each section, a metre gauge tracks the scroll, and the hero is a
WebGL light-shaft plane. Print stays at `/cv`.

Ledger, Blueprint, and Descent were candidate redesigns. They were removed when
Depth was promoted to `/`.

## Direction

- Thesis: Alexander coaches freedivers to national records and owns systems
  from selection to production. Scrolling the page is a descent.
- Palette: surface `#06101c`, abyss `#020509`, foam `#e6f1f5`, cyan `#5fd3ff`,
  coral `#ff7a59` for CTAs. Dark theme only.
- Type: Bricolage Grotesque (display, opsz axis) for headlines; Figtree for
  body; Geist Mono for the gauge and metadata.
- Hero: a Three.js plane with a custom fragment shader (vertical light shafts
  and slow caustic ripple, pointer-responsive, DPR capped at 1.5, paused when
  hidden or offscreen). A static CSS gradient poster under reduced motion or
  WebGL failure.
- Signature element: a fixed depth gauge (metres) on the right edge that maps
  scroll progress to sections (0 m hero, deeper per section).

## Stack

- Astro + Tailwind v4 + TypeScript. Site tokens live in `src/styles/site.css`.
- GSAP for animation. Lenis is the only smooth-scroll engine, wired to
  ScrollTrigger once per page and destroyed on `astro:before-swap` / `pagehide`.
- `prefers-reduced-motion: reduce` skips Lenis, skips scrubbed and pinned
  timelines, and renders final states immediately.
- Icons: Solar set through `astro-icon`.
