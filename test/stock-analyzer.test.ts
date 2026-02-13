import { StockAnalyzer } from '../src/stock-analyzer.js';
import { expectValidScore, expectValidSignal } from './test-utils.js';

describe('StockAnalyzer', () => {
  let analyzer: StockAnalyzer;

  beforeEach(() => {
    analyzer = new StockAnalyzer();
  });

  describe('basic functionality', () => {
    it('should be instantiable', () => {
      expect(analyzer).toBeInstanceOf(StockAnalyzer);
    });
  });

  describe('compareStocks', () => {
    it('should return array for empty input', async () => {
      const results = await analyzer.compareStocks([]);
      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBe(0);
    });
  });

  describe('findBestStocks', () => {
    it('should return empty array for empty input', async () => {
      const results = await analyzer.findBestStocks([], 'short', 5);
      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBe(0);
    });

    it('should accept valid timeframe values', async () => {
      const timeframes: ('short' | 'medium' | 'long')[] = ['short', 'medium', 'long'];
      for (const timeframe of timeframes) {
        const results = await analyzer.findBestStocks([], timeframe, 5);
        expect(results).toBeInstanceOf(Array);
      }
    });
  });
});
