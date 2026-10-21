# Waterline and dive instruments

The visual reference was [Deep Sea Descent](https://miaai-lab.github.io/Claude-Opus-5.5-100-HTML-Files/022-deep-sea-descent.html). The site uses its local font-family mix and the general idea of a floating instrument card with a slender progress rail. The résumé still follows a 0–100 metre freediving descent; it does not use the reference's ocean-zone layout, animals, source code or copy.

The serif stack starts with Iowan Old Style and falls back to Palatino or Georgia. The sans-serif stack starts with Avenir Next and falls back to Segoe UI or Helvetica. Numbers use the platform's monospace font. The same font definitions serve the landing page and print CV; no remote font download is needed.

The header's lower edge is the water surface. A transparent illustrated waterline crosses that boundary, with a thin foam edge and blue water below it. Its position follows ordinary document scrolling. GSAP adds a slow horizontal ripple that pauses offscreen and while the document is hidden. It is static under reduced motion. Lenis remains the only smooth-scroll engine. Three.js retains its existing underwater light-shaft role.

The original waterline artwork is `src/assets/comic-waterline.png`, generated with the built-in ImageGen tool on 8 October 2026, without reference images. Astro serves responsive WebP versions. The earlier original comic island is documented in [island-asset.md](island-asset.md).

The depth card reports the illustrated depth, approximate pressure (1 atmosphere at the surface plus 1 per 10 metres), and current résumé section. Its rail runs from 0 to 100. On smaller screens the card becomes a compact bottom readout. Without JavaScript the live gauge is hidden; section depths remain visible in the document.

## Waterline generation prompt

Use case: stylized-concept
Asset type: decorative transparent waterline strip for a vintage comic tropical island website.
Primary request: an extremely wide horizontal ocean surface viewed in cross-section at eye level, as a single gently undulating waterline, with a pale foam highlight and a narrow blue water band just under it.
Composition: landscape 3:1 image. Waterline runs continuously from the exact left edge to the exact right edge, horizontally at the vertical center of the frame. Only a few broad shallow undulations; maximum deviation from horizontal is 3% of image height. Both edge ends are level at the same center height. A very thin luminous pale ivory/cyan ink stroke traces the surface. Directly beneath the line there is a muted blue-teal water fill (#367d9d) that softly fades to true transparency toward the bottom edge. Everything above the waterline is genuinely transparent. This is a narrow cropped surface detail, not a seascape.
Style: vintage adventure comic print, restrained clean navy and turquoise ink with subtle halftone texture, delicate sunlit foam, a graphic illustrated water surface.
Constraints: no sky, no sun, no island, no animals, no objects, no text, no frame, no rectangular background, no photo, no 3D rendering, no large surf crests. Transparent outside the surface and water band. Image will be compressed vertically into a very shallow 24–40 pixel strip so the waterline itself must be very clear.
