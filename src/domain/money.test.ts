import { describe, expect, it } from 'vitest';
import { formatAED, splitCommission } from './money';

describe('splitCommission', () => {
  it('keeps 8% for Majlisna and 92% for the vendor by default', () => {
    expect(splitCommission(1000)).toEqual({ gross: 1000, fee: 80, vendor: 920 });
  });

  it('matches the average service in the plan (AED 2,262.50 -> AED 181)', () => {
    expect(splitCommission(2262.5).fee).toBe(181);
  });

  it('accepts a custom rate and rounds to fils', () => {
    expect(splitCommission(1750, 0.075)).toEqual({ gross: 1750, fee: 131.25, vendor: 1618.75 });
  });
});

describe('formatAED', () => {
  it('formats English with the AED prefix', () => {
    expect(formatAED(339375, 'en')).toBe('AED 339,375');
  });

  it('formats negatives in brackets like the workbook', () => {
    expect(formatAED(-98450, 'en')).toBe('(AED 98,450)');
  });

  it('formats Arabic with the dirham sign after the number', () => {
    expect(formatAED(2100, 'ar')).toBe('2,100 د.إ');
  });
});
