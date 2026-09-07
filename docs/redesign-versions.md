# Résumé redesign: three candidate versions

Four full redesigns of the online résumé live side by side so one can be picked and kept.
All three read from the same `src/data/resume.json`, share the helpers in `src/lib/resume.ts`,
and link to the print page at `/cv`. Nothing under `src/components/` or the current
`src/pages/index.astro` is touched until a version is chosen.

| Version   | Route          | Files                                     | Idea in one line |
| --------- | -------------- | ----------------------------------------- | ---------------- |
| Ledger    | `/v/ledger`    | `src/versions/ledger/`, `src/pages/v/ledger.astro`    | A light editorial broadsheet: the career as a printed masthead and a pinned year rail. |
| Depth     | `/v/depth`     | `src/versions/depth/`, `src/pages/v/depth.astro`      | A dark descent: scrolling is a freedive, with a depth gauge and a WebGL light-shaft hero. |
| Blueprint | `/v/blueprint` | `src/versions/blueprint/`, `src/pages/v/blueprint.astro` | A technical drawing: the career laid out as a system diagram on concrete and safety yellow. |
| Descent   | `/v/descent`   | `src/versions/descent/`, `src/pages/v/descent.astro`  | Ledger's type and layouts in Depth's dark palette, with the freedive gauge, descending zones and the light-shaft hero. |

A picker at `/versions` links to all four.

## Shared rules for every version

- Astro + Tailwind v4 + TypeScript. Each version has its own `styles.css` that starts with
  `@import "tailwindcss";` and defines its own tokens. Do not import `src/styles/global.css`.
- GSAP is the animation system. Lenis is the only smooth-scroll engine (Locomotive Scroll is
  not installed and must not be). Wire Lenis to ScrollTrigger once per page and destroy it on
  `astro:before-swap` / `pagehide`.
- `prefers-reduced-motion: reduce` skips Lenis, skips scrubbed and pinned timelines, and renders
  final states immediately.
- Split-text headings keep an unsplit accessible name (`aria-label` on the heading, split spans
  `aria-hidden="true"`), and render fully without JavaScript.
- Icons: Solar set through `astro-icon` (`<Icon name="solar:..." />`). No hand-drawn SVG
  illustrations. Simple brand marks, interface icons, and data graphics are fine.
- No photos of people, no avatars, no logo walls, no testimonials: there is no honest source for
  them. No stock imagery.
- Copy follows `docs/writing-style.md`. Section headings in sentence case.
- Every version is a complete page: nav, hero, summary, experience, projects, skills, education,
  certificates, languages, interests, a final contact CTA, and a footer. Keyboard focus is visible.

## Direction per version

### Ledger (light, editorial)

- Thesis: a résumé is a printed document. Treat the page as a broadsheet with a masthead, rules,
  folios, and a running year index. Restraint and typographic precision carry the design.
- Palette: warm paper `#f4f1ea`, ink `#141311`, one accent, a red-orange `#d24b1e`, plus a
  muted rule grey. Light theme only.
- Type: Fraunces (display, optical sizing, soft serif) for headlines and the masthead; Instrument
  Sans for body and labels; IBM Plex Mono for dates and folios.
- Hero: the name set as a masthead across the full width at 12 to 18vw, the label and location
  set small beneath a hairline. A GSAP intro draws the rules and lifts the masthead words in.
- Signature section: a pinned two-column experience section where a left rail of years scrubs
  and highlights as the roles on the right scroll past.
- Three.js: none. Justification: type and rules are the whole idea.

### Depth (dark, WebGL)

- Thesis: Alexander coaches freedivers to national records and owns systems "from selection to
  production". Scrolling the page is a descent. Depth increases with each section.
- Palette: surface `#06101c`, abyss `#020509`, foam `#e6f1f5`, cyan `#5fd3ff`, and one warm
  accent for CTAs, coral `#ff7a59`. Dark theme only.
- Type: Bricolage Grotesque (display, opsz axis) for headlines; Figtree for body; Geist Mono for
  the gauge and metadata.
- Hero: a Three.js plane with a custom fragment shader: vertical light shafts and slow caustic
  ripple, pointer-responsive (throttled), DPR capped at 1.5, paused when hidden or offscreen,
  static CSS gradient poster under reduced motion or WebGL failure. Renderer, geometry,
  material and listeners are disposed on cleanup. The canvas has one job: depth.
- Signature element: a fixed depth gauge (metres) on the right edge that maps scroll progress
  to sections (0 m hero, deeper per section). Section headers carry their depth.
- Colour darkens per section as the page descends.

### Blueprint (mid-tone, technical)

- Thesis: a solutions architect draws systems. Lay the career out like an architecture drawing:
  labelled boxes, connectors, dimension lines, a title block. Tone is industrial, not playful.
- Palette: concrete `#d9d6cf`, bone `#ece9e1`, slate `#1f2328`, and safety yellow `#f2c318`.
  Mostly light, with slate panels.
- Type: Archivo (variable, use the width axis: expanded for headings, condensed for labels);
  Source Serif 4 for reading copy; Martian Mono for callouts and the title block.
- Hero: a title block (name, role, revision, date, location) in the corner and a large
  drawn-in-on-load diagram of the current stack: nodes for the roles and the systems built,
  connectors that draw themselves with GSAP (this is a data graphic, allowed).
- Signature section: a pinned horizontal-scroll strip of the work history rendered as layers
  of a system, each role a labelled panel with its dimension line of dates.
- Three.js: none. Justification: the drawing metaphor is 2D by nature.

### Descent (Ledger layouts, Depth atmosphere)

- Built after a review round: the owner preferred Ledger's type, layouts and project grid but
  wanted Depth's colours and freedive metaphor. Descent keeps Ledger's Fraunces / Instrument Sans /
  IBM Plex Mono, nav strip, masthead, year rail, project grid and classified skills index.
- From Depth: the surface-to-abyss zone darkening, cyan accent with coral CTAs, the fixed metre
  gauge, per-section depths, and the Three.js light-shaft canvas behind the masthead with the same
  safeguards and poster fallback.
- The content wrap is wider than Ledger's and shares its width with the nav strip.

## Picking one

1. Open `/versions` and compare.
2. Move the chosen version's page content into `src/pages/index.astro` (or import its layout
   from there), delete the other `src/versions/*` folders and their `src/pages/v/*` pages,
   and delete `src/pages/versions.astro`.
3. Remove the old `src/components/*.astro` section components and `src/layouts/BaseLayout.astro`
   if the chosen version does not use them.
