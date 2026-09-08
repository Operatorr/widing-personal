# Alexander Widing - Personal CV

A CV/portfolio site built with Astro and Tailwind CSS. The live page is a
dark descent: Ledger's editorial type and layouts in deep water, with a
metre gauge and a WebGL light-shaft hero. Content comes from JSON Resume
data.

## Live Demo

[widing.dev](https://widing.dev)

## Tech Stack

- **Framework**: [Astro](https://astro.build/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Motion**: GSAP, Lenis, and a Three.js hero shader
- **Data Format**: [JSON Resume](https://jsonresume.org/)
- **Language**: TypeScript

## Features

- Responsive design (mobile, tablet, desktop)
- Print-friendly page at `/cv` for PDF export
- Data-driven content via `resume.json`
- Reduced-motion fallbacks (no Lenis, no WebGL, final states on first paint)

## Getting Started

### Prerequisites

- Node.js 18+
- npm or pnpm

### Installation

```bash
git clone https://github.com/Operatorr/widing-personal.git
cd widing-personal
npm install
npm run dev
```

### Available Scripts

| Command           | Description              |
| ----------------- | ------------------------ |
| `npm run dev`     | Start development server |
| `npm run build`   | Build for production     |
| `npm run preview` | Preview production build |

## Customization

Edit `src/data/resume.json` to update the CV content. The file follows the
[JSON Resume schema](https://jsonresume.org/schema/).

## Project Structure

```
src/
  pages/index.astro       Main page
  pages/cv.astro          Print page
  layouts/                Page layouts
  components/             Resume sections, nav, gauge
  scripts/                Motion, hero WebGL, marine snow
  lib/resume.ts           Typed resume data and date helpers
  lib/depth.ts            Section depths and zone colours
  data/resume.json        CV data
  styles/site.css         Live-page tokens and styles
  styles/print.css        Print-page Tailwind
```

See [docs/redesign-versions.md](docs/redesign-versions.md) for the art direction.

## License

MIT
