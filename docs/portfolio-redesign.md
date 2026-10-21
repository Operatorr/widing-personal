# Portfolio redesign

The direction is a warm, photographic introduction followed by a quiet editorial résumé. The supplied music-app reference informed the orange-to-cream light, large sans-serif type, central handset and transition to a dark section. The site uses original copy and assets, not the reference's artwork or interface.

## Page structure

Introduction and portrait → verified commit history → career → selected projects → technical skills → photography and personal background → education and languages → contact.

The hero states Alexander's role, Bangkok location and Swedish citizenship with EU work eligibility. Professional experience is calculated from the confirmed first developer job in September 2015 (`meta.professionalStartDate` in the résumé), which currently yields 11+ years. Earlier freelance and telecom work remains in the work history but is excluded from this count. The contribution section also shows 11 years of professional experience, separately from the chart's 2017 start date.

The main route uses `PortfolioLayout.astro` and `components/portfolio/`. The previous design files remain in place so the pre-existing uncommitted work is not lost. `temp/redesign-backup/pre-redesign.patch` also records the original tracked diff. The print résumé keeps its existing route and layout.

The projects section starts with four independent projects: DoMarrow, MarrowTalk, Vibe Translate and Ashen Omega. Each card has a website preview, a short description, technologies, status and a direct link. Ashen Omega is the existing MMO networking project; its technical details appear in the card's native disclosure. The remaining résumé projects follow in an expandable list. Portfolio card content lives in `src/data/portfolio-projects.ts`.

The anonymously named multi-tenant SaaS platform entry includes its companion Tauri/Rust desktop editor and Python translation pipeline. It leads with the platform's agent-first design: MCP tools and connectors across every module, including HR, Projects, Accounting and Knowledge. The highlights distinguish the SaaS infrastructure, the desktop's local SQLite and fuzzy retrieval, and the CLI's Postgres/pgvector embedding retrieval.

Projects use the site's black background; the toolkit section uses the warm beige paper background. Text, disclosure borders and focus accents follow each section's surface, while project cards keep their own brand colors.

MarrowTalk and Ashen Omega are marked as in development. Card colors, background glows, the 3px hover lift and 4px arrow movement follow the source in the sibling `marrowtech` repo. Hover motion uses 240ms CSS transitions with the site's easing token, runs only with a fine pointer, and removes movement for reduced motion. Keyboard focus shows the colored edge without moving the card.

Only the app names use brand fonts: Crimson Pro, Archivo, IBM Plex Sans and Cinzel, each at weight 600. The four local WOFF2 subsets contain just the letters in their respective titles (uppercase for Ashen Omega), totaling 8,668 bytes. Vite emits separate files with content hashes for caching; the page makes no Google Fonts requests. Body copy uses the site's system fonts. Run `npm run sync:project-fonts` after changing a title, updating the matching text in `scripts/sync-project-fonts.mjs` first. Font licenses are in `public/fonts/licenses/`.

## Assets

- `public/images/alexander-ember.webp`: generated portrait based on Alexander's `temp/studio_shot.jpg` and `temp/profile_photo.jpg`. The new lighting, clothing and background are AI-generated; the page labels the portrait accordingly. The original generated PNG is retained in the local image-generation output directory.
- `public/images/freediving-surface.webp`: supplied underwater view looking up at the divers, converted to WebP. The two freediving images share a swipeable carousel with arrows, keyboard navigation and position dots.
- `public/images/freediving-blue.webp`: supplied edited freediving portrait, `Freediver in the Deep Blue.png`, converted to WebP. The full frame is retained on desktop and mobile.
- `public/images/climbing-river.webp` and `public/images/climbing-summit.webp`: supplied climbing photographs, converted to WebP and displayed in a second carousel. Both galleries use matching 4:5 frames below the introduction, aligned side by side on desktop and stacked on mobile. The river image is aligned to its lower edge to keep the climber visible.
- UI symbols use the project's installed Solar icons through `astro-icon`.
- `public/images/projects/`: local WebP previews from MarrowTech. MarrowTalk and Vibe Translate use the hub's preview assets; DoMarrow and Ashen Omega use the screenshots linked by the hub, resized to 1280 × 800. The cards do not call a screenshot service at runtime.

## Motion and accessibility

GSAP handles the short hero entrance and section-heading movement. Lenis is the single smooth-scroll engine, retained because it is already installed and fits the native page structure; Locomotive would add an unnecessary replacement dependency. Touch scrolling stays native. Each photo carousel shows its second image when scrolling down across the point 48px from the viewport top, and returns to its first image when scrolling up across the same point. It only changes on a crossing, preserving manual navigation between crossings. Mobile galleries trigger independently; reduced motion uses an instant change. Reduced-motion mode bypasses both animation and smooth scrolling. No Three.js or WebGL is loaded on the new route.

The static HTML remains readable before scripts run. Experience and project disclosures are native `details` elements. Year buttons expose their selected state, update the URL and announce the selected year. Daily commit and repository counts appear in a shared tooltip and an accessible table. Day squares use a small lift and scale on hover, with a 160ms CSS transition for feedback. The tooltip enters in 125ms; moving to a neighbouring day updates it immediately. Keyboard focus and tapping also open it, Escape dismisses it, and arrow keys move between dates without hundreds of tab stops. Reduced motion removes the transforms. With JavaScript unavailable, all yearly calendars are shown and native titles remain available. No dropdowns are introduced.

Design review uses the installed `web-design-guidelines` skill alongside the site's art-direction skill. Content follows `docs/writing-style.md` when its conventions differ from general UI guidelines.

See `contribution-history.md` for the import process and credential setup.

## Verification

- Production build passes for `/` and `/cv`.
- Six import tests pass, covering commit and repository deduplication, UTC and leap-day dates, missing repository attribution, invalid records and invalid providers.
- Browser layout checked at 1440px, 1280px, 390px and 320px. No page-wide horizontal overflow at the checked widths; the calendar scrolls within its own region on phones.
- Year selection works with pointer input and with Tab followed by Enter. Selection persists in the URL, and empty years have an explicit message.
- Native experience and project disclosures, section anchors, loaded images and focus outlines were checked.
- The current chart has 10 calendars (2017–2026); the no-script fallback exposes every year.
- A reduced-motion media-query test bypasses Lenis and heading splitting while retaining the year controls.
- All three GitHub accounts and both Bitbucket accounts imported successfully. The combined archive contains 9,361 unique commits, with the first recovered date on 27 October 2013. Bitbucket added 3,254 commits beyond the GitHub archive. Reactivating three personal Bitbucket workspaces exposed 12 more repositories and recovered 76 additional commits. Deleted work repositories remain outside the archive; no records were recovered for 2012 or 2016.
- The displayed range contains 9,296 commits since 2017. Tooltip counts, empty and future dates, arrow-key navigation, Escape, year changes, hover persistence and mobile edge placement were checked. Layout has no page-wide horizontal overflow at 1440px, 390px and 320px. The reduced-motion CSS was applied in a browser check and removed both transforms.
