import type { YearMonth } from '../data/profile';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

function toIndex(ym: YearMonth | 'present', now = new Date()): number {
  if (ym === 'present') return now.getFullYear() * 12 + now.getMonth();
  const [y, m] = ym.split('-').map(Number);
  return y * 12 + (m - 1);
}

/** Inclusive month count, matching how LinkedIn counts durations. */
export function months(start: YearMonth, end: YearMonth | 'present'): number {
  return toIndex(end) - toIndex(start) + 1;
}

/** Total years across (possibly overlapping) periods, overlaps counted once. */
export function yearsAcross(ranges: [YearMonth, YearMonth | 'present'][]): number {
  const covered = new Set<number>();
  for (const [s, e] of ranges) for (let i = toIndex(s); i <= toIndex(e); i++) covered.add(i);
  return covered.size / 12;
}

/** Experience → level on a 1–100 curve: fast early gains, slow mastery (like an RPG). */
export function levelFor(years: number): number {
  return Math.max(1, Math.min(100, Math.round(100 * (1 - Math.exp(-years / 5)))));
}

export function formatYM(ym: YearMonth | 'present'): string {
  if (ym === 'present') return 'Present';
  const [y, m] = ym.split('-').map(Number);
  return `${MONTHS[m - 1]} ${y}`;
}

export function formatDuration(start: YearMonth, end: YearMonth | 'present'): string {
  const total = months(start, end);
  const y = Math.floor(total / 12);
  const m = total % 12;
  return [y && `${y} yr${y > 1 ? 's' : ''}`, m && `${m} mo`].filter(Boolean).join(' ') || '1 mo';
}
