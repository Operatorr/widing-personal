# Alexander Widing - Personal CV

A modern, responsive CV/portfolio website built with Astro and Tailwind CSS.

## Live Demo

[widing.dev](https://widing.dev)

## Tech Stack

- **Framework**: [Astro](https://astro.build/) - Static site generator
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) - Utility-first CSS
- **Components**: [shadcn/ui](https://ui.shadcn.com/) - Accessible component library
- **Data Format**: [JSON Resume](https://jsonresume.org/) standard
- **Language**: TypeScript

## Features

- Responsive design (mobile, tablet, desktop)
- Print-friendly styling for PDF export
- Data-driven content via `resume.json`
- No JavaScript runtime (static HTML)
- Type-safe components

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

Edit `src/data/resume.json` to update your CV content. The file follows the [JSON Resume schema](https://jsonresume.org/schema/).

## Project Structure

```
src/
  pages/index.astro       Main page (current live design)
  pages/cv.astro          Print page
  pages/versions.astro    Picker for the three candidate redesigns
  pages/v/                One route per candidate redesign
  versions/               Candidate redesigns: ledger, depth, blueprint, descent
  layouts/                Page layouts
  components/             Resume section components
  lib/resume.ts           Typed resume data and date helpers
  data/resume.json        CV data
  styles/global.css       Global styles
```

## Candidate redesigns

Four full redesigns live at `/v/ledger`, `/v/depth`, `/v/blueprint` and `/v/descent`, with a picker at
`/versions`. See [docs/redesign-versions.md](docs/redesign-versions.md) for the direction of each
and the steps to keep one.

## License

MIT
