import { StockAPIClient } from '../src/stock-api.js';
import { generateMockStockPrices } from './test-utils.js';

describe('StockAPIClient', () => {
  let apiClient: StockAPIClient;

  beforeEach(() => {
    apiClient = new StockAPIClient();
  });

  describe('calculateTechnicalIndicators', () => {
    it('should calculate SMA correctly', () => {
      const prices = generateMockStockPrices(250, 1000, 0.01);
      const indicators = apiClient.calculateTechnicalIndicators(prices);

      expect(indicators.sma20).toBeDefined();
      expect(indicators.sma50).toBeDefined();
      expect(indicators.sma200).toBeDefined();
      
      expect(indicators.sma20).toBeGreaterThan(0);
      expect(indicators.sma50).toBeGreaterThan(0);
      expect(indicators.sma200).toBeGreaterThan(0);
    });

    it('should calculate RSI within valid range', () => {
      const prices = generateMockStockPrices(100, 1000, 0.02);
      const indicators = apiClient.calculateTechnicalIndicators(prices);

      expect(indicators.rsi).toBeDefined();
      expect(indicators.rsi).toBeGreaterThanOrEqual(0);
      expect(indicators.rsi).toBeLessThanOrEqual(100);
    });

    it('should calculate MACD and signal line', () => {
      const prices = generateMockStockPrices(100, 1000, 0.02);
      const indicators = apiClient.calculateTechnicalIndicators(prices);

      expect(indicators.macd).toBeDefined();
      expect(indicators.signal).toBeDefined();
      
      expect(typeof indicators.macd).toBe('number');
      expect(typeof indicators.signal).toBe('number');
    });

    it('should handle ascending price trend', () => {
      const prices = generateMockStockPrices(100, 1000, 0.01).map((p: any, i: number) => ({
        ...p,
        close: 1000 + i * 5,
      }));

      const indicators = apiClient.calculateTechnicalIndicators(prices);

      expect(indicators.rsi).toBeGreaterThan(50);
    });

    it('should handle descending price trend', () => {
      const prices = generateMockStockPrices(100, 1000, 0.01).map((p: any, i: number) => ({
        ...p,
        close: 1000 - i * 5,
      }));

      const indicators = apiClient.calculateTechnicalIndicators(prices);

      expect(indicators.rsi).toBeLessThan(50);
    });

    it('should handle minimum data points', () => {
      const prices = generateMockStockPrices(30, 1000, 0.01);
      const indicators = apiClient.calculateTechnicalIndicators(prices);

      expect(indicators.sma20).toBeDefined();
      expect(indicators.rsi).toBeDefined();
      expect(indicators.macd).toBeDefined();
    });

    it('should handle volatile market', () => {
      const prices = generateMockStockPrices(100, 1000, 0.1);
      const indicators = apiClient.calculateTechnicalIndicators(prices);

      expect(indicators.rsi).toBeGreaterThanOrEqual(0);
      expect(indicators.rsi).toBeLessThanOrEqual(100);
    });
  });

  describe('edge cases', () => {
    it('should handle flat prices', () => {
      const prices = generateMockStockPrices(100, 1000, 0).map((p: any) => ({
        ...p,
        close: 1000,
        open: 1000,
        high: 1000,
        low: 1000,
      }));

      const indicators = apiClient.calculateTechnicalIndicators(prices);

      expect(indicators.rsi).toBeDefined();
      expect(indicators.macd).toBeDefined();
    });

    it('should handle price gaps', () => {
      const prices = generateMockStockPrices(100, 1000, 0.01);
      prices[50].close = prices[49].close * 1.2;

      const indicators = apiClient.calculateTechnicalIndicators(prices);

      expect(indicators.rsi).toBeGreaterThanOrEqual(0);
      expect(indicators.rsi).toBeLessThanOrEqual(100);
    });
  });
});
