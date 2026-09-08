/** Depth (metres) for each section, and the background colour at that depth. */
export const DEPTHS = {
  hero: 0,
  summary: 5,
  experienceTop: 10,
  experienceBottom: 40,
  projects: 50,
  skills: 70,
  education: 85,
  extras: 95,
  contact: 100,
} as const;

const SURFACE = [6, 16, 28];
const ABYSS = [2, 5, 9];

/** Linear mix between surface and abyss for a depth from 0 to 100. */
export function depthColor(depth: number): string {
  const f = Math.min(1, Math.max(0, depth / 100));
  const c = SURFACE.map((s, i) => Math.round(s + (ABYSS[i] - s) * f));
  return `rgb(${c[0]} ${c[1]} ${c[2]})`;
}

/** "— 10 m" label for a section header. */
export function depthLabel(depth: number): string {
  return `— ${depth} m`;
}

/** Depth for the i-th of n roles, spread from experienceTop to experienceBottom. */
export function roleDepth(i: number, n: number): number {
  if (n <= 1) return DEPTHS.experienceTop;
  const span = DEPTHS.experienceBottom - DEPTHS.experienceTop;
  return Math.round(DEPTHS.experienceTop + (span * i) / (n - 1));
}
