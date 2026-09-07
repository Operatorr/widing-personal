import resume from '../data/resume.json';

export type Resume = typeof resume;
export type Work = Resume['work'][number];
export type Project = Resume['projects'][number];
export type Skill = Resume['skills'][number];
export type Education = Resume['education'][number];
export type Certificate = Resume['certificates'][number];

export { resume };

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "2025-02" -> "Feb 2025", "2014" -> "2014", "" -> "" */
export function formatDate(value?: string): string {
  if (!value) return '';
  const [year, month] = value.split('-');
  if (!month) return year;
  return `${MONTHS[Number(month) - 1]} ${year}`;
}

/** "2025-02" -> "2025" */
export function year(value?: string): string {
  return value ? value.split('-')[0] : '';
}

/** Inclusive span like "Feb 2025 – Present" */
export function dateRange(start?: string, end?: string, presentLabel = 'Present'): string {
  const s = formatDate(start);
  const e = end ? formatDate(end) : presentLabel;
  return s ? `${s} – ${e}` : e;
}

/** Whole months between two YYYY-MM values (end defaults to now). */
export function monthsBetween(start: string, end?: string): number {
  const [sy, sm = '1'] = start.split('-');
  const now = new Date();
  const [ey, em] = end ? end.split('-') : [String(now.getFullYear()), String(now.getMonth() + 1)];
  return (Number(ey) - Number(sy)) * 12 + (Number(em ?? '1') - Number(sm));
}

/** "2 yrs 3 mos" style duration label. */
export function duration(start: string, end?: string): string {
  const total = Math.max(1, monthsBetween(start, end));
  const y = Math.floor(total / 12);
  const m = total % 12;
  const parts: string[] = [];
  if (y) parts.push(`${y} yr${y > 1 ? 's' : ''}`);
  if (m) parts.push(`${m} mo${m > 1 ? 's' : ''}`);
  return parts.join(' ');
}

/** Years of professional software work, counted from the first tech role. */
export function yearsOfExperience(): number {
  const tech = resume.work.filter((w) => w.name !== 'Prior non-tech experience');
  const earliest = tech.reduce((min, w) => (w.startDate < min ? w.startDate : min), tech[0].startDate);
  return Math.floor(monthsBetween(earliest) / 12);
}

/** Split a full name into [first, rest]. */
export function splitName(name: string): [string, string] {
  const [first, ...rest] = name.split(' ');
  return [first, rest.join(' ')];
}

/** Work entries that are real tech roles (drops the "prior non-tech" line). */
export function techWork(): Work[] {
  return resume.work.filter((w) => w.name !== 'Prior non-tech experience');
}

/** Flat, de-duplicated list of every skill keyword. */
export function allKeywords(): string[] {
  return Array.from(new Set(resume.skills.flatMap((s) => s.keywords)));
}
