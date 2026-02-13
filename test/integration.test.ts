/**
 * 統合テスト - 実際のワークフローをテスト
 */

import { StockAnalyzer } from '../src/stock-analyzer.js';
import { expectValidScore, expectValidSignal, expectValidRecommendation } from './test-utils.js';

describe('Integration Tests', () => {
  describe('Basic Instantiation', () => {
    it('should create StockAnalyzer instance', () => {
      const analyzer = new StockAnalyzer();
      expect(analyzer).toBeInstanceOf(StockAnalyzer);
    });
  });

  describe('Error Handling and Robustness', () => {
    let analyzer: StockAnalyzer;

    beforeEach(() => {
      analyzer = new StockAnalyzer();
    });

    it('should handle empty arrays', async () => {
      const emptyComparison = await analyzer.compareStocks([]);
      expect(emptyComparison).toBeInstanceOf(Array);
      expect(emptyComparison.length).toBe(0);
      
      const emptyBest = await analyzer.findBestStocks([], 'short', 5);
      expect(emptyBest).toBeInstanceOf(Array);
      expect(emptyBest.length).toBe(0);
    });
  });
});
