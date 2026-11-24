/**
 * The Majlsna pro forma model, rebuilt from the team's workbook
 * ("Forecast Assumptions" + "Majlsna Income Statement" sheets).
 * All figures are AED estimates, not actual results.
 */

export interface OpexLines {
  wages: number;
  utilities: number;
  maintenance: number;
  development: number;
  security: number;
  professional: number;
}

export interface ForecastInputs {
  year: 2026 | 2027;
  majlises: number;
  /** Completed paid vendor service orders per majlis per year (not weddings). */
  ordersPerMajlis: number;
  avgPrice: number;
  rate: number;
  hosting: number;
  tax: number;
  opex: OpexLines;
}

export interface ForecastResult {
  orders: number;
  gross: number;
  revenue: number;
  costOfServices: number;
  grossProfit: number;
  opexTotal: number;
  netBeforeTax: number;
  net: number;
  perOrderCommission: number;
  breakEvenOrders: number;
}

/** Simple average of the four example services: (2100 + 1000 + 1750 + 4200) / 4. */
export const AVG_SERVICE_PRICE = 2262.5;

export const BASE_2026: ForecastInputs = {
  year: 2026,
  majlises: 1,
  ordersPerMajlis: 150,
  avgPrice: AVG_SERVICE_PRICE,
  rate: 0.08,
  hosting: 10000,
  tax: 0,
  opex: { wages: 18000, utilities: 600, maintenance: 6000, development: 80000, security: 6000, professional: 5000 },
};

export const BASE_2027: ForecastInputs = {
  year: 2027,
  majlises: 20,
  ordersPerMajlis: 150,
  avgPrice: AVG_SERVICE_PRICE,
  rate: 0.08,
  hosting: 18000,
  tax: 0,
  opex: { wages: 372600, utilities: 1200, maintenance: 12000, development: 12000, security: 12000, professional: 10000 },
};

const round2 = (n: number) => Math.round(n * 100) / 100;

export function sumOpex(o: OpexLines): number {
  return o.wages + o.utilities + o.maintenance + o.development + o.security + o.professional;
}

export function runForecast(i: ForecastInputs): ForecastResult {
  const orders = i.majlises * i.ordersPerMajlis;
  const gross = round2(orders * i.avgPrice);
  const revenue = round2(gross * i.rate);
  const costOfServices = i.hosting;
  const grossProfit = round2(revenue - costOfServices);
  const opexTotal = sumOpex(i.opex);
  const netBeforeTax = round2(grossProfit - opexTotal);
  const net = round2(netBeforeTax - i.tax);
  const perOrderCommission = round2(i.avgPrice * i.rate);
  const breakEvenOrders =
    perOrderCommission > 0 ? Math.ceil((opexTotal + i.hosting) / perOrderCommission) : Infinity;
  return { orders, gross, revenue, costOfServices, grossProfit, opexTotal, netBeforeTax, net, perOrderCommission, breakEvenOrders };
}

/** Pro forma balance sheet, copied from the workbook (simplified; loan not approved). */
export const BALANCE_SHEET = {
  2026: {
    cash: 53329.32,
    receivables: 520.68,
    prepaid: 1200,
    totalAssets: 55050,
    payables: 2000,
    accrued: 1500,
    currentLiabilities: 3500,
    loan: 150000,
    founders: 0,
    retained: -98450,
    equity: -98450,
    totalLiabEquity: 55050,
  },
  2027: {
    cash: 157936.3,
    receivables: 10413.7,
    prepaid: 2400,
    totalAssets: 170750,
    payables: 6000,
    accrued: 8000,
    currentLiabilities: 14000,
    loan: 150000,
    founders: 0,
    retained: 6750,
    equity: 6750,
    totalLiabEquity: 170750,
  },
} as const;

/** Full-year potential scenario from the workbook: 3 weddings/week x 4 services x 52 weeks. */
export const FULL_YEAR_ORDERS_PER_MAJLIS = 3 * 4 * 52;
