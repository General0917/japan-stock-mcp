import { StockPrice } from '../src/stock-api.js';
import { FinancialData } from '../src/fundamentals-api.js';

/**
 * モック株価データ生成
 */
export function generateMockStockPrices(
  days: number = 30,
  basePrice: number = 1000,
  volatility: number = 0.02
): StockPrice[] {
  const prices: StockPrice[] = [];
  let currentPrice = basePrice;

  for (let i = 0; i < days; i++) {
    const change = (Math.random() - 0.5) * volatility * currentPrice;
    currentPrice += change;

    const open = currentPrice * (1 + (Math.random() - 0.5) * 0.01);
    const close = currentPrice * (1 + (Math.random() - 0.5) * 0.01);
    const high = Math.max(open, close) * (1 + Math.random() * 0.01);
    const low = Math.min(open, close) * (1 - Math.random() * 0.01);

    const date = new Date();
    date.setDate(date.getDate() - (days - i));

    prices.push({
      date: date.toISOString().split('T')[0],
      open,
      high,
      low,
      close,
      volume: Math.floor(Math.random() * 10000000) + 1000000,
    });
  }

  return prices;
}

/**
 * モック財務データ - 健全な企業
 */
export const mockHealthyCompany: FinancialData = {
  symbol: 'TEST1',
  companyName: 'テスト優良企業',
  marketCap: 1000000000000, // 1兆円
  per: 12.5,
  pbr: 1.2,
  eps: 150,
  dividendYield: 3.5,
  roe: 15.0,
  debtToEquity: 45,
  currentRatio: 2.5,
  operatingMargin: 12.0,
  profitMargin: 8.0,
  revenue: 500000000000,
  netIncome: 40000000000,
  totalAssets: 800000000000,
  totalDebt: 200000000000,
  shareholdersEquity: 400000000000,
};

/**
 * モック財務データ - 成長企業
 */
export const mockGrowthCompany: FinancialData = {
  symbol: 'TEST2',
  companyName: 'テスト成長企業',
  marketCap: 500000000000,
  per: 35.0,
  pbr: 5.5,
  eps: 80,
  dividendYield: 0.5,
  roe: 25.0,
  debtToEquity: 30,
  currentRatio: 3.0,
  operatingMargin: 20.0,
  profitMargin: 15.0,
  revenue: 200000000000,
  netIncome: 30000000000,
  totalAssets: 300000000000,
  totalDebt: 50000000000,
  shareholdersEquity: 200000000000,
};

/**
 * モック財務データ - 割安企業
 */
export const mockValueCompany: FinancialData = {
  symbol: 'TEST3',
  companyName: 'テスト割安企業',
  marketCap: 300000000000,
  per: 8.0,
  pbr: 0.7,
  eps: 200,
  dividendYield: 5.0,
  roe: 9.0,
  debtToEquity: 80,
  currentRatio: 1.8,
  operatingMargin: 8.0,
  profitMargin: 6.0,
  revenue: 400000000000,
  netIncome: 24000000000,
  totalAssets: 600000000000,
  totalDebt: 300000000000,
  shareholdersEquity: 350000000000,
};

/**
 * モック財務データ - データ欠損企業
 */
export const mockIncompleteCompany: FinancialData = {
  symbol: 'TEST4',
  companyName: 'テストデータ欠損企業',
  marketCap: 100000000000,
  per: null,
  pbr: null,
  eps: undefined,
  dividendYield: 0,
  roe: null,
  debtToEquity: undefined,
  currentRatio: null,
  operatingMargin: undefined,
  profitMargin: null,
  revenue: undefined,
  netIncome: null,
  totalAssets: undefined,
  totalDebt: null,
  shareholdersEquity: undefined,
};

/**
 * モック財務データ - 赤字企業
 */
export const mockDeficitCompany: FinancialData = {
  symbol: 'TEST5',
  companyName: 'テスト赤字企業',
  marketCap: 50000000000,
  per: -15.0,
  pbr: 0.5,
  eps: -50,
  dividendYield: 0,
  roe: -5.0,
  debtToEquity: 250,
  currentRatio: 0.8,
  operatingMargin: -3.0,
  profitMargin: -5.0,
  revenue: 100000000000,
  netIncome: -5000000000,
  totalAssets: 200000000000,
  totalDebt: 180000000000,
  shareholdersEquity: 20000000000,
};

/**
 * アサーションヘルパー
 */
export function expectValidScore(score: number): void {
  expect(score).toBeGreaterThanOrEqual(0);
  expect(score).toBeLessThanOrEqual(100);
}

export function expectValidSignal(signal: string): void {
  expect(['BUY', 'SELL', 'HOLD']).toContain(signal);
}

export function expectValidRecommendation(recommendation: string): void {
  expect(['STRONG_BUY', 'BUY', 'HOLD', 'SELL', 'STRONG_SELL']).toContain(recommendation);
}

export function expectValidRating(rating: string, validRatings: string[]): void {
  expect(validRatings).toContain(rating);
}
