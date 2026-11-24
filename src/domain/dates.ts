import type { ISODate } from './types';

/** All date maths runs in UTC on `YYYY-MM-DD` strings so time zones never shift a day. */

export function toISO(d: Date): ISODate {
  return d.toISOString().slice(0, 10);
}

export function fromISO(iso: ISODate): Date {
  return new Date(`${iso}T00:00:00Z`);
}

export function todayISO(now: Date = new Date()): ISODate {
  // Local calendar day, expressed as an ISO date.
  const local = new Date(Date.UTC(now.getFullYear(), now.getMonth(), now.getDate()));
  return toISO(local);
}

export function addDays(iso: ISODate, n: number): ISODate {
  const d = fromISO(iso);
  d.setUTCDate(d.getUTCDate() + n);
  return toISO(d);
}

/** 0 = Sunday ... 6 = Saturday. */
export function weekday(iso: ISODate): number {
  return fromISO(iso).getUTCDay();
}

export function diffDays(a: ISODate, b: ISODate): number {
  return Math.round((fromISO(a).getTime() - fromISO(b).getTime()) / 86_400_000);
}

/** Thursday, Friday and Saturday evenings are the usual wedding nights. */
export function isPreferredWeddingDay(iso: ISODate): boolean {
  const d = weekday(iso);
  return d === 4 || d === 5 || d === 6;
}

export function monthGrid(year: number, month: number): (ISODate | null)[] {
  // Weeks start on Sunday. Returns 6x7 cells; null pads outside the month.
  const first = new Date(Date.UTC(year, month, 1));
  const start = first.getUTCDay();
  const days = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const cells: (ISODate | null)[] = [];
  for (let i = 0; i < start; i++) cells.push(null);
  for (let d = 1; d <= days; d++) cells.push(toISO(new Date(Date.UTC(year, month, d))));
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

export function formatDate(iso: ISODate, lang: 'en' | 'ar', opts: Intl.DateTimeFormatOptions = { weekday: 'short', day: 'numeric', month: 'short' }): string {
  const locale = lang === 'ar' ? 'ar-AE-u-nu-latn' : 'en-GB';
  return new Intl.DateTimeFormat(locale, { ...opts, timeZone: 'UTC' }).format(fromISO(iso));
}

export function formatRelative(ts: number, lang: 'en' | 'ar', now: number = Date.now()): string {
  const rtf = new Intl.RelativeTimeFormat(lang === 'ar' ? 'ar' : 'en', { numeric: 'auto' });
  const s = Math.round((ts - now) / 1000);
  const abs = Math.abs(s);
  if (abs < 60) return rtf.format(Math.round(s), 'second');
  if (abs < 3600) return rtf.format(Math.round(s / 60), 'minute');
  if (abs < 86400) return rtf.format(Math.round(s / 3600), 'hour');
  return rtf.format(Math.round(s / 86400), 'day');
}
