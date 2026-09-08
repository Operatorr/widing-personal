/** Depth (metres) for each section, and the page colour at that depth. */
export const DEPTHS = {
  hero: 0,
  summary: 5,
  experienceTop: 10,
  experienceBottom: 40,
  projects: 50,
  skills: 70,
  education: 85,
  notices: 95,
  contact: 100,
} as const;

/**
 * One line per section depth about what it means for a freediver.
 * Plain physics only: pressure is 1 atm at the surface plus 1 atm per 10 m.
 */
export const NOTES: Record<number, string> = {
  0: 'Surface. One breath.',
  5: 'The first equalisation.',
  10: 'Pressure doubles; lung volume halves.',
  50: 'Six atmospheres. Freefall.',
  70: 'Eight atmospheres. The light is nearly gone.',
  85: 'Dark. Nine and a half atmospheres.',
  95: 'Almost ten atmospheres.',
  100: 'A depth few divers reach.',
};

/** Each role in Experience, current one first. */
export const ROLE_DEPTHS = [10, 18, 25, 33, 40] as const;

const SURFACE = [6, 16, 28];
const ABYSS = [1, 2, 5];

/** Linear mix between surface and abyss for a depth from 0 to 100. */
export function depthColor(depth: number): string {
  const f = Math.min(1, Math.max(0, depth / 100));
  const c = SURFACE.map((s, i) => Math.round(s + (ABYSS[i] - s) * f));
  return `rgb(${c[0]} ${c[1]} ${c[2]})`;
}

/** Inline style for a section that darkens from one depth to the next. */
export function zoneStyle(from: number, to: number): string {
  return `--from:${depthColor(from)};--to:${depthColor(to)}`;
}

/** Depth for the i-th of n roles, spread from experienceTop to experienceBottom. */
export function roleDepth(i: number, n: number): number {
  if (i < ROLE_DEPTHS.length && n === ROLE_DEPTHS.length) return ROLE_DEPTHS[i];
  if (n <= 1) return DEPTHS.experienceTop;
  const span = DEPTHS.experienceBottom - DEPTHS.experienceTop;
  return Math.round(DEPTHS.experienceTop + (span * i) / (n - 1));
}
