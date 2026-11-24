import { describe, expect, it } from 'vitest';
import { BASE_2026, BASE_2027, runForecast } from './forecast';

// Every expected number below is copied from "Majlsna Income statment and balance sheet.xlsx".
describe('runForecast reproduces the workbook', () => {
  it('2026 pilot: one majlis, 150 orders', () => {
    const r = runForecast(BASE_2026);
    expect(r.orders).toBe(150);
    expect(r.gross).toBe(339375);
    expect(r.revenue).toBe(27150);
    expect(r.costOfServices).toBe(10000);
    expect(r.grossProfit).toBe(17150);
    expect(r.opexTotal).toBe(115600);
    expect(r.net).toBe(-98450);
    expect(r.perOrderCommission).toBe(181);
    expect(r.breakEvenOrders).toBe(694);
  });

  it('2027 rollout: 20 majlises, 3,000 orders', () => {
    const r = runForecast(BASE_2027);
    expect(r.orders).toBe(3000);
    expect(r.gross).toBe(6787500);
    expect(r.revenue).toBe(543000);
    expect(r.grossProfit).toBe(525000);
    expect(r.opexTotal).toBe(419800);
    expect(r.net).toBe(105200);
    expect(r.breakEvenOrders).toBe(2419);
  });

  it('responds to slider changes', () => {
    const r = runForecast({ ...BASE_2027, ordersPerMajlis: 100 });
    expect(r.orders).toBe(2000);
    expect(r.revenue).toBe(362000);
    expect(r.net).toBe(362000 - 18000 - 419800);
  });

  it('returns no break-even when commission is zero', () => {
    expect(runForecast({ ...BASE_2026, rate: 0 }).breakEvenOrders).toBe(Infinity);
  });
});
