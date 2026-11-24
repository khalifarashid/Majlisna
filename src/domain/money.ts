import type { Lang } from './types';

/** Majlisna keeps this share of every completed paid vendor service. */
export const COMMISSION_RATE = 0.08;

const round2 = (n: number) => Math.round(n * 100) / 100;

export interface CommissionSplit {
  gross: number;
  fee: number;
  vendor: number;
}

/** Split a paid vendor service into the Majlisna fee and the vendor payout. */
export function splitCommission(amount: number, rate: number = COMMISSION_RATE): CommissionSplit {
  const fee = round2(amount * rate);
  return { gross: amount, fee, vendor: round2(amount - fee) };
}

const NUMBER = new Intl.NumberFormat('en-US', { maximumFractionDigits: 2 });

/** Format a dirham amount. English: `AED 1,000`; Arabic: `1,000 د.إ`. Negatives use brackets. */
export function formatAED(n: number, lang: Lang): string {
  const body = NUMBER.format(Math.abs(n));
  const text = lang === 'ar' ? `${body} د.إ` : `AED ${body}`;
  return n < 0 ? `(${text})` : text;
}

/** Compact form for charts and KPI tiles: `AED 543K`, `AED 6.8M`. */
export function formatAEDCompact(n: number, lang: Lang): string {
  const abs = Math.abs(n);
  const body =
    abs >= 1_000_000
      ? `${round1(abs / 1_000_000)}M`
      : abs >= 10_000
        ? `${Math.round(abs / 1000)}K`
        : NUMBER.format(Math.round(abs));
  const text = lang === 'ar' ? `${body} د.إ` : `AED ${body}`;
  return n < 0 ? `(${text})` : text;
}

const round1 = (n: number) => Math.round(n * 10) / 10;

export function formatNumber(n: number): string {
  return NUMBER.format(n);
}
